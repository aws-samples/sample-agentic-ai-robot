#!/usr/bin/env python3
"""
Configuration Generator Script

This script generates all configuration files from environment variables.
It reads from .env file and creates individual config.json files for each component.
"""

import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv

def load_environment():
    """Load environment variables from .env file"""
    env_path = Path('.env')
    if not env_path.exists():
        print("❌ .env file not found!")
        print("Please copy .env.template to .env and fill in your values:")
        print("cp .env.template .env")
        sys.exit(1)
    
    load_dotenv()
    return os.environ

def validate_required_vars(env_vars):
    """Validate that all required environment variables are set"""
    required_vars = [
        'AWS_ACCOUNT_ID',
        'S3_BUCKET_NAME',
        'COGNITO_USER_POOL_ID',
        'COGNITO_CLIENT_ID',
        'COGNITO_IDENTITY_POOL_ID',
        'COGNITO_TEST_USERNAME',
        'COGNITO_TEST_PASSWORD',
        'GATEWAY_URL',
        'GATEWAY_ID',
        'TARGET_ID',
        'AGENT_RUNTIME_NAME'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not env_vars.get(var) or env_vars.get(var).startswith('YOUR_'):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing or placeholder values for required variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease update your .env file with actual values.")
        sys.exit(1)
    
    print("✅ All required environment variables are set")

def generate_agent_runtime_config(env_vars):
    """Generate agent-runtime/config/config.json"""
    config = {
        "region": env_vars['AWS_REGION_US_WEST_2'],
        "accountId": env_vars['AWS_ACCOUNT_ID'],
        "projectName": env_vars['PROJECT_NAME'],
        "model_id": "us.anthropic.claude-3-5-haiku-20241022-v1:0",
        "s3_bucket_name": env_vars['S3_BUCKET_NAME'],
        "agentcore_gateway_iam_role": f"arn:aws:iam::{env_vars['AWS_ACCOUNT_ID']}:role/AgentCoreGatewayRoleFor{env_vars['PROJECT_NAME']}",
        "cognito": {
            "user_pool_name": f"{env_vars['PROJECT_NAME']}-agentcore-user-pool",
            "user_pool_id": env_vars['COGNITO_USER_POOL_ID'],
            "client_name": f"{env_vars['PROJECT_NAME']}-agentcore-client",
            "client_id": env_vars['COGNITO_CLIENT_ID'],
            "test_username": env_vars['COGNITO_TEST_USERNAME'],
            "test_password": env_vars['COGNITO_TEST_PASSWORD']
        },
        "lambda_function_arn": f"arn:aws:lambda:{env_vars['AWS_REGION_US_WEST_2']}:{env_vars['AWS_ACCOUNT_ID']}:function:{env_vars['LAMBDA_MCP_INTERFACE_NAME']}",
        "secret_name": env_vars['SECRET_NAME'],
        "gateway_name": env_vars['PROJECT_NAME'],
        "gateway_url": env_vars['GATEWAY_URL'],
        "gateway_id": env_vars['GATEWAY_ID'],
        "target_name": "mcp-interface",
        "target_id": env_vars['TARGET_ID']
    }
    
    config_path = Path('agent-runtime/config/config.json')
    config_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"✅ Generated {config_path}")

def generate_manager_configs(env_vars):
    """Generate config files for all managers"""
    managers = [
        ('detection-manager', env_vars['LAMBDA_DETECTION_MANAGER_NAME']),
        ('gesture-manager', env_vars['LAMBDA_GESTURE_MANAGER_NAME']),
        ('feedback-manager', env_vars['LAMBDA_FEEDBACK_MANAGER_NAME']),
        ('robo-controller', env_vars['LAMBDA_ROBO_CONTROLLER_NAME'])
    ]
    
    for manager_name, lambda_name in managers:
        config = {
            "region": env_vars['AWS_REGION_AP_NORTHEAST_2'],
            "projectName": env_vars['PROJECT_NAME'],
            "accountId": env_vars['AWS_ACCOUNT_ID'],
            "lambda_function_arn": f"arn:aws:lambda:{env_vars['AWS_REGION_AP_NORTHEAST_2']}:{env_vars['AWS_ACCOUNT_ID']}:function:{lambda_name}"
        }
        
        # Add topic for robo-controller
        if manager_name == 'robo-controller':
            config["topic"] = "robot/control"
            config["lambda_function_name"] = lambda_name
        
        config_path = Path(f'{manager_name}/config.json')
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"✅ Generated {config_path}")

def generate_frontend_configs(env_vars):
    """Generate frontend configuration files"""
    
    # Generate env.json
    env_config = {
        "REACT_APP_AWS_REGION": env_vars['REACT_APP_AWS_REGION'],
        "REACT_APP_AGENT_RUNTIME_ARN": f"arn:aws:bedrock-agentcore:{env_vars['REACT_APP_AWS_REGION']}:{env_vars['AWS_ACCOUNT_ID']}:runtime/{env_vars['AGENT_RUNTIME_NAME']}",
        "REACT_APP_QUALIFIER": env_vars['REACT_APP_QUALIFIER'],
        "REACT_APP_LAMBDA_FUNCTION_ARN": f"arn:aws:lambda:{env_vars['REACT_APP_LAMBDA_REGION']}:{env_vars['AWS_ACCOUNT_ID']}:function:{env_vars['LAMBDA_ROBO_CONTROLLER_NAME']}",
        "REACT_APP_LAMBDA_REGION": env_vars['REACT_APP_LAMBDA_REGION']
    }
    
    env_path = Path('amplify-frontend/src/env.json')
    env_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(env_path, 'w') as f:
        json.dump(env_config, f, indent=2)
    
    print(f"✅ Generated {env_path}")
    
    # Generate amplify_outputs.json
    amplify_config = {
        "auth": {
            "user_pool_id": env_vars['COGNITO_USER_POOL_ID'],
            "aws_region": env_vars['REACT_APP_AWS_REGION'],
            "user_pool_client_id": env_vars['COGNITO_CLIENT_ID'],
            "identity_pool_id": env_vars['COGNITO_IDENTITY_POOL_ID'],
            "mfa_methods": [],
            "standard_required_attributes": ["email"],
            "username_attributes": ["email"],
            "user_verification_types": ["email"],
            "groups": [],
            "mfa_configuration": "NONE",
            "password_policy": {
                "min_length": 8,
                "require_lowercase": True,
                "require_numbers": True,
                "require_symbols": True,
                "require_uppercase": True
            },
            "unauthenticated_identities_enabled": True
        },
        "data": {
            "url": f"https://YOUR_GRAPHQL_API_ID.appsync-api.{env_vars['REACT_APP_AWS_REGION']}.amazonaws.com/graphql",
            "aws_region": env_vars['REACT_APP_AWS_REGION'],
            "default_authorization_type": "AWS_IAM",
            "authorization_types": ["AMAZON_COGNITO_USER_POOLS"],
            "model_introspection": {
                "version": 1,
                "models": {
                    "Todo": {
                        "name": "Todo",
                        "fields": {
                            "id": {
                                "name": "id",
                                "isArray": False,
                                "type": "ID",
                                "isRequired": True,
                                "attributes": []
                            },
                            "content": {
                                "name": "content",
                                "isArray": False,
                                "type": "String",
                                "isRequired": False,
                                "attributes": []
                            },
                            "createdAt": {
                                "name": "createdAt",
                                "isArray": False,
                                "type": "AWSDateTime",
                                "isRequired": False,
                                "attributes": [],
                                "isReadOnly": True
                            },
                            "updatedAt": {
                                "name": "updatedAt",
                                "isArray": False,
                                "type": "AWSDateTime",
                                "isRequired": False,
                                "attributes": [],
                                "isReadOnly": True
                            }
                        },
                        "syncable": True,
                        "pluralName": "Todos",
                        "attributes": [
                            {
                                "type": "model",
                                "properties": {}
                            },
                            {
                                "type": "auth",
                                "properties": {
                                    "rules": [
                                        {
                                            "allow": "public",
                                            "provider": "iam",
                                            "operations": ["create", "update", "delete", "read"]
                                        }
                                    ]
                                }
                            }
                        ],
                        "primaryKeyInfo": {
                            "isCustomPrimaryKey": False,
                            "primaryKeyFieldName": "id",
                            "sortKeyFieldNames": []
                        }
                    }
                },
                "enums": {},
                "nonModels": {}
            }
        },
        "version": "1.4"
    }
    
    amplify_path = Path('amplify-frontend/src/amplify_outputs.json')
    amplify_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(amplify_path, 'w') as f:
        json.dump(amplify_config, f, indent=2)
    
    print(f"✅ Generated {amplify_path}")

def update_policy_files(env_vars):
    """Update policy files with actual account ID"""
    policy_files = [
        'gesture-manager/policy.json',
        'detection-manager/policy.json'
    ]
    
    for policy_file in policy_files:
        policy_path = Path(policy_file)
        if policy_path.exists():
            with open(policy_path, 'r') as f:
                content = f.read()
            
            # Replace placeholder account ID
            content = content.replace('YOUR_AWS_ACCOUNT_ID', env_vars['AWS_ACCOUNT_ID'])
            
            with open(policy_path, 'w') as f:
                f.write(content)
            
            print(f"✅ Updated {policy_path}")

def main():
    """Main function"""
    print("🔧 Generating configuration files from environment variables...")
    
    # Load environment variables
    env_vars = load_environment()
    
    # Validate required variables
    validate_required_vars(env_vars)
    
    # Generate configuration files
    generate_agent_runtime_config(env_vars)
    generate_manager_configs(env_vars)
    generate_frontend_configs(env_vars)
    update_policy_files(env_vars)
    
    print("\n🎉 All configuration files generated successfully!")
    print("\nNext steps:")
    print("1. Review the generated configuration files")
    print("2. Update GraphQL API URL in amplify_outputs.json if needed")
    print("3. Run your deployment scripts")

if __name__ == "__main__":
    main()
