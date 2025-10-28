from strands import Agent, tool
from tools.robot_tools import get_robot_feedback, get_robot_detection, get_robot_gesture, analyze_robot_image
from prompts.prompt import ORCHESTRATOR_PROMPT
from config.config import Config


@tool
def observe_env_agent() -> str:
    """현재 로봇의 상태 정보를 수집하고, 필요시에만 이미지를 분석합니다.
    
    이 Agent는 로봇의 feedback 정보를 확인하고, 필요하다면 detection과 gesture 데이터를 확인합니다.
    
    Args:
        None

    Returns:
        로봇 상태 정보와 환경 관찰 데이터 (필요시 이미지 분석 포함)
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

        # Agent에게 현재 상황을 분석하도록 요청
        response = agent("현재 로봇의 상태를 확인하세요.")
        
        
        return response
    except Exception as e:
        return f"Error in observe_env: {str(e)}"
