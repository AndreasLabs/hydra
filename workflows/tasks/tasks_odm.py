from typing import List, Optional, Dict
from prefect import task
from pyodm import Node, exceptions
from prefect.logging import get_run_logger
from prefect.artifacts import create_table_artifact
import os
import tempfile
from minio import Minio
from minio.error import S3Error
from pathlib import Path


@task
def process_images_with_odm(
    images: List,
    odm_options: Optional[Dict] = None,
    node_url: str = "localhost",
    node_port: int = 3000,
    output_dir: str = "./odm_results",
    minio_config: Optional[Dict] = None,
    stream_progress: bool = True,
    stream_console: bool = True,
) -> Dict:
    """
    Process images using OpenDroneMap via PyODM.
    
    Args:
        images: List of MinIO objects from list_minio_objects task
        odm_options: Dictionary of ODM processing options
        node_url: ODM node URL
        node_port: ODM node port
        output_dir: Directory to save results
        minio_config: Optional MinIO configuration for downloading images
        
    Returns:
        Dict containing task info and output paths
    """
    logger = get_run_logger()
    logger.info(f"Starting ODM processing with {len(images)} images")
    
    # Default ODM options
    default_options = {
        'dsm': True,
        'orthophoto-resolution': 4,
        'dem-resolution': 4,
        'pc-quality': 'medium'
    }
    
    # Merge with user provided options
    options = {**default_options, **(odm_options or {})}
    
    try:
        # If MinIO config is provided, download images to temp dir first
        if minio_config:
            logger.info("Downloading images from MinIO...")
            client = Minio(
                endpoint=minio_config.get('endpoint', 'localhost:9000'),
                access_key=minio_config.get('access_key', 'minioadmin'),
                secret_key=minio_config.get('secret_key', 'minioadmin'),
                secure=False
            )
            
            with tempfile.TemporaryDirectory() as temp_dir:
                local_paths = []
                for obj in images:
                    # Use object properties directly from MinIO objects
                    bucket_name = obj.bucket_name
                    object_name = obj.object_name
                    local_path = os.path.join(temp_dir, os.path.basename(object_name))
                    
                    client.fget_object(bucket_name, object_name, local_path)
                    local_paths.append(local_path)
                
                return run_odm_task(
                    image_paths=local_paths,
                    options=options,
                    node_url=node_url,
                    node_port=node_port,
                    output_dir=output_dir,
                    stream_progress=stream_progress,
                    stream_console=stream_console,
                )
        else:
            # Use paths directly if they're local
            # Convert MinIO objects to paths if needed
            local_paths = [obj.object_name if hasattr(obj, 'object_name') else obj for obj in images]
            return run_odm_task(
                image_paths=local_paths,
                options=options,
                node_url=node_url,
                node_port=node_port,
                output_dir=output_dir,
                stream_progress=stream_progress,
                stream_console=stream_console,
            )
            
    except Exception as e:
        logger.error(f"ODM processing failed: {str(e)}")
        raise


def run_odm_task(
    image_paths: List[str],
    options: Dict,
    node_url: str,
    node_port: int,
    output_dir: str,
    stream_progress: bool = True,
    stream_console: bool = True,
) -> Dict:
    """Helper function to run the actual ODM task"""
    logger = get_run_logger()
    
    # Initialize ODM node
    node = Node(node_url, node_port)
    
    try:
        logger.info(f"Creating ODM task with options: {options}")
        task = node.create_task(image_paths, options)
        
        # Create artifact with initial task info
        create_table_artifact(
            key="odm-task-info",
            table=[{
                "task_id": task.info().uuid,
                "status": getattr(task.info().status, "name", str(task.info().status)),
                "options": str(options),
                "image_count": len(image_paths)
            }],
            description="ODM Task Information"
        )
        
        logger.info("Waiting for ODM processing to complete...")

        last_output_line_index = 0

        def status_callback(info):
            # Log incremental status/progress
            try:
                if stream_progress:
                    progress_pct = getattr(info, "progress", None)
                    status_name = getattr(getattr(info, "status", None), "name", str(getattr(info, "status", None)))
                    logger.info(f"ODM status: {status_name}, progress: {progress_pct}%")

                if stream_console:
                    nonlocal last_output_line_index
                    new_lines = task.output(last_output_line_index) or []
                    if new_lines:
                        for line in new_lines:
                            logger.info(f"ODM: {line}")
                        last_output_line_index += len(new_lines)
            except Exception as cb_err:
                # Swallow errors in callback to avoid interrupting processing
                logger.warning(f"Progress callback error: {cb_err}")

        task.wait_for_completion(status_callback=status_callback if (stream_progress or stream_console) else None)
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        logger.info(f"Downloading results to {output_dir}")
        task.download_assets(output_dir)
        
        # Get list of generated files
        output_files = os.listdir(output_dir)
        logger.info(f"Generated files: {output_files}")
        
        # Create artifact with output files
        create_table_artifact(
            key="odm-output-files",
            table=[{"file": f, "path": os.path.join(output_dir, f)} for f in output_files],
            description=f"ODM Output Files in {output_dir}"
        )
        
        info = task.info()
        task_info_dict = {
            "uuid": getattr(info, "uuid", None),
            "name": getattr(info, "name", None),
            "date_created": getattr(info, "date_created", None),
            "processing_time": getattr(info, "processing_time", None),
            "status": getattr(getattr(info, "status", None), "name", str(getattr(info, "status", None))),
            "last_error": getattr(info, "last_error", None),
            "options": str(getattr(info, "options", None)),
            "images_count": getattr(info, "images_count", None),
            "progress": getattr(info, "progress", None),
        }

        return {
            "task_info": task_info_dict,
            "output_dir": output_dir,
            "output_files": output_files
        }
        
    except exceptions.TaskFailedError as e:
        logger.error("ODM task failed")
        logger.error("\n".join(task.output()))
        raise
    except exceptions.NodeConnectionError as e:
        logger.error(f"Cannot connect to ODM node: {str(e)}")
        raise
    except exceptions.NodeResponseError as e:
        logger.error(f"ODM node error: {str(e)}")
        raise


@task
def upload_directory_to_minio(
    local_dir: str,
    bucket_name: str,
    prefix: str = "",
    endpoint: str = "localhost:9000",
    access_key: str = "minioadmin",
    secret_key: str = "minioadmin",
    secure: bool = False,
) -> List[str]:
    """
    Recursively upload a local directory to a MinIO bucket under a given prefix.

    Returns a list of uploaded object keys.
    """
    logger = get_run_logger()

    local_path = Path(local_dir)
    if not local_path.exists() or not local_path.is_dir():
        raise ValueError(f"Local directory does not exist or is not a directory: {local_dir}")

    client = Minio(
        endpoint=endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=secure,
    )

    # Ensure bucket exists
    try:
        if not client.bucket_exists(bucket_name):
            logger.info(f"Bucket '{bucket_name}' does not exist. Creating it.")
            client.make_bucket(bucket_name)
    except S3Error as e:
        logger.error(f"Error ensuring bucket exists: {e}")
        raise

    uploaded_keys: List[str] = []
    base_len = len(str(local_path))

    # Normalize prefix (remove leading/trailing slashes)
    norm_prefix = prefix.strip("/")

    for root, _, files in os.walk(local_path):
        for filename in files:
            file_path = Path(root) / filename
            # Compute relative path from local_dir
            rel_path = file_path.relative_to(local_path)
            # Compose object name with POSIX separators
            object_name = str(Path(norm_prefix) / rel_path).replace("\\", "/") if norm_prefix else str(rel_path).replace("\\", "/")

            try:
                client.fput_object(
                    bucket_name=bucket_name,
                    object_name=object_name,
                    file_path=str(file_path),
                )
                uploaded_keys.append(object_name)
                logger.info(f"Uploaded: {object_name}")
            except S3Error as e:
                logger.error(f"Failed to upload {file_path} -> {object_name}: {e}")
                raise

    logger.info(f"Uploaded {len(uploaded_keys)} objects to {bucket_name}/{norm_prefix}")
    return uploaded_keys