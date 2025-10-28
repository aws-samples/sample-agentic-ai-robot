import boto3
import requests
import json
import logging
from bedrock_agentcore.identity.auth import requires_access_token
from config.config import Config

logger = logging.getLogger(__name__)

# Global config instance
_config = None

def get_config():
    global _config
    if _config is None:
        _config = Config.from_config_file()
    return _config

def get_bearer_token_from_secret_manager():
    """
    Get bearer token from AWS Secrets Manager
    """
    try:
        config = get_config()
        secret_name = config.secret_name
        region = config.region
        
        if not secret_name:
            logger.info("No secret_name found in config")
            return None
            
        logger.info(f"Debug - Getting bearer token from secret: {secret_name}")
        
        session = boto3.Session()
        client = session.client('secretsmanager', region_name=region)
        response = client.get_secret_value(SecretId=secret_name)
        bearer_token_raw = response['SecretString']
        
        token_data = json.loads(bearer_token_raw)        
        if 'bearer_token' in token_data:
            bearer_token = token_data['bearer_token']
            logger.info("Successfully retrieved bearer token from secret manager")
            return bearer_token
        else:
            logger.info("No bearer token found in secret manager")
            return None
    
    except Exception as e:
        logger.info(f"Error getting stored token from secret manager: {e}")
        return None

def save_bearer_token_to_secret_manager(bearer_token):
    """
    Save bearer token to AWS Secrets Manager 
    """
    try:
        config = get_config()
        secret_name = config.secret_name
        region = config.region
        
        if not secret_name:
            logger.info("No secret_name found in config, cannot save token")
            return False
            
        logger.info(f"Debug - Saving bearer token to secret: {secret_name}")
        
        session = boto3.Session()
        client = session.client('secretsmanager', region_name=region)
        
        # Create secret value with bearer_key 
        secret_value = {
            "bearer_key": config.bearer_key,
            "bearer_token": bearer_token
        }
        
        # Convert to JSON string
        secret_string = json.dumps(secret_value)
        
        # Check if secret already exists
        try:
            client.describe_secret(SecretId=secret_name)
            # Secret exists, update it
            client.put_secret_value(
                SecretId=secret_name,
                SecretString=secret_string
            )
            logger.info(f"Bearer token updated in secret manager with key: {secret_value['bearer_key']}")
        except client.exceptions.ResourceNotFoundException:
            # Secret doesn't exist, create it
            client.create_secret(
                Name=secret_name,
                SecretString=secret_string,
                Description=config.secret_description
            )
            logger.info(f"Bearer token created in secret manager with key: {secret_value['bearer_key']}")
            
        return True
            
    except Exception as e:
        logger.info(f"Error saving bearer token to secret manager: {e}")
        return False

def refresh_bearer_token_if_needed(bearer_token, test_url=None):
    """
    Test if bearer token is valid and refresh if needed (like GitHub code)
    """
    if not test_url:
        config = get_config()
        test_url = config.gateway_url
    
    if not test_url or not bearer_token:
        return bearer_token
    
    try:
        logger.info("Testing bearer token validity...")
        headers = {
            "Authorization": f"Bearer {bearer_token}",
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream"
        }
        
        # Simple test request
        test_body = json.dumps({
            "jsonrpc": config.jsonrpc_version,
            "id": "1",
            "method": "initialize", 
            "params": {
                "protocolVersion": config.mcp_protocol_version, 
                "capabilities": {}, 
                "clientInfo": {
                    "name": config.client_name, 
                    "version": config.client_version
                }
            }
        })
        
        response = requests.post(
            f"{test_url}/mcp",
            headers=headers,
            data=test_body,
            timeout=config.request_timeout
        )
        
        if response.status_code == 200:
            logger.info("Bearer token is valid")
            return bearer_token
        elif response.status_code == 403 or "Invalid Bearer token" in response.text:
            logger.info("Bearer token is expired or invalid, getting fresh token...")
            # Get fresh token from Cognito
            fresh_token = get_cognito_token_direct()
            if fresh_token:
                logger.info("Successfully obtained fresh token, updating secret manager...")
                save_bearer_token_to_secret_manager(fresh_token)
                return fresh_token
            else:
                logger.info("Failed to get fresh token from Cognito")
                return bearer_token
        else:
            logger.info(f"Unexpected response status: {response.status_code}")
            return bearer_token
            
    except Exception as e:
        logger.info(f"Error testing bearer token: {e}")
        return bearer_token

def make_authenticated_request(url, headers=None, data=None, method="POST", timeout=None, max_retries=1):
    """
    Make an authenticated request with automatic token refresh on failure
    Similar to test_mcp_client.py retry logic
    """
    if headers is None:
        headers = {}
    if data is None:
        data = {}
    if timeout is None:
        config = get_config()
        timeout = config.request_timeout
    
    # Get current bearer token
    bearer_token = get_gateway_access_token()
    if not bearer_token:
        raise Exception("Failed to obtain bearer token")
    
    # Add authorization header
    headers["Authorization"] = f"Bearer {bearer_token}"
    headers["Content-Type"] = "application/json"
    headers["Accept"] = "application/json, text/event-stream"
    
    for attempt in range(max_retries + 1):
        try:
            logger.info(f"Making authenticated request (attempt {attempt + 1}/{max_retries + 1})...")
            
            if method.upper() == "POST":
                response = requests.post(url, headers=headers, data=data, timeout=timeout)
            elif method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            if response.status_code == 200:
                logger.info("Request successful!")
                return response
            elif response.status_code == 403 or "Invalid Bearer token" in response.text:
                logger.info(f"403 Forbidden - Token may be expired (attempt {attempt + 1})")
                
                if attempt < max_retries:
                    logger.info("Getting fresh token from Cognito...")
                    fresh_token = get_cognito_token_direct()
                    if fresh_token:
                        logger.info("Successfully obtained fresh token, updating headers and retrying...")
                        # Update headers with fresh token
                        headers["Authorization"] = f"Bearer {fresh_token}"
                        # Save the fresh token
                        save_bearer_token_to_secret_manager(fresh_token)
                        continue
                    else:
                        logger.info("Failed to get fresh token from Cognito")
                        break
                else:
                    logger.info("Max retries reached, giving up")
                    break
            else:
                logger.info(f"Unexpected response status: {response.status_code}")
                logger.info(f"Response body: {response.text}")
                break
                
        except Exception as e:
            logger.info(f"Request failed: {e}")
            if attempt < max_retries:
                logger.info(f"Retrying... (attempt {attempt + 2}/{max_retries + 1})")
                continue
            else:
                raise e
    
    # If we get here, all attempts failed
    raise Exception(f"All {max_retries + 1} attempts failed")

def get_cognito_token_direct():
    """
    Direct Cognito token retrieval using USER_PASSWORD_AUTH flow 
    """
    try:
        # Get Cognito configuration from config
        config = get_config()
        client_id = config.cognito_client_id
        username = config.cognito_username
        password = config.cognito_password
        region = config.region
        
        logger.info(f"Debug - Client ID: {client_id}")
        logger.info(f"Debug - Username: {username}")
        logger.info(f"Debug - Password: {'***' if password else 'None'}")
        logger.info(f"Debug - Region: {region}")
        
        if not all([client_id, username, password]):
            missing = []
            if not client_id: missing.append("cognito_client_id")
            if not username: missing.append("cognito_username")
            if not password: missing.append("cognito_password")
            raise ValueError(f"Missing Cognito configuration: {', '.join(missing)}")
        
        # Create Cognito client using AWS SDK (like GitHub code)
        client = boto3.client('cognito-idp', region_name=region)
        
        logger.info("Debug - Making Cognito authentication request...")
        # Authenticate and get tokens using configured auth flow
        response = client.initiate_auth(
            ClientId=client_id,
            AuthFlow=config.auth_flow,
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password
            }
        )
        logger.info(f"Debug - Authentication response received")
        auth_result = response['AuthenticationResult']
        access_token = auth_result['AccessToken']
        
        logger.info(f"Debug - Access token received: {'Yes' if access_token else 'No'}")
        logger.info("Successfully obtained fresh Cognito tokens")
        return access_token
        
    except Exception as e:
        logger.info(f"Error getting Cognito token directly: {e}")
        import traceback
        traceback.print_exc()
        return None

@requires_access_token(
    provider_name=get_config().identity_provider_name,
    scopes=[],
    auth_flow="M2M",
)
def get_gateway_access_token_bedrock(access_token: str):
    """
    Bedrock AgentCore token retrieval (works when workload identity is set)
    """
    logger.info(f"Access Token from Bedrock AgentCore: {access_token}")
    return access_token

def get_gateway_access_token():
    """
    Main function that checks secret manager first, then tries bedrock_agentcore, 
    then falls back to direct Cognito with automatic token refresh
    """
    config = get_config()
    
    # First check if we have a token in config (runtime token)
    jwt_token = config.bearer_token
    if jwt_token:
        logger.info("Using bearer token from config")
        # Even with config token, test if it's still valid
        jwt_token = refresh_bearer_token_if_needed(jwt_token)
        return jwt_token
    
    # Check secret manager for stored token
    logger.info("Checking secret manager for stored bearer token...")
    bearer_token = get_bearer_token_from_secret_manager()
    
    if bearer_token:
        logger.info("Found bearer token in secret manager")
        # Test if the token is still valid and refresh if needed
        bearer_token = refresh_bearer_token_if_needed(bearer_token)
        return bearer_token
    
    # No token in secret manager, try to get fresh token from Cognito
    logger.info("No bearer token found in secret manager, getting fresh bearer token from Cognito...")
    
    try:
        # Try bedrock_agentcore method first
        logger.info("Trying bedrock_agentcore authentication...")
        token = get_gateway_access_token_bedrock()
        if token:
            # Save the token to secret manager
            save_bearer_token_to_secret_manager(token)
            return token
    except ValueError as e:
        if "Workload access token has not been set" in str(e):
            logger.info("Workload access token not available, falling back to direct Cognito authentication...")
        else:
            raise e
    except Exception as e:
        logger.info(f"Error with bedrock_agentcore authentication: {e}")
    
    # Fall back to direct Cognito token retrieval
    logger.info("Falling back to direct Cognito authentication...")
    token = get_cognito_token_direct()
    if token:
        logger.info("Successfully obtained token via direct Cognito authentication")
        # Save the fresh token to secret manager
        save_bearer_token_to_secret_manager(token)
        return token
    else:
        raise Exception("Failed to obtain token via all methods (secret manager, bedrock_agentcore, and direct Cognito)")

def get_gateway_access_token_with_retry(max_retries=2):
    """
    Get gateway access token with retry logic for token refresh
    """
    for attempt in range(max_retries + 1):
        try:
            token = get_gateway_access_token()
            if token:
                return token
        except Exception as e:
            logger.info(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries:
                logger.info(f"Retrying token retrieval... (attempt {attempt + 2}/{max_retries + 1})")
                continue
            else:
                raise e
    
    raise Exception(f"Failed to obtain token after {max_retries + 1} attempts")

def load_tools_from_mcp_with_retry(gateway_endpoint, max_retries=2):
    """
    Load tools from MCP server with automatic token refresh on failure
    """
    from strands.tools.mcp import MCPClient
    from mcp.client.streamable_http import streamablehttp_client
    
    for attempt in range(max_retries + 1):
        try:
            logger.info(f"Loading MCP tools attempt {attempt + 1}/{max_retries + 1}")
            
            # Get current token
            jwt_token = get_gateway_access_token_with_retry(max_retries=1)
            if not jwt_token:
                raise Exception("Failed to obtain bearer token")
            
            # Test token validity first with a simple request
            logger.info("Testing token validity before MCP connection...")
            test_headers = {
                "Authorization": f"Bearer {jwt_token}",
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            }
            
            config = get_config()
            test_payload = {
                "jsonrpc": config.jsonrpc_version,
                "id": "test",
                "method": "initialize",
                "params": {
                    "protocolVersion": config.mcp_protocol_version,
                    "capabilities": {},
                    "clientInfo": {
                        "name": config.client_name,
                        "version": config.client_version
                    }
                }
            }
            
            import requests
            test_response = requests.post(
                f"{gateway_endpoint}/mcp",
                headers=test_headers,
                data=json.dumps(test_payload),
                timeout=config.request_timeout
            )
            
            logger.info(f"Token test response status: {test_response.status_code}")
            if test_response.status_code != 200:
                logger.info(f"Token test failed: {test_response.text}")
                if test_response.status_code in [401, 403]:
                    raise Exception(f"Token authentication failed: {test_response.status_code}")
            
            logger.info("Token is valid, proceeding with MCP connection...")
            
            headers = {"Authorization": f"Bearer {jwt_token}"}
            
            # Create MCP client
            mcp_client = MCPClient(lambda: streamablehttp_client(
                url=f"{gateway_endpoint}/mcp",
                headers=headers
            ))
            
            # Enter context manager
            mcp_client.__enter__()
            
            # Get tools
            tools = mcp_client.list_tools_sync()
            logger.info(f"Successfully loaded {len(tools)} tools from MCP server")
            
            return tools, mcp_client
            
        except Exception as e:
            error_msg = str(e)
            logger.info(f"MCP tools loading attempt {attempt + 1} failed: {error_msg}")
            
            # Check if it's a token-related error
            if ("401" in error_msg or "403" in error_msg or "Forbidden" in error_msg or 
                "Invalid Bearer token" in error_msg or "Unauthorized" in error_msg or
                "Token authentication failed" in error_msg):
                
                if attempt < max_retries:
                    logger.info("Token may be expired, getting fresh token and retrying...")
                    try:
                        # Force refresh token by getting new one directly from Cognito
                        fresh_token = get_cognito_token_direct()
                        if fresh_token:
                            save_bearer_token_to_secret_manager(fresh_token)
                            logger.info("Fresh token obtained and saved, retrying...")
                            continue
                        else:
                            logger.info("Failed to get fresh token")
                            break
                    except Exception as token_error:
                        logger.info(f"Error getting fresh token: {token_error}")
                        break
                else:
                    logger.info("Max retries reached for token refresh")
                    break
            else:
                # Non-token related error, don't retry
                logger.info(f"Non-token related error, not retrying: {error_msg}")
                break
    
    logger.info("Failed to load tools from MCP server after all attempts")
    return None, None

# Usage examples:
# # 1. 기본 토큰 획득 (자동 갱신 포함)
# token = get_gateway_access_token()

# # 2. 재시도 로직이 포함된 토큰 획득
# token = get_gateway_access_token_with_retry(max_retries=3)

# # 3. 인증된 요청 (토큰 만료 시 자동 재시도)
# response = make_authenticated_request(
#     url="https://your-gateway-url.com/api",
#     data=json.dumps({"method": "test"}),
#     max_retries=2
# )

# # 4. 토큰 유효성 검사 및 갱신
# valid_token = refresh_bearer_token_if_needed(current_token)

# # 5. MCP 도구 로드 (토큰 만료 시 자동 재시도)
# tools, mcp_client = load_tools_from_mcp_with_retry(gateway_endpoint)

if __name__ == "__main__":
    token = get_gateway_access_token()
    logger.info(f"Final token: {token}")
    
    # Test MCP tools loading
    config = get_config()
    gateway_endpoint = config.gateway_url
    if gateway_endpoint:
        logger.info(f"Testing MCP tools loading from: {gateway_endpoint}")
        tools, mcp_client = load_tools_from_mcp_with_retry(gateway_endpoint)
        if tools:
            logger.info(f"Successfully loaded {len(tools)} tools")
        else:
            logger.info("Failed to load tools")
