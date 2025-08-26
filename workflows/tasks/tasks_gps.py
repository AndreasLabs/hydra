from typing import List
from prefect import task
from prefect.logging import get_run_logger
import pandas as pd
from exif import Image
from minio.datatypes import Object as MinioObject
from io import BytesIO
import json
import os
import re
import hashlib

@task
def extract_gps_coordinates(
    minio_objects: List[MinioObject],
    bucket_name: str,
    endpoint: str = "localhost:9050", 
    access_key: str = "minioadmin",
    secret_key: str = "minioadmin"
) -> pd.DataFrame:
    """
    Extract GPS coordinates from image metadata for a list of MinIO objects.
    
    Args:
        minio_objects (List[MinioObject]): List of MinIO objects containing image files
        bucket_name (str): Name of the MinIO bucket
        endpoint (str): MinIO server endpoint
        access_key (str): MinIO access key
        secret_key (str): MinIO secret key
        
    Returns:
        pd.DataFrame: DataFrame containing filename, latitude and longitude
    """
    logger = get_run_logger()
    logger.info(f"Extracting GPS coordinates from {len(minio_objects)} objects")

    from minio import Minio
    client = Minio(
        endpoint=endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=False
    )

    data = []
    for obj in minio_objects:
        try:
            # Get object data from MinIO
            response = client.get_object(bucket_name, obj.object_name)
            img_bytes = BytesIO(response.read())
            try:
                response.close()
                response.release_conn()
            except Exception:
                pass
            
            # Extract EXIF data
            img = Image(img_bytes)
            
            if img.has_exif and hasattr(img, 'gps_latitude') and hasattr(img, 'gps_longitude'):
                lat = _convert_to_decimal(img.gps_latitude, img.gps_latitude_ref)
                lon = _convert_to_decimal(img.gps_longitude, img.gps_longitude_ref)
                
                # Ensure JSON-serializable values (especially timestamps)
                last_modified_value = (
                    obj.last_modified.isoformat() if hasattr(obj.last_modified, "isoformat") else str(obj.last_modified)
                )
                data.append({
                    'filename': obj.object_name,
                    'latitude': float(lat),
                    'longitude': float(lon),
                    'size': int(obj.size),
                    'last_modified': last_modified_value
                })
                logger.debug(f"Extracted coordinates from {obj.object_name}: ({lat}, {lon})")
            else:
                logger.warning(f"No GPS data found in {obj.object_name}")
                
        except Exception as e:
            logger.error(f"Error processing {obj.object_name}: {str(e)}")
            continue

    df = pd.DataFrame(data)
    
    if not df.empty:
        logger.info(f"Successfully extracted coordinates from {len(df)} images")
        # Save per-image GPS metadata to MinIO in meta/ directory
        for _, row in df.iterrows():
            try:
                base_name = os.path.basename(str(row["filename"]))
                json_key = f"meta/{base_name}.gps.json"
                # Build a single-record JSON payload for this image
                payload = {
                    "filename": row["filename"],
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "size": int(row["size"]),
                    "last_modified": str(row["last_modified"])
                }
                buffer = BytesIO(json.dumps(payload).encode("utf-8"))
                buffer.seek(0)
                client.put_object(
                    bucket_name=bucket_name,
                    object_name=json_key,
                    data=buffer,
                    length=buffer.getbuffer().nbytes,
                    content_type="application/json"
                )
                logger.debug(f"Wrote GPS JSON to s3://{bucket_name}/{json_key}")
            except Exception as e:
                logger.error(f"Failed to write GPS JSON for {row.get('filename')}: {e}")
        
        # Create table artifact to visualize the results
        from prefect.artifacts import create_table_artifact
        # Convert to JSON-safe Python objects
        df_art = df.head(10).copy()
        if 'last_modified' in df_art.columns:
            df_art['last_modified'] = df_art['last_modified'].astype(str)
        records = json.loads(df_art.to_json(orient='records'))
        # Use a unique, sanitized artifact key when processing a single image to avoid collisions
        artifact_key = "gps-coordinates"
        if len(df) == 1 and 'filename' in df.columns:
            single_name = str(df.iloc[0]['filename'])
            base_name = os.path.basename(single_name).lower()
            # allow only lowercase letters, numbers, and dashes
            sanitized = re.sub(r"[^a-z0-9-]+", "-", base_name)
            sanitized = re.sub(r"-+", "-", sanitized).strip("-")
            short_hash = hashlib.sha1(single_name.encode("utf-8")).hexdigest()[:8]
            artifact_key = f"gps-coordinates-{sanitized}-{short_hash}" if sanitized else f"gps-coordinates-{short_hash}"
        create_table_artifact(
            key=artifact_key,
            table=records,
            description=f"# GPS Coordinates Extracted\nTotal images processed: {len(df)}"
        )
    else:
        logger.warning("No GPS coordinates were extracted from any images")

    return df

def _convert_to_decimal(coords, ref):
    """Convert GPS coordinates from degrees/minutes/seconds to decimal degrees"""
    decimal = coords[0] + coords[1] / 60 + coords[2] / 3600
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal
