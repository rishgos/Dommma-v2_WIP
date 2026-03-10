"""
Cloudflare R2 Storage Service for DOMMMA
Handles file uploads, downloads, and management using S3-compatible API
"""

import os
import uuid
import logging
from datetime import datetime
from typing import Optional, BinaryIO
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# R2 Configuration
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY = os.environ.get('R2_ACCESS_KEY')
R2_SECRET_KEY = os.environ.get('R2_SECRET_KEY')
R2_ENDPOINT = os.environ.get('R2_ENDPOINT')
R2_BUCKET = os.environ.get('R2_BUCKET', 'dommma-files')

# Public URL for accessing files (can be customized with custom domain)
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL', f"https://pub-{R2_ACCOUNT_ID}.r2.dev")

# Initialize S3 client for R2
def get_r2_client():
    """Get configured R2 client"""
    if not all([R2_ACCESS_KEY, R2_SECRET_KEY, R2_ENDPOINT]):
        logger.warning("R2 credentials not configured")
        return None
    
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(
            signature_version='s3v4',
            s3={'addressing_style': 'path'}
        ),
        region_name='auto'
    )

# File type configurations
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
ALLOWED_DOCUMENT_TYPES = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv',
    'application/json',
    'application/octet-stream'  # Allow generic binary files
]
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def generate_file_key(folder: str, filename: str, user_id: Optional[str] = None) -> str:
    """Generate a unique file key for R2 storage"""
    # Clean filename
    clean_name = "".join(c for c in filename if c.isalnum() or c in '._-')
    
    # Generate unique prefix
    date_prefix = datetime.now().strftime('%Y/%m/%d')
    unique_id = str(uuid.uuid4())[:8]
    
    if user_id:
        return f"{folder}/{user_id}/{date_prefix}/{unique_id}_{clean_name}"
    return f"{folder}/{date_prefix}/{unique_id}_{clean_name}"


async def upload_file(
    file_data: BinaryIO,
    filename: str,
    content_type: str,
    folder: str = "uploads",
    user_id: Optional[str] = None,
    metadata: Optional[dict] = None
) -> dict:
    """
    Upload a file to Cloudflare R2
    
    Args:
        file_data: File content as bytes or file-like object
        filename: Original filename
        content_type: MIME type of the file
        folder: Storage folder (uploads, properties, documents, avatars)
        user_id: Optional user ID for organizing files
        metadata: Optional metadata to store with file
    
    Returns:
        dict with url, key, size, content_type
    """
    client = get_r2_client()
    if not client:
        raise Exception("R2 storage not configured")
    
    # Validate content type
    if folder == "properties" and content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError(f"Invalid image type: {content_type}")
    if folder == "documents" and content_type not in ALLOWED_DOCUMENT_TYPES + ALLOWED_IMAGE_TYPES:
        raise ValueError(f"Invalid document type: {content_type}")
    
    # Generate file key
    key = generate_file_key(folder, filename, user_id)
    
    # Read file data if it's a file-like object
    if hasattr(file_data, 'read'):
        content = file_data.read()
    else:
        content = file_data
    
    # Check file size
    file_size = len(content)
    if file_size > MAX_FILE_SIZE:
        raise ValueError(f"File too large: {file_size} bytes (max {MAX_FILE_SIZE})")
    
    # Prepare metadata
    extra_args = {
        'ContentType': content_type,
        'CacheControl': 'public, max-age=31536000',  # 1 year cache for immutable files
    }
    
    if metadata:
        extra_args['Metadata'] = {k: str(v) for k, v in metadata.items()}
    
    try:
        # Upload to R2
        client.put_object(
            Bucket=R2_BUCKET,
            Key=key,
            Body=content,
            **extra_args
        )
        
        # Generate public URL
        public_url = f"{R2_ENDPOINT}/{R2_BUCKET}/{key}"
        
        logger.info(f"File uploaded to R2: {key} ({file_size} bytes)")
        
        return {
            "url": public_url,
            "key": key,
            "size": file_size,
            "content_type": content_type,
            "filename": filename,
            "uploaded_at": datetime.now().isoformat()
        }
        
    except ClientError as e:
        logger.error(f"R2 upload error: {e}")
        raise Exception(f"Failed to upload file: {e}")


async def upload_property_image(
    file_data: BinaryIO,
    filename: str,
    content_type: str,
    property_id: str,
    user_id: str
) -> dict:
    """Upload a property listing image"""
    return await upload_file(
        file_data=file_data,
        filename=filename,
        content_type=content_type,
        folder=f"properties/{property_id}",
        user_id=user_id,
        metadata={"property_id": property_id, "type": "listing_image"}
    )


async def upload_document(
    file_data: BinaryIO,
    filename: str,
    content_type: str,
    user_id: str,
    document_type: str = "general"
) -> dict:
    """Upload a document (lease, contract, etc.)"""
    return await upload_file(
        file_data=file_data,
        filename=filename,
        content_type=content_type,
        folder="documents",
        user_id=user_id,
        metadata={"document_type": document_type}
    )


async def upload_avatar(
    file_data: BinaryIO,
    filename: str,
    content_type: str,
    user_id: str
) -> dict:
    """Upload a user avatar"""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError("Avatar must be an image")
    
    return await upload_file(
        file_data=file_data,
        filename=filename,
        content_type=content_type,
        folder="avatars",
        user_id=user_id
    )


async def upload_contractor_portfolio(
    file_data: BinaryIO,
    filename: str,
    content_type: str,
    contractor_id: str
) -> dict:
    """Upload a contractor portfolio image"""
    return await upload_file(
        file_data=file_data,
        filename=filename,
        content_type=content_type,
        folder=f"contractors/{contractor_id}/portfolio",
        metadata={"type": "portfolio"}
    )


async def delete_file(key: str) -> bool:
    """Delete a file from R2"""
    client = get_r2_client()
    if not client:
        return False
    
    try:
        client.delete_object(Bucket=R2_BUCKET, Key=key)
        logger.info(f"File deleted from R2: {key}")
        return True
    except ClientError as e:
        logger.error(f"R2 delete error: {e}")
        return False


async def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL for temporary file access"""
    client = get_r2_client()
    if not client:
        raise Exception("R2 storage not configured")
    
    try:
        url = client.generate_presigned_url(
            'get_object',
            Params={'Bucket': R2_BUCKET, 'Key': key},
            ExpiresIn=expires_in
        )
        return url
    except ClientError as e:
        logger.error(f"R2 presigned URL error: {e}")
        raise Exception(f"Failed to generate URL: {e}")


async def list_files(prefix: str, max_keys: int = 100) -> list:
    """List files in a folder"""
    client = get_r2_client()
    if not client:
        return []
    
    try:
        response = client.list_objects_v2(
            Bucket=R2_BUCKET,
            Prefix=prefix,
            MaxKeys=max_keys
        )
        
        files = []
        for obj in response.get('Contents', []):
            files.append({
                "key": obj['Key'],
                "size": obj['Size'],
                "last_modified": obj['LastModified'].isoformat()
            })
        
        return files
    except ClientError as e:
        logger.error(f"R2 list error: {e}")
        return []


def is_r2_configured() -> bool:
    """Check if R2 is properly configured"""
    return all([R2_ACCESS_KEY, R2_SECRET_KEY, R2_ENDPOINT, R2_BUCKET])
