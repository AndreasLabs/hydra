from typing import List
from prefect import task
from minio import Minio
from minio.error import S3Error
from prefect.logging import get_run_logger



@task
def list_minio_objects(
    bucket_name: str,
    prefix: str = "ingest/",
    endpoint: str = "localhost:9000",
    access_key: str = "minioadmin",
    secret_key: str = "minioadmin",
    recursive: bool = True
) -> List[str]:
    """
    Lists all objects in a MinIO bucket with the given prefix.
    
    Args:
        bucket_name (str): The name of the bucket to list objects from
        prefix (str): The prefix to filter objects (like a directory path)
        endpoint (str): MinIO server endpoint
        access_key (str): Access key (user ID) for MinIO
        secret_key (str): Secret key (password) for MinIO
        secure (bool): Use HTTPS if True, HTTP if False
        recursive (bool): List objects recursively if True
        
    Returns:
        List[str]: A list of object names found in the bucket with the given prefix
    """
    logger = get_run_logger()
    logger.info(f"Listing objects in bucket: {bucket_name} with prefix: {prefix}")
    
    try:
        # Initialize MinIO client
        client = Minio(
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=False
        )
        
        # Check if bucket exists
        if not client.bucket_exists(bucket_name):
            raise ValueError(f"Bucket '{bucket_name}' does not exist")
        
        # List objects in the bucket with the given prefix
        objects = client.list_objects(
            bucket_name=bucket_name,
            prefix=prefix,
            recursive=recursive
        )
        
        all_objects = [obj for obj in objects]
        # Extract object names
        logger.info(f"Found {len(all_objects)} objects in bucket '{bucket_name}'")
        
        # Create a table artifact to visualize the objects found
        from prefect.artifacts import create_table_artifact
        
        # Convert objects to a format suitable for table artifact
        object_data = []
        # Limit to first 10 objects to avoid large tables
        for obj in all_objects[:10]:
            row = {
                "object_name": obj.object_name,
                "size": obj.size,
                "last_modified": str(obj.last_modified),
                "etag": obj.etag,
                "bucket_name": bucket_name,
                "storage_class": getattr(obj, "storage_class", "STANDARD"),
                "is_dir": getattr(obj, "is_dir", False)
            }
            object_data.append(row)
        if object_data:
            create_table_artifact(
                key=f"minio-objects-{bucket_name}",
                table=object_data,
                description=f"# Objects in MinIO bucket: {bucket_name}\nPrefix: {prefix}"
            )
        
        return all_objects
        
    except S3Error as e:
        raise Exception(f"Error listing objects: {e}")

