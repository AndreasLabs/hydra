import sys
import os
from pathlib import Path

# Add the workflows directory to Python path
workflows_dir = Path(__file__).parent.parent
sys.path.insert(0, str(workflows_dir))

from prefect import flow
from prefect.logging import get_run_logger
from typing import List, Optional, Dict

from tasks.tasks_list_files import list_minio_objects
from tasks.tasks_odm import process_images_with_odm, upload_directory_to_minio
from tasks.task_create_asset import create_data_asset


@flow
def process_drone_imagery(
    bucket_name: str,
    prefix: str = "/",
    odm_options: Optional[Dict] = None,
    node_url: str = "localhost",
    node_port: int = 3000,
    output_dir: str = "./odm_results",
    recursive: bool = True,
    results_bucket_name: Optional[str] = None,
    results_prefix: Optional[str] = None,
) -> Dict:
    """
    Flow that processes drone imagery using OpenDroneMap.
    
    This flow:
    1. Lists all images in the specified MinIO bucket/prefix
    2. Downloads and processes them with ODM
    3. Stores results and creates artifacts
    
    Args:
        bucket_name (str): The MinIO bucket containing drone images
        prefix (str): The prefix/path within the bucket containing images
        odm_options (Dict, optional): OpenDroneMap processing options
        node_url (str): URL of the ODM node
        node_port (int): Port of the ODM node
        output_dir (str): Where to store ODM results
        recursive (bool): Whether to search for images recursively
        
    Returns:
        Dict: Contains ODM task info, output paths, and processing statistics
    """
    logger = get_run_logger()
    logger.info(f"Starting drone imagery processing flow for bucket: {bucket_name}")
    
    # List all image objects in the bucket
    logger.info(f"Listing images in {bucket_name}/{prefix}")
    objects = list_minio_objects(
        bucket_name=bucket_name,
        prefix=prefix,
        recursive=recursive
    )
    
    if not objects:
        logger.warning(f"No images found in {bucket_name}/{prefix}")
        return {
            "status": "no_images",
            "message": f"No images found in {bucket_name}/{prefix}"
        }
    
    # Filter for common image extensions
    image_extensions = ('.jpg', '.jpeg', '.tif', '.tiff', '.png')
    image_objects = [
        obj for obj in objects 
        if obj.object_name.lower().endswith(image_extensions)
    ]
    
    if not image_objects:
        logger.warning(f"No supported image files found in {len(objects)} objects")
        return {
            "status": "no_supported_images",
            "message": "No supported image files found",
            "total_objects": len(objects)
        }
    
    logger.info(f"Found {len(image_objects)} images to process")
    
    # Configure MinIO access for the ODM task
    minio_config = {
        "endpoint": "localhost:9000",  # Can be parameterized if needed
        "access_key": "minioadmin",
        "secret_key": "minioadmin"
    }
    
    # Process images with ODM
    result = process_images_with_odm(
        images=image_objects,
        odm_options=odm_options,
        node_url=node_url,
        node_port=node_port,
        output_dir=output_dir,
        minio_config=minio_config
    )
    
    # Upload results back to MinIO
    assets_created = {}
    try:
        results_bucket = results_bucket_name or bucket_name
        # Derive a reasonable results prefix
        default_prefix = f"odm_results/{Path(output_dir).name}"
        run_prefix = (results_prefix or default_prefix).strip("/")

        uploaded_keys = upload_directory_to_minio(
            local_dir=result["output_dir"],
            bucket_name=results_bucket,
            prefix=run_prefix,
            endpoint=minio_config["endpoint"],
            access_key=minio_config["access_key"],
            secret_key=minio_config["secret_key"],
            secure=False,
        )

        # Group uploaded objects by known ODM product directories/files
        known_products = [
            "odm_dem",
            "entwine_pointcloud",
            "odm_orthophoto",
            "odm_report",
            "odm_georeferencing",
            "odm_texturing",
            "log.json",
            "images.json",
            "task_output.txt",
            "cameras.json",
        ]

        for product in known_products:
            if product.endswith('.json') or product.endswith('.txt'):
                # Single file
                key = f"{run_prefix}/{product}"
                matched = [k for k in uploaded_keys if k == key]
            else:
                # Directory
                prefix_key = f"{run_prefix}/{product}/"
                matched = [k for k in uploaded_keys if k.startswith(prefix_key)]

            if matched:
                try:
                    asset = create_data_asset(
                        minio_objects=matched,
                        bucket_name=results_bucket,
                        asset_type=product,
                    )
                    assets_created[product] = asset
                except Exception as e:
                    logger.warning(f"Failed to create asset for {product}: {e}")

    except Exception as e:
        logger.warning(f"Failed to upload results to MinIO or create assets: {e}")

    # Enhance the result with flow-level information
    final_result = {
        **result,
        "flow_stats": {
            "total_objects_found": len(objects),
            "total_images_processed": len(image_objects),
            "bucket_name": bucket_name,
            "prefix": prefix
        },
        "results_bucket": results_bucket_name or bucket_name,
        "results_prefix": (results_prefix or f"odm_results/{Path(output_dir).name}").strip("/"),
        "assets_created": assets_created,
    }
    
    logger.info(
        f"Flow completed successfully. Processed {len(image_objects)} images. "
        f"Results stored in {output_dir}"
    )
    
    return final_result


if __name__ == "__main__":
    # Example usage
    result = process_drone_imagery(
        bucket_name="hydra-data",
        prefix="ingest/",
        odm_options={
            "dsm": True,
            "orthophoto-resolution": 4,
            "dem-resolution": 4,
            "pc-quality": "medium"
        },
        output_dir="./odm_results/site-1"
    )
    print(f"Processing completed. Results in {result['output_dir']}")
