import json
import logging
from dataclasses import dataclass
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class Config:
    """Configuration management for the agent runtime"""
    mcp_server_url: str
    bearer_token: Optional[str] = None
    model_id: str = "us.anthropic.claude-3-5-haiku-20241022-v1:0"
    max_retries: int = 2
    request_timeout: int = 10
    
    @classmethod
    def from_config_file(cls) -> 'Config':
        """Create config from config.json file"""
        config_path = Path(__file__).parent / "config.json"
        
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
            
            logger.info(f"Loaded config from {config_path}")
            logger.info(f"Gateway URL from config: {config_data.get('gateway_url', 'NOT_FOUND')}")
            
            return cls(
                mcp_server_url=config_data.get("gateway_url", ""),
                model_id=config_data.get("model_id", "us.anthropic.claude-3-5-haiku-20241022-v1:0"),
                bearer_token=None  # Will be obtained from SSM at runtime
            )
            
        except FileNotFoundError:
            logger.error(f"config.json not found at {config_path}")
            return cls(mcp_server_url="")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in config.json: {e}")
            return cls(mcp_server_url="")
