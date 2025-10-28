import logging
from typing import Optional, Any
from strands import Agent
from strands.models import BedrockModel
from config.config import Config
from core.mcp_manager import MCPServerManager
from prompts.prompt import ORCHESTRATOR_PROMPT
from tools.observer_env_agent import observe_env_agent
from tools.robot_tools import get_robot_feedback, get_robot_detection, get_robot_gesture, wait_for_seconds


class AgentManager:
    """Manages Strands Agent initialization and lifecycle"""
    
    def __init__(self, config: Config, mcp_manager: MCPServerManager):
        self.config = config
        self.mcp_manager = mcp_manager
        self.logger = logging.getLogger(__name__)
        self.agent: Optional[Agent] = None
        self.mcp_client: Optional[Any] = None
    
    def initialize(self, debug: bool = False) -> bool:
        """Initialize the agent with MCP tools and local tools
        
        Args:
            debug: If True, skip MCP server integration and use only local tools
        """
        try:
            self.logger.info(f"Starting agent initialization... (debug mode: {debug})")
            
            local_tools = [
                get_robot_feedback,
                get_robot_detection,
                get_robot_gesture,
                wait_for_seconds
            ]
            
            if debug:
                # In debug mode, only use local tools
                self.logger.info("Debug mode: Skipping MCP tool integration, using only local tools")
                all_tools = local_tools
                mcp_client = None
            else:
                # Load tools from Bedrock AgentCore Gateway MCP server
                mcp_tools, mcp_client = self.mcp_manager.load_tools()
                if not mcp_tools or not mcp_client:
                    self.logger.error("Failed to load tools from MCP server")
                    return False
                
                all_tools = mcp_tools + local_tools
                self.logger.info(f"Loaded {len(mcp_tools)} AgentCore MCP tools and {len(local_tools)} local tools")
            
            # Create the agent
            if self._create_agent(all_tools):
                self.mcp_client = mcp_client
                self.logger.info(f"Agent initialized successfully with {len(all_tools)} total tools")
                return True
            else:
                return False
                
        except Exception as e:
            self.logger.error(f"Error initializing agent: {str(e)}", exc_info=True)
            return False
    
    def _create_agent(self, tools: list) -> bool:
        """Create Strands Agent with the provided tools"""
        try:
            self.logger.info("Creating Strands Agent with tools...")
            
            model = BedrockModel(model_id=self.config.model_id)
            
            self.agent = Agent(
                model=model,
                tools=tools,
                system_prompt=ORCHESTRATOR_PROMPT
            )
            
            self.logger.info("Agent created successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Error creating agent: {str(e)}", exc_info=True)
            return False
    
    def is_initialized(self, debug: bool = False) -> bool:
        """Check if agent is properly initialized"""
        if debug:
            # In debug mode, only check if agent exists (MCP client not required)
            return self.agent is not None
        else:
            # In normal mode, both agent and MCP client must exist
            return self.agent is not None and self.mcp_client is not None
    
    def get_agent(self) -> Optional[Agent]:
        """Get the initialized agent"""
        return self.agent
    
    def get_mcp_client(self) -> Optional[Any]:
        """Get the MCP client"""
        return self.mcp_client
    
    def ensure_initialized(self, debug: bool = False) -> bool:
        """Ensure agent is initialized, attempt initialization if not"""
        if self.is_initialized(debug=debug):
            return True
        
        if debug:
            self.logger.info("Agent not initialized in debug mode, attempting to initialize with local tools only...")
            return self.initialize(debug=True)
        else:
            self.logger.info("Agent not initialized, checking MCP server status...")
            if self.mcp_manager.is_server_running():
                self.logger.info("MCP server is running, attempting to initialize agent...")
                return self.initialize(debug=False)
            else:
                self.logger.error("MCP server is not running")
                return False
