import os
import requests
import logging
from auth import access_token
from typing import Optional, Tuple, Any, Dict
from config.config import Config


class MCPServerManager:
    """Manages MCP server connection and health checks"""
    
    def __init__(self, config: Config):
        self.config = config
        self.logger = logging.getLogger(__name__)
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for MCP requests"""
        jwt_token = self.config.bearer_token
        
        if not jwt_token:
            self.logger.info("No bearer token available, trying to get one...")
            try:
                jwt_token = access_token.get_gateway_access_token_with_retry(
                    max_retries=self.config.max_retries
                )
                self.logger.info("Token obtained successfully")
                # Update config and environment
                self.config.bearer_token = jwt_token
                os.environ["BEARER_TOKEN"] = jwt_token
            except Exception as e:
                self.logger.error(f"Error getting token: {str(e)}", exc_info=True)
                return {}
        
        return {
            "Authorization": f"Bearer {jwt_token}",
            "Content-Type": "application/json"
        }
    
    def _check_with_auth(self) -> bool:
        """Check MCP server with authentication"""
        headers = self._get_auth_headers()
        if not headers:
            return False
            
        payload = {
            "jsonrpc": "2.0",
            "id": "test",
            "method": "tools/list",
            "params": {}
        }
        
        try:
            response = requests.post(
                f"{self.config.mcp_server_url}/mcp",
                headers=headers,
                json=payload,
                timeout=self.config.request_timeout
            )
            self.logger.info(f"MCP server response status: {response.status_code}")
            
            if response.status_code == 200:
                return "tools" in response.text
            else:
                self.logger.error(f"MCP server response error: {response.status_code} - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Request exception when checking MCP server: {str(e)}")
            return False
    
    def _check_health_endpoint(self) -> bool:
        """Check MCP server health endpoint (for local testing)"""
        try:
            response = requests.get(
                f"{self.config.mcp_server_url}/health",
                timeout=5
            )
            self.logger.info(f"Health endpoint response status: {response.status_code}")
            return response.status_code == 200
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Health endpoint request exception: {str(e)}")
            return False
    
    def is_server_running(self) -> bool:
        """Check if MCP server is running and accessible"""
        try:
            self.logger.info(f"Checking MCP server at URL: {self.config.mcp_server_url}")
            
            # Check if MCP server URL is configured
            if not self.config.mcp_server_url:
                self.logger.error("MCP server URL is not configured")
                return False
            
            # Try with authentication first
            if self.config.bearer_token or self._get_auth_headers():
                self.logger.info("Attempting to check MCP server with authentication")
                return self._check_with_auth()
            else:
                # Fallback to health endpoint for local testing
                self.logger.info("No bearer token available, trying health endpoint")
                return self._check_health_endpoint()
                
        except Exception as e:
            self.logger.error(f"Error checking MCP server: {str(e)}", exc_info=True)
            return False
    
    def load_tools(self) -> Tuple[Optional[list], Optional[Any]]:
        """Load tools from MCP server with retry logic"""
        try:
            self.logger.info("Loading tools from MCP server with retry logic...")
            
            # Check if MCP server URL is configured
            if not self.config.mcp_server_url:
                self.logger.error("MCP server URL is not configured, cannot load tools")
                return None, None
            
            self.logger.info(f"Attempting to load tools from: {self.config.mcp_server_url}")
            
            tools, mcp_client = access_token.load_tools_from_mcp_with_retry(
                self.config.mcp_server_url,
                max_retries=self.config.max_retries
            )
            
            if not tools or not mcp_client:
                self.logger.error("Failed to load tools from MCP server")
                return None, None
                
            self.logger.info(f"Loaded {len(tools)} tools from MCP server")
            self._log_available_tools(tools)
            
            return tools, mcp_client
            
        except Exception as e:
            self.logger.error(f"Error loading tools from MCP server: {str(e)}", exc_info=True)
            return None, None
    
    def _log_available_tools(self, tools: list):
        """Log information about available tools"""
        if not tools:
            return
            
        tool_names = []
        for tool in tools:
            # Try different ways to get tool name
            if hasattr(tool, 'schema') and hasattr(tool.schema, 'name'):
                tool_names.append(tool.schema.name)
            elif hasattr(tool, 'tool_name'):
                tool_names.append(tool.tool_name)
            elif '_name' in vars(tool):
                tool_names.append(vars(tool)['_name'])
            else:
                tool_names.append(f"Tool-{id(tool)}")
        
        self.logger.info(f"Available tools: {', '.join(tool_names)}")
