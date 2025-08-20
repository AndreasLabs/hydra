import sys
import os
from pathlib import Path

# Add the workflows directory to Python path
workflows_dir = Path(__file__).parent.parent
sys.path.insert(0, str(workflows_dir))

from prefect import flow
from prefect.logging import get_run_logger
from typing import List, Optional

from tasks.tasks_list_files import list_minio_objects
from tasks.task_create_asset import create_data_asset
from tasks.tasks_gps import extract_gps_coordinates


@flow
def ingest_flow(
    bucket_name: str,
    prefix: str = "",
    recursive: bool = True
) -> List[str]:
    """
    Flow that ingests data by listing objects in a MinIO bucket.
    
    Args:
        bucket_name (str): The name of the bucket to list objects from
        prefix (str): The prefix to filter objects (like a directory path)
        endpoint (str): MinIO server endpoint
        access_key (str): Access key (user ID) for MinIO
        secret_key (str): Secret key (password) for MinIO
        recursive (bool): List objects recursively if True
        
    Returns:
        List[str]: A list of object names found in the bucket with the given prefix
    """
    logger = get_run_logger()
    logger.info(f"Starting ingest flow for bucket: {bucket_name}")
    
    # Call the list_minio_objects task
    objects = list_minio_objects(
        bucket_name=bucket_name,
        prefix=prefix,
        recursive=recursive
    )
    
    # Extract GPS coordinates (if present) per image object
    for obj in objects:
        try:
            extract_gps_coordinates(
                minio_objects=[obj],
                bucket_name=bucket_name
            )
        except Exception:
            # Continue ingest even if GPS extraction fails for this object
            continue
    
    # Create data asset for each object
    asset_ids = []
    for obj in objects:
        asset_id = create_data_asset(
            minio_objects=[obj],
            bucket_name=bucket_name,
            asset_type="raw_data"
        )
        if asset_id:
            asset_ids.append(asset_id)
    
    logger.info(f"Ingest flow completed. Found {len(objects)} objects and created {len(asset_ids)} assets.")
    return [obj.object_name for obj in objects]


if __name__ == "__main__":
    # Example usage
    files = ingest_flow(bucket_name="hydra-data", prefix="ingest/")
    print(f"Found {len(files)} files")
