from strands import Agent, tool
from tools.robot_tools import get_robot_feedback, get_robot_detection, get_robot_gesture, analyze_robot_image
from prompts.prompt import ORCHESTRATOR_PROMPT
from config.config import Config


@tool
def observe_env_agent() -> str:
    """Collect current robot status information and analyze images only when necessary.
    
    This Agent checks robot feedback information and verifies detection and gesture data if needed.
    
    Args:
        None

    Returns:
        Robot status information and environmental observation data (including image analysis if necessary)
    """
    try:
        # Config에서 모델 ID 로드
        config = Config.from_config_file()
        
        # Agent 생성 - 필요한 도구들을 포함
        agent = Agent(
            model=config.model_id,
            tools=[
                get_robot_feedback,
                get_robot_detection,
                get_robot_gesture,
                # analyze_robot_image
            ],
            system_prompt=ORCHESTRATOR_PROMPT
        )

        # Request the agent to analyze the current situation
        response = agent("Please check the current robot status.")
        
        
        return response
    except Exception as e:
        return f"Error in observe_env: {str(e)}"
