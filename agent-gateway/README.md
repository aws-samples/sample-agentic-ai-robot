# Robot AgentCore Gateway

여기서는 Robot의 제어 명령어 전달을 위해 MCP를 이용합니다. 이를 구현하여 배포할 때에는 AgnetCore Gateway와 Lambda를 이용합니다. 

## MCP Interface Tool Spec

Robot 제어를 위한 명령(command)는 action과 message로 주어집니다. 이는 아래와 같이 string으로 주어지고 action은 구체적인 예제를 가지고 있습니다. 아래에서는 Robot의 기분을 나타내는 HAPPY, NEUTRAL, SAD, ANGRY의 action을 가지고 있습니다. 

```java
{
    "name": "command",
    "description": "당신은 로봇 컨트롤러입니다. 로봇을 컨트롤하기 위한 명령은 action과 message입니다. 적절한 로봇의 동작명을 action으로 전달하고, 로봇이 전달할 메시지를 message로 전달하세요. action은 HAPPY, NEUTRAL, SAD, ANGRY중 하나를 선택합니다.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string"
            },
            "message": {
                "type": "string"
            }
        },
        "required": ["action"]
    }
}
```

## MCP 서버의 동작

[lambda_function.py](./gateway/mcp-interface/lambda-mcp-interface-for-robo/lambda_function.py)와 같이 수신된 event로부터 지원하는 tool인지를 toolName으로 확인한 후에 action과 message를 추출하여 활용합니다.

```python
def lambda_handler(event, context):
    toolName = context.client_context.custom['bedrockAgentCoreToolName']
    
    delimiter = "___"
    if delimiter in toolName:
        toolName = toolName[toolName.index(delimiter) + len(delimiter):]

    action = event.get('action')
    message = event.get('message')

    if toolName == 'command':
        result = command_robot(action, message)
        return {
            'statusCode': 200, 
            'body': result
        }
```

## MCP Gateway의 생성

[create_gateway_tool.py](./gateway/mcp-interface/create_gateway_tool.py)와 같이 MCP Gateway를 생성합니다.

```pyhton
gateway_id = config.get('gateway_id')    
gateway_url = f'https://{gateway_id}.gateway.bedrock-agentcore.{region}.amazonaws.com/mcp'
agentcore_gateway_iam_role = config['agentcore_gateway_iam_role']
auth_config = {
    "customJWTAuthorizer": { 
        "allowedClients": [client_id],  
        "discoveryUrl": cognito_discovery_url
    }
}
response = gateway_client.create_gateway(
    name=gateway_name,
    roleArn = agentcore_gateway_iam_role,
    protocolType='MCP',
    authorizerType='CUSTOM_JWT',
    authorizerConfiguration=auth_config, 
    description=f'AgentCore Gateway for {projectName}'
)
```

이제 아래와 같이 target을 gateway에 deploy합니다.

```python
TOOL_SPEC = json.load(open(os.path.join(script_dir, "tool_spec.json")))
lambda_target_config = {
    "mcp": {
        "lambda": {
            "lambdaArn": lambda_function_arn, 
            "toolSchema": {
                "inlinePayload": [TOOL_SPEC]
            }
        }
    }
}
credential_config = [ 
    {
        "credentialProviderType" : "GATEWAY_IAM_ROLE"
    }
]
response = gateway_client.create_gateway_target(
    gatewayIdentifier=gateway_id,
    name=targetname,
    description=f'{targetname} for {projectName}',
    targetConfiguration=lambda_target_config,
    credentialProviderConfigurations=credential_config)

target_id = response["targetId"]
```

## MCP 서버 설치

[create_gateway_role.py](./gateway/mcp-interface/create_gateway_role.py)을 이용해 필요한 Role을 생성합니다.

```text
python create_gateway_role.py
```
[create_gateway_tool.py](./gateway/mcp-interface/create_gateway_tool.py)을 이용해 gateway와 target을 설치합니다. 이때 target의 실행을 위해 lambda도 설치합니다.

```text
python create_gateway_tool.py
```

## MCP 서버의 활용

[test_mcp_remote.py](./gateway/mcp-interface/test_mcp_remote.py)와 같이 활용합니다.

```python
from mcp.client.streamable_http import streamablehttp_client

async with streamablehttp_client(mcp_url, headers, timeout=120, terminate_on_close=False) as (
    read_stream, write_stream, _):

    async with ClientSession(read_stream, write_stream) as session:
        tool_result = await asyncio.wait_for(session.list_tools(), timeout=60)
        for tool in tool_result.tools:
            print(f"  - {tool.name}: {tool.description[:100]}...")

        targret_name = config['target_name']
        tool_name = f"{targret_name}___command"
        result = await asyncio.wait_for(session.call_tool(tool_name, params), timeout=30)
```

생성된 MCP의 정보는 아래와 같이 가져옵니다.

```python
gateway_url = f'https://{gateway_id}.gateway.bedrock-agentcore.{region}.amazonaws.com/mcp'
bearer_token = retrieve_bearer_token(config['secret_name'])

return {
    "mcpServers": {
        "agentcore-gateway": {
            "type": "streamable_http",
            "url": gateway_url,
            "headers": {
                "Authorization": f"Bearer {bearer_token}",
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream"
            }
        }
    }
}
```
