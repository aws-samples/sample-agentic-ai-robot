import json
import boto3
import traceback
import os

config_path = os.path.join(os.path.dirname(__file__), 'config.json')
with open(config_path, 'r') as f:
    config = json.load(f)

region = config['region']
lambda_function_name = config['lambda_function_name']

def test_robo_controller(lambda_function_name, action, message):
    try:
        payload = {
            'action': action,
            'message': message
        }
        print(f"payload: {payload}")

        lambda_client = boto3.client(
            service_name='lambda',
            region_name=region,
        )

        output = lambda_client.invoke(
            FunctionName=lambda_function_name,
            Payload=json.dumps(payload),
        )
        print(f"output: {output}")
        
    except Exception:
        err_msg = traceback.format_exc()
        print(f"error message: {err_msg}")     

def main():

    action = 'detected'
    # message = '오늘은 정말 멋지네요!'
    message = ''
    print(f"action: {action}, message: {message}")
    test_robo_controller(lambda_function_name, action, message)

if __name__ == "__main__":
    main()