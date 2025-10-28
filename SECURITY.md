# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please do not report it publicly. Instead, please follow these steps:

1. **Email**: Send an email to the project maintainers (AWS Samples team)
2. **Do NOT** open a public GitHub issue
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested remediation if you have one

## Security Best Practices

### Configuration Files

This project contains placeholder values for sensitive configuration. Before deploying, you must:

1. **Replace all placeholder values** in configuration files with your own values
2. **Never commit** actual credentials or sensitive information
3. **Use AWS Secrets Manager** for storing sensitive data like bearer tokens and passwords
4. **Rotate credentials regularly**

### Sensitive Information to Replace

The following placeholders must be replaced with your actual values:

- `YOUR_AWS_ACCOUNT_ID` - Your AWS account ID
- `YOUR_USER_POOL_ID` - Cognito User Pool ID
- `YOUR_COGNITO_CLIENT_ID` - Cognito Client ID
- `YOUR_IDENTITY_POOL_ID` - Cognito Identity Pool ID
- `YOUR_GRAPHQL_API_URL` - AppSync GraphQL API URL
- `YOUR_GATEWAY_URL` - Bedrock AgentCore Gateway URL
- `YOUR_GATEWAY_ID` - Gateway ID
- `YOUR_TARGET_ID` - Target ID
- `YOUR_S3_BUCKET_NAME` - S3 bucket name
- `YOUR_TEST_USERNAME` - Test user email
- `YOUR_TEST_PASSWORD` - Test user password
- `YOUR_RUNTIME_NAME` - Agent runtime name
- `YOUR_DEFAULT_PASSWORD` - Default test password

### Files to Configure

Before running the project, copy template files and fill in your values:

```bash
# Agent Runtime Configuration
cp config.template.json agent-runtime/config/config.json

# Frontend Environment Variables
cp amplify-frontend/src/env.template.json amplify-frontend/src/env.json

# Amplify Outputs
cp amplify-frontend/src/amplify_outputs.template.json amplify-frontend/src/amplify_outputs.json
```

### IAM Policy

The IAM policies in this project use placeholder account IDs. When deploying:

1. Replace `YOUR_AWS_ACCOUNT_ID` in policy files
2. Follow the principle of least privilege
3. Review and restrict resource ARN patterns as needed for your use case

### Secret Management

This project uses AWS Secrets Manager for storing:
- Cognito bearer tokens
- User credentials

**Important**: Never hardcode these values in source code or configuration files.

## Known Security Considerations

1. **Test passwords** are provided as examples and should be changed in production
2. **Default IAM policies** grant broad permissions for demonstration purposes - restrict them for production use
3. **GraphQL API** has public IAM access enabled for unauthenticated access - secure this for production deployments

## Compliance

- AWS Well-Architected Framework Security Pillar principles are followed
- Secrets are stored using AWS Secrets Manager
- IAM roles follow least privilege principles
- Cognito is used for user authentication and authorization

## Updates

This security policy will be updated as needed to reflect changes in the security posture of the project.

