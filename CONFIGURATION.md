# Environment Configuration Management

This project uses a centralized environment configuration system to simplify deployment and management.

## Configuration Structure

| File | Purpose | Location |
|------|---------|----------|
| `.env` | Master environment variables | Root directory |
| `config.json` | Agent runtime configuration | `agent-runtime/config/` |
| `amplify_outputs.json` | Amplify backend config | `amplify-frontend/` |
| `env.json` | Frontend environment | `amplify-frontend/src/` |

### 1. Environment Variables (.env)
Create a `.env` file in the project root with your actual values:

```bash
# AWS Configuration
AWS_ACCOUNT_ID=your_actual_account_id
AWS_REGION_US_WEST_2=us-west-2
AWS_REGION_AP_NORTHEAST_2=ap-northeast-2
PROJECT_NAME=robo

# S3 Configuration
S3_BUCKET_NAME=your_s3_bucket_name

# Cognito Configuration
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id
COGNITO_IDENTITY_POOL_ID=your_identity_pool_id
COGNITO_TEST_USERNAME=your_test_username
COGNITO_TEST_PASSWORD=your_test_password

# Gateway Configuration
GATEWAY_URL=your_gateway_url
GATEWAY_ID=your_gateway_id
TARGET_ID=your_target_id

# Lambda Function Names
LAMBDA_MCP_INTERFACE_NAME=lambda-mcp-interface-for-robo
LAMBDA_DETECTION_MANAGER_NAME=lambda-detection-manager-for-robo
LAMBDA_GESTURE_MANAGER_NAME=lambda-gesture-manager-for-robo
LAMBDA_FEEDBACK_MANAGER_NAME=lambda-feedback-manager-for-robo
LAMBDA_ROBO_CONTROLLER_NAME=lambda-robo-controller-for-robo

# Agent Runtime Configuration
AGENT_RUNTIME_NAME=your_runtime_name
SECRET_NAME=robo/credentials
```

### 2. Configuration Generator Script
Use the provided script to generate all configuration files from environment variables:

```bash
python scripts/generate_configs.py
```

This script will:
- Read environment variables from `.env`
- Generate all individual `config.json` files
- Create frontend environment files
- Validate required variables are set

## Usage

### Initial Setup
1. Copy the environment template:
   ```bash
   cp .env.template .env
   ```

2. Edit `.env` with your actual values:
   ```bash
   nano .env
   ```

3. Generate all configuration files:
   ```bash
   python scripts/generate_configs.py
   ```

### Updating Configuration
When you need to change configuration:
1. Update the `.env` file
2. Run the generator script again
3. All configuration files will be updated automatically

## Benefits

- **Single Source of Truth**: All configuration in one `.env` file
- **Consistency**: No risk of mismatched values across components
- **Easy Updates**: Change once, apply everywhere
- **Environment Separation**: Different `.env` files for dev/staging/prod
- **Validation**: Script validates all required variables are set

## Security

- `.env` files are gitignored by default
- Sensitive values are not committed to version control
- Use different `.env` files for different environments
- Consider using AWS Secrets Manager for production deployments
