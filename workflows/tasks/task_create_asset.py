from typing import List, Optional, Union
from prefect import task
from prefect.logging import get_run_logger
import uuid

from generated.prisma import Prisma
from generated.prisma.enums import StorageType


@task
def create_data_asset(
    minio_objects: List[Union[str, object]],
    bucket_name: str,
    asset_type: str = "raw_data",
    owner_uuid: Optional[str] = None,
    storage_type: StorageType = StorageType.OBJECT
) -> str:
    """
    Creates a data asset record in the database for MinIO objects.
    
    Args:
        minio_objects (List): List of MinIO objects from list_minio_objects task
        bucket_name (str): The name of the bucket containing the objects
        asset_type (str): Type of asset being created
        owner_uuid (Optional[str]): UUID of the owner, generates a new UUID if None
        storage_type (StorageType): Type of storage (OBJECT or TABLE)
        
    Returns:
        str: ID of the created data asset
    """
    logger = get_run_logger()
    
    if not minio_objects:
        logger.warning("No objects provided to create data asset")
        return None
    
    # Use provided owner_uuid or generate a new one
    if owner_uuid is None:
        owner_uuid = str(uuid.uuid4())
    
    # Normalize input into list of object key strings
    def to_key(item: Union[str, object]) -> str:
        return item if isinstance(item, str) else getattr(item, "object_name", str(item))

    object_keys = [to_key(obj) for obj in minio_objects]

    # Compute common prefix path across keys
    if len(object_keys) == 1:
        path = f"{bucket_name}/{object_keys[0]}"
    else:
        # Find longest common path prefix based on '/'
        split_paths = [key.strip("/").split("/") for key in object_keys if key]
        common_parts = []
        for parts in zip(*split_paths):
            if all(part == parts[0] for part in parts):
                common_parts.append(parts[0])
            else:
                break
        common_prefix = "/".join(common_parts)
        path = f"{bucket_name}/{common_prefix}" if common_prefix else bucket_name
    
    logger.info(f"Creating data asset for path: {path}")
    
    try:
        # Initialize Prisma client
        prisma = Prisma()
        prisma.connect()
        
        # Create data asset record
        data_asset = prisma.dataasset.create(
            data={
                "path": path,
                "storage_type": storage_type,
                "storage_location": bucket_name,
                "asset_type": asset_type,
                "owner_uuid": owner_uuid
            }
        )

        print(data_asset)
        logger.info(f"Created data asset with ID: {data_asset}")
        return data_asset
        
    except Exception as e:
        logger.error(f"Error creating data asset: {e}")
        raise