import json
import boto3
import os
import traceback

bedrock_agent_runtime_client = boto3.client("bedrock-agent-runtime")

def command_robot(action: str, message: str) -> str:
    client = boto3.client(
        'iot-data',
        region_name='ap-northeast-2'
    )        
    print('action: ', action)

    say = ""
    if message:
        print('message: ', message)
        say = message
    
    move = ""
    if action == "탐지" or action == "detected":
        move = ['detected']
    elif action == "from1to2":
        move = ['from1to2']
    elif action == "from2to0":
        move = ['from2to0']
    elif action == "from0to1":
        move = ['from0to1']
    elif action == "normal":
        move = ['normal']
    elif action == "heart":
        move = ['heart']
    elif action == "stretch":
        move = ['stretch']
    elif action == "scrape":
        move = ['scrape']
    elif action == "dance1" or action == "dance1":
        move = ['dance1']
    elif action == "dance2" or action == "dance2":
        move = ['dance2']
    elif action == "행복해" or action == "heart":
        move = ['heart']
    elif action == "피곤해" or action == "stretch":
        move = ['stretch']
    elif action == "반가워" or action == "heart":
        move = ['heart']
    elif action == "춤춰봐" or action == 'dance"':
        move = ['dance1']
    elif action == "앉아" or action == "sit":
        move = ['sit']
    elif action == "일어서" or action == "stand":
        move = ['stand']
    else:
        move = [action]

    if say:
        payload = json.dumps({
            "move": move,
            "say": say
        })
    else:
        payload = json.dumps({
            "move": move
        })
                        
    topic = f"robot/control"  # for testing
    print('topic: ', topic)

    try:         
        response = client.publish(
            topic = topic,
            qos = 1,
            payload = payload
        )
        print('response: ', response)     
        return True   
            
    except Exception:
        err_msg = traceback.format_exc()
        print('error message: ', err_msg)                    
        return False

def lambda_handler(event, context):
    print(f"event: {event}")
    print(f"context: {context}")

    toolName = context.client_context.custom['bedrockAgentCoreToolName']
    print(f"context.client_context: {context.client_context}")
    print(f"Original toolName: {toolName}")
    
    delimiter = "___"
    if delimiter in toolName:
        toolName = toolName[toolName.index(delimiter) + len(delimiter):]
    print(f"Converted toolName: {toolName}")

    action = event.get('action')
    print(f"action: {action}")
    message = event.get('message')
    print(f"message: {message}")

    if toolName == 'command':
        result = command_robot(action, message)
        print(f"result: {result}")
        return {
            'statusCode': 200, 
            'body': result
        }
    else:
        return {
            'statusCode': 200, 
            'body': f"{toolName} is not supported"
        }
