import json
import logging
from dataclasses import dataclass
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class Config:
    """Configuration management for the agent runtime"""
    # Core configuration
    region: str
    account_id: str
    project_name: str
    model_id: str
    
    # Gateway configuration
    gateway_url: str
    gateway_id: str
    gateway_name: str
    target_name: str
    target_id: str
    
    # Cognito configuration
    cognito_client_id: str
    cognito_username: str
    cognito_password: str
    
    # AWS resources
    secret_name: str
    lambda_function_arn: str
    agentcore_gateway_iam_role: str
    s3_bucket_name: str
    
    # Runtime settings
    bearer_token: Optional[str] = None
    max_retries: int = 2
    request_timeout: int = 10
    
    # Protocol and API settings
    jsonrpc_version: str = "2.0"
    mcp_protocol_version: str = "2024-11-05"
    client_name: str = "robot-agentic-ai"
    client_version: str = "1.0.0"
    auth_flow: str = "USER_PASSWORD_AUTH"
    
    # Secret manager settings
    bearer_key: str = "mcp_server_bearer_token"
    secret_description: str = "MCP Server Cognito credentials with bearer key and token"
    
    # SQS settings
    sqs_region: str = "ap-northeast-2"
    queue_suffix: str = ".fifo"
    max_sqs_wait_seconds: int = 5
    max_sqs_messages: int = 10
    
    # Queue names
    feedback_queue_name: str = "robo_feedback"
    detection_queue_name: str = "robo_detection"
    gesture_queue_name: str = "robo_gesture"
    
    # Bedrock settings
    bedrock_region: str = "us-west-2"
    bedrock_model_id: str = "us.amazon.nova-lite-v1:0"
    
    # Provider settings
    identity_provider_name: str = "vgs-identity-provider"
    
    # Wait tool settings
    max_wait_seconds: int = 300
    
    @property
    def mcp_server_url(self) -> str:
        """Compatibility property for existing code"""
        return self.gateway_url
    
    @classmethod
    def from_config_file(cls) -> 'Config':
        """Create config from config.json file"""
        config_path = Path(__file__).parent / "config.json"
        
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
            
            logger.info(f"Loaded config from {config_path}")
            logger.info(f"Gateway URL from config: {config_data.get('gateway_url', 'NOT_FOUND')}")
            
            cognito_config = config_data.get("cognito", {})
            
            return cls(
                region=config_data.get("region", "us-west-2"),
                account_id=config_data.get("accountId", ""),
                project_name=config_data.get("projectName", ""),
                model_id=config_data.get("model_id", "us.anthropic.claude-3-5-haiku-20241022-v1:0"),
                gateway_url=config_data.get("gateway_url", ""),
                gateway_id=config_data.get("gateway_id", ""),
                gateway_name=config_data.get("gateway_name", ""),
                target_name=config_data.get("target_name", ""),
                target_id=config_data.get("target_id", ""),
                cognito_client_id=cognito_config.get("client_id", ""),
                cognito_username=cognito_config.get("test_username", ""),
                cognito_password=cognito_config.get("test_password", ""),
                secret_name=config_data.get("secret_name", ""),
                lambda_function_arn=config_data.get("lambda_function_arn", ""),
                agentcore_gateway_iam_role=config_data.get("agentcore_gateway_iam_role", ""),
                s3_bucket_name=config_data.get("s3_bucket_name", ""),
                bearer_token=None,  # Will be obtained from SSM at runtime
                
                # Load optional settings with defaults
                jsonrpc_version=config_data.get("jsonrpc_version", "2.0"),
                mcp_protocol_version=config_data.get("mcp_protocol_version", "2024-11-05"),
                client_name=config_data.get("client_name", "robot-agentic-ai"),
                client_version=config_data.get("client_version", "1.0.0"),
                auth_flow=config_data.get("auth_flow", "USER_PASSWORD_AUTH"),
                bearer_key=config_data.get("bearer_key", "mcp_server_bearer_token"),
                secret_description=config_data.get("secret_description", "MCP Server Cognito credentials with bearer key and token"),
                sqs_region=config_data.get("sqs_region", "ap-northeast-2"),
                queue_suffix=config_data.get("queue_suffix", ".fifo"),
                max_sqs_wait_seconds=config_data.get("max_sqs_wait_seconds", 5),
                max_sqs_messages=config_data.get("max_sqs_messages", 10),
                feedback_queue_name=config_data.get("feedback_queue_name", "robo_feedback"),
                detection_queue_name=config_data.get("detection_queue_name", "robo_detection"),
                gesture_queue_name=config_data.get("gesture_queue_name", "robo_gesture"),
                bedrock_region=config_data.get("bedrock_region", "us-west-2"),
                bedrock_model_id=config_data.get("bedrock_model_id", "us.amazon.nova-lite-v1:0"),
                identity_provider_name=config_data.get("identity_provider_name", "vgs-identity-provider"),
                max_wait_seconds=config_data.get("max_wait_seconds", 300)
            )
            
        except FileNotFoundError:
            logger.error(f"config.json not found at {config_path}")
            raise RuntimeError(f"Configuration file not found: {config_path}")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in config.json: {e}")
            raise RuntimeError(f"Invalid JSON in configuration file: {e}")
