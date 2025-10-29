import os
import time
import json
import boto3
from pathlib import Path
from bedrock_agentcore_starter_toolkit import Runtime
from boto3.session import Session

def load_config():
    """Load configuration from config.json"""
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config', 'config.json')
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        raise FileNotFoundError(f"config.json not found at {config_path}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in config.json: {e}")

# Load configuration
config = load_config()
region = config.get('region', 'us-west-2')

print(f"Using AWS Region: {region}")

# Configuration variables
def get_config_vars():
    """Get configuration variables from config.json"""
    config_vars = {
        "AWS_REGION": region,
        "GATEWAY_URL": config.get('gateway_url'),
        "COGNITO_CLIENT_ID": config.get('cognito', {}).get('client_id'),
        "COGNITO_USERNAME": config.get('cognito', {}).get('test_username'),
        "COGNITO_PASSWORD": config.get('cognito', {}).get('test_password'),
        "SECRET_NAME": config.get('secret_name'),
        "BEARER_TOKEN": "",  # This might need to be set separately if needed
    }
    
    # Filter out None values
    return {k: v for k, v in config_vars.items() if v is not None}



def main():
    """Main deployment function"""
    print("Starting Strands Agent Runtime Deployment...")
    
    # Get configuration variables
    config_vars = get_config_vars()
    print(config_vars)
    
    # Initialize Bedrock AgentCore Runtime
    print("\n=== Initializing Bedrock AgentCore Runtime ===")
    agentcore_runtime = Runtime()
    
    # Configure the runtime with environment variables
    print("\n=== Configuring Runtime ===")
    try:
        response = agentcore_runtime.configure(
            entrypoint="main.py",
            auto_create_execution_role=True,
            auto_create_ecr=True,
            requirements_file="requirements.txt",
            region=region,
            agent_name="robot_strands_agent",
        )
        print("Runtime configuration successful:")
        print(json.dumps(response, indent=2, default=str))
    except Exception as e:
        print(f"Error configuring runtime: {e}")
        return False
    
    # Launch the runtime
    print("\n=== Launching Runtime ===")
    try:
        launch_result = agentcore_runtime.launch(env_vars=config_vars)
        print("Runtime launch successful:")
        print(json.dumps(launch_result, indent=2, default=str))
    except Exception as e:
        print(f"Error launching runtime: {e}")
        return False
    
    # Wait for deployment to complete
    print("\n=== Waiting for Deployment to Complete ===")
    try:
        status_response = agentcore_runtime.status()
        status = status_response.endpoint['status']
        end_status = ['READY', 'CREATE_FAILED', 'DELETE_FAILED', 'UPDATE_FAILED']
        
        print(f"Initial status: {status}")
        
        while status not in end_status:
            time.sleep(10)
            status_response = agentcore_runtime.status()
            status = status_response.endpoint['status']
            print(f"Current status: {status}")
        
        if status == 'READY':
            print("\n✅ Deployment completed successfully!")
            print(f"Runtime endpoint: {status_response.endpoint.get('endpoint_url', 'N/A')}")
        else:
            print(f"\n❌ Deployment failed with status: {status}")
            return False
            
    except Exception as e:
        print(f"Error checking deployment status: {e}")
        return False
    
    # Print summary
    print("\n=== Deployment Summary ===")
    print(f"Region: {region}")
    print(f"Agent Name: strands_claude_streaming")
    print(f"Entrypoint: strands_agent_runtime.py")
    print(f"Configuration Variables: {len(config_vars)} configured")
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
