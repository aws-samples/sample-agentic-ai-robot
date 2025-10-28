# Robot Direct Controller

Robot 제어는 기본적으로 Agent에 의해 진행이되나, 직접 제어가 필요한 경우를 대비하여 아래와 같은 lambda를 구현합니다. [robot controller](./robo-controller/lambda-robo-controller-for-robo/lambda_function.py)는 lambda를 이용해 action과 message를 설정합니다. 이때 client에서 trigger할 때에는 아래와 같이 수행합니다. 

```python
def test_robo_controller(lambda_function_name, action, message):
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

action = 'HAPPY'
message = '오늘은 정말 멋지네요!'
test_robo_controller(lambda_function_name, action, message)
```

이때의 실행 결과는 아래와 같습니다.

<img width="264" height="278" alt="image" src="https://github.com/user-attachments/assets/0a0f41e6-ebe6-403f-9cdb-153dd3afa57d" />
