import boto3
from urllib.parse import urlparse


def download_image_from_s3(s3_url: str) -> bytes:
    """Download image from S3 URL and return as bytes.
    
    Args:
        s3_url: S3 image URL (e.g., s3://bucket-name/path/to/image.jpg)
        
    Returns:
        Image data as bytes
        
    Raises:
        Exception: When S3 download fails
    """
    try:
        # Parse S3 URL
        parsed_url = urlparse(s3_url)
        if parsed_url.scheme != 's3':
            raise ValueError(f"Invalid S3 URL: {s3_url}")
        
        bucket_name = parsed_url.netloc
        object_key = parsed_url.path.lstrip('/')
        
        # Create S3 client
        s3_client = boto3.client('s3')
        
        # Download object from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        image_bytes = response['Body'].read()
        
        return image_bytes
        
    except Exception as e:
        raise Exception(f"Failed to download image from S3: {str(e)}")
