import boto3
import json
import zipfile
import time 
import os
import traceback

script_dir = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(script_dir, "config.json")

def load_config():
    config = None    
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)    
    except Exception as e:
        print(f"Error loading config: {e}")
        config = {}

        session = boto3.Session()
        region = session.region_name
        config['region'] = region
        config['projectName'] = "robo"

        sts_client = boto3.client('sts')
        accountId = sts_client.get_caller_identity()['Account']
        config['accountId'] = accountId
        config['topic'] = 'robot/control'
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
    return config
config = load_config()

current_path = os.path.basename(script_dir)
current_folder_name = current_path.split('/')[-1]
targetname = current_folder_name
projectName = config.get('projectName')
region = config.get('region')

accountId = config.get('accountId')
if not accountId:
    session = boto3.Session()
    region = session.region_name    
    sts_client = session.client('sts')
    accountId = sts_client.get_caller_identity()['Account']
    config['accountId'] = accountId
    print(f"accountId: {accountId}")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

def create_lambda_function_policy(lambda_function_name):
    """Create IAM policy for Lambda function access"""
    
    policy_name = "LambdaFunctionPolicy"+"For"+lambda_function_name
    policy_description = f"Policy for accessing Lambda function endpoints"
    
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AmazonBedrockAgentCoreGatewayLambdaProd",
                "Effect": "Allow",
                "Action": [
                    "lambda:*"
                ],
                "Resource": f"arn:aws:lambda:{region}:{accountId}:function:*"
            },
            {
                "Sid": "LogsAccess",
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                "Resource": [
                    f"arn:aws:logs:{region}:*:log-group:/aws/bedrock-agentcore/*",
                    f"arn:aws:logs:{region}:*:log-group:/aws/bedrock-agentcore/*:log-stream:*"
                ]
            },
            {
                "Sid": "CloudWatchAccess",
                "Effect": "Allow",
                "Action": [
                    'cloudwatch:ListMetrics', 
                    'cloudwatch:GetMetricData',
                    'cloudwatch:GetMetricStatistics',
                    'cloudwatch:GetMetricWidgetImage',
                    'cloudwatch:GetMetricData',
                    'cloudwatch:GetMetricData',
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords',
                    'xray:PutAttributes',
                    'xray:GetTraceSummaries',
                    'logs:CreateLogGroup',
                    'logs:DescribeLogStreams', 
                    'logs:DescribeLogGroups', 
                    'logs:CreateLogStream', 
                    'logs:PutLogEvents'
                ],
                "Resource": "*"
            },
            {
                "Sid": "IoTAccess",
                "Effect": "Allow",
                "Action": [
                    "iot:*"
                ],
                "Resource": "*"
            },
            {
                "Sid": "IoTRuleAccess",
                "Effect": "Allow",
                "Action": [
                    "iot:CreateTopicRule",
                    "iot:ReplaceTopicRule",
                    "iot:GetTopicRule",
                    "iot:DeleteTopicRule",
                    "iot:ListTopicRules",
                    "iot:EnableTopicRule",
                    "iot:DisableTopicRule"
                ],
                "Resource": [
                    f"arn:aws:iot:{region}:{accountId}:rule/robo_feedback_rule",
                    f"arn:aws:iot:{region}:{accountId}:rule/*"
                ]
            }
        ]
    }
    
    try:
        iam_client = boto3.client('iam')
        
        # Check if policy already exists
        try:
            existing_policy = iam_client.get_policy(PolicyArn=f"arn:aws:iam::{accountId}:policy/{policy_name}")
            print(f"Existing policy found: {existing_policy['Policy']['Arn']}")
            
            # List all policy versions
            versions_response = iam_client.list_policy_versions(PolicyArn=existing_policy['Policy']['Arn'])
            versions = versions_response['Versions']
            
            # If we have 5 versions, delete the oldest non-default version
            if len(versions) >= 5:
                print(f"Policy has {len(versions)} versions, cleaning up old versions...")
                
                # Find non-default versions to delete
                non_default_versions = [v for v in versions if not v['IsDefaultVersion']]
                
                if non_default_versions:
                    # Delete the oldest non-default version
                    oldest_version = non_default_versions[0]
                    iam_client.delete_policy_version(
                        PolicyArn=existing_policy['Policy']['Arn'],
                        VersionId=oldest_version['VersionId']
                    )
                    print(f"✓ Deleted old policy version: {oldest_version['VersionId']}")
                else:
                    # If all versions are default, we need to set a different version as default first
                    for version in versions[1:]:  # Skip the current default
                        try:
                            iam_client.set_default_policy_version(
                                PolicyArn=existing_policy['Policy']['Arn'],
                                VersionId=version['VersionId']
                            )
                            # Now delete the old default
                            iam_client.delete_policy_version(
                                PolicyArn=existing_policy['Policy']['Arn'],
                                VersionId=versions[0]['VersionId']
                            )
                            print(f"✓ Switched default version and deleted old version: {versions[0]['VersionId']}")
                            break
                        except Exception as e:
                            print(f"Failed to switch version {version['VersionId']}: {e}")
                            continue
            
            # Create policy version
            response = iam_client.create_policy_version(
                PolicyArn=existing_policy['Policy']['Arn'],
                PolicyDocument=json.dumps(policy_document),
                SetAsDefault=True
            )
            print(f"✓ Policy update completed: {response['PolicyVersion']['VersionId']}")
            return existing_policy['Policy']['Arn']
            
        except iam_client.exceptions.NoSuchEntityException:
            # Create new policy
            response = iam_client.create_policy(
                PolicyName=policy_name,
                PolicyDocument=json.dumps(policy_document),
                Description=policy_description
            )
            print(f"✓ New policy created: {response['Policy']['Arn']}")
            return response['Policy']['Arn']
            
    except Exception as e:
        print(f"Policy creation failed: {e}")
        return None

def attach_policy_to_role(role_name, policy_arn):
    """Attach policy to IAM role"""
    try:
        iam_client = boto3.client('iam')
        
        # Attach policy to role
        response = iam_client.attach_role_policy(
            RoleName=role_name,
            PolicyArn=policy_arn
        )
        print(f"✓ Policy attached successfully: {policy_arn}")
        return True
        
    except Exception as e:
        print(f"Policy attachment failed: {e}")
        return False

def create_trust_policy_for_lambda():
    """Create trust policy for Lambda function"""
    
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }    
    return trust_policy
    
def create_lambda_function_role(lambda_function_name):
    """Create IAM role for Lambda function access"""
    
    role_name = "LambdaFunctionRole"+"For"+lambda_function_name
    policy_arn = create_lambda_function_policy(lambda_function_name)
    
    if not policy_arn:
        print("Role creation aborted due to policy creation failure")
        return None
    
    try:
        iam_client = boto3.client('iam')
        
        # Check if role already exists
        try:
            existing_role = iam_client.get_role(RoleName=role_name)
            print(f"Existing role found: {existing_role['Role']['Arn']}")
            
            # Update trust policy
            trust_policy = create_trust_policy_for_lambda()
            iam_client.update_assume_role_policy(
                RoleName=role_name,
                PolicyDocument=json.dumps(trust_policy)
            )
            print("✓ Trust policy updated successfully")
            
            # Attach policy
            attach_policy_to_role(role_name, policy_arn)
            
            return existing_role['Role']['Arn']
            
        except iam_client.exceptions.NoSuchEntityException:
            # Create new role
            trust_policy = create_trust_policy_for_lambda()
            
            response = iam_client.create_role(
                RoleName=role_name,
                AssumeRolePolicyDocument=json.dumps(trust_policy),
                Description="Role for Lambda function access"
            )
            print(f"✓ New role created: {response['Role']['Arn']}")
            
            # Wait for role to be available
            print("Waiting for IAM role to be available...")
            time.sleep(10)
            
            # Attach policy
            attach_policy_to_role(role_name, policy_arn)
            
            # Wait for policy attachment to complete
            print("Waiting for policy attachment to complete...")
            time.sleep(5)
            
            return response['Role']['Arn']
            
    except Exception as e:
        print(f"Role creation failed: {e}")
        return None

def create_lambda_function_arn():
    # zip lambda
    lambda_function_name = 'lambda-' + current_folder_name + '-for-' + config['projectName']
    config['lambda_function_name'] = lambda_function_name
    lambda_function_zip_path = os.path.join(script_dir, lambda_function_name, "lambda_function.zip")
    lambda_dir = os.path.join(script_dir, lambda_function_name)
    # Create zip with all files and folders recursively
    try:
        with zipfile.ZipFile(lambda_function_zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:            
            for root, dirs, files in os.walk(lambda_dir):
                for file in files:
                    if file == 'lambda_function.zip':
                        continue
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, lambda_dir)
                    zip_file.write(file_path, arcname)
        print(f"✓ Lambda function zip created successfully: {lambda_function_zip_path}")
    except Exception as e:
        print(f"Failed to create Lambda function zip: {e}")
        
    lambda_function_arn = config.get('lambda_function_arn')    
    lambda_client = boto3.client('lambda', region_name=region)
    
    need_update = True
    if not lambda_function_arn:        
        print(f"search lambda function name: {lambda_function_name}")
                
        response = lambda_client.list_functions()
        for function in response['Functions']:
            if function['FunctionName'] == lambda_function_name:
                lambda_function_arn = function['FunctionArn']
                print(f"Lambda function found: {lambda_function_arn}")
                break

        if not lambda_function_arn:
            print(f"Lambda function not found, creating new lambda function")
            # create lambda function role
            lambda_function_role = create_lambda_function_role(lambda_function_name)
            
            if not lambda_function_role:
                print(f"Failed to create IAM role for Lambda function: {lambda_function_name}")
                return None

            # create lambda function
            need_update = False
            try:
                # Set environment variables
                environment_variables = {}
                environment_variables['TOPIC'] = config.get('topic', 'robot/control')
                
                response = lambda_client.create_function(
                    FunctionName=lambda_function_name,
                    Runtime='python3.13',
                    Handler='lambda_function.lambda_handler',
                    Role=lambda_function_role,
                    Description=f'Lambda function for {lambda_function_name}',
                    Timeout=60,
                    Environment={
                        'Variables': environment_variables
                    },
                    Code={
                        'ZipFile': open(lambda_function_zip_path, 'rb').read()
                    }
                )
                lambda_function_arn = response['FunctionArn']
                print(f"✓ Lambda function created successfully: {lambda_function_arn}")

                print("Waiting for Lambda function code creation to complete...")
                time.sleep(5)
            except Exception as e:
                print(f"Failed to create Lambda function: {e}")
                return None
    
    if need_update:
        # update lambda code
        response = lambda_client.update_function_code(
            FunctionName=lambda_function_name,
            ZipFile=open(lambda_function_zip_path, 'rb').read()
        )
        lambda_function_arn = response['FunctionArn']
        print(f"✓ Lambda function code updated successfully: {lambda_function_arn}")
        
        # Wait for code update to complete before updating configuration
        print("Waiting for Lambda function code update to complete...")
        time.sleep(5)
        
        try:
            # Set environment variables
            environment_variables = {}
            # environment_variables['KNOWLEDGE_BASE_ID'] = config.get('knowledge_base_id', "")
            
            lambda_client.update_function_configuration(
                FunctionName=lambda_function_name,
                Timeout=60,
                Environment={
                    'Variables': environment_variables
                }
            )
            print(f"✓ Lambda function timeout and environment variables updated")
        except Exception as e:
            print(f"Failed to update Lambda function configuration: {e}")
            return None

    # update config
    if lambda_function_arn:
        config['lambda_function_arn'] = lambda_function_arn

        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

    return lambda_function_name

def create_sqs_queue(queue_name):
    """Create SQS FIFO queue"""
    try:
        sqs_client = boto3.client('sqs', region_name=region)
        
        # Add .fifo suffix for FIFO queue
        fifo_queue_name = queue_name if queue_name.endswith('.fifo') else f"{queue_name}.fifo"
        
        # Check if queue already exists
        try:
            response = sqs_client.get_queue_url(QueueName=fifo_queue_name)
            print(f"Existing SQS FIFO queue found: {response['QueueUrl']}")
            return response['QueueUrl']
        except sqs_client.exceptions.QueueDoesNotExist:
            # Create new FIFO queue
            response = sqs_client.create_queue(
                QueueName=fifo_queue_name,
                Attributes={
                    'VisibilityTimeout': '30',
                    'MessageRetentionPeriod': '1209600',  # 14 days
                    'FifoQueue': 'true',
                    'ContentBasedDeduplication': 'true'  # Enable content-based deduplication
                }
            )
            print(f"✓ New SQS FIFO queue created: {response['QueueUrl']}")
            return response['QueueUrl']
            
    except Exception as e:
        print(f"SQS FIFO queue creation failed: {e}")
        return None

def create_iot_rule(rule_name, topic_filter, lambda_function_arn):
    """Create IoT Core rule to trigger Lambda function"""
    try:
        iot_client = boto3.client('iot', region_name=region)
        
        # IoT Core rule SQL statement
        sql_statement = f"SELECT * FROM '{topic_filter}'"
        
        # Lambda action configuration
        lambda_action = {
            'lambda': {
                'functionArn': lambda_function_arn
            }
        }
        
        # Wait for IAM permissions to propagate
        print("Waiting for IAM permissions to propagate...")
        time.sleep(60)  # Increase wait time to 60 seconds
        
        # Test IoT Core access before creating rule
        try:
            print("Testing IoT Core access...")
            iot_client.list_topic_rules()
            print("✓ IoT Core access confirmed")
        except Exception as e:
            print(f"✗ IoT Core access test failed: {e}")
            print("Please check IAM permissions for IoT Core")
            return False
        
        # Try to delete existing rule first to avoid permission issues
        try:
            print(f"Attempting to delete existing rule: {rule_name}")
            iot_client.delete_topic_rule(ruleName=rule_name)
            print(f"✓ Existing rule deleted: {rule_name}")
            time.sleep(5)  # Wait for deletion to complete
        except iot_client.exceptions.ResourceNotFoundException:
            print(f"No existing rule found: {rule_name}")
        except Exception as e:
            print(f"Could not delete existing rule: {e}")
        
        # Create new rule
        try:
            iot_client.create_topic_rule(
                ruleName=rule_name,
                topicRulePayload={
                    'sql': sql_statement,
                    'actions': [lambda_action],
                    'ruleDisabled': False,
                    'description': f'IoT rule to trigger Lambda for {topic_filter} topic'
                }
            )
            print(f"✓ New IoT rule created successfully: {rule_name}")
            return True
        except Exception as e:
            print(f"IoT rule creation failed: {e}")
            return False
    
    except Exception as e:
        print(f"IoT rule creation failed: {e}")
        return False

def add_lambda_permission_for_iot(lambda_function_name, lambda_function_arn):
    """Add permission for IoT Core to invoke Lambda function"""
    try:
        lambda_client = boto3.client('lambda', region_name=region)
        
        # Create a unique statement ID
        statement_id = f"iot_{lambda_function_name}_{int(time.time())}"
        
        # Add permission for IoT Core to invoke Lambda
        lambda_client.add_permission(
            FunctionName=lambda_function_name,
            StatementId=statement_id,
            Action='lambda:InvokeFunction',
            Principal='iot.amazonaws.com',
            SourceArn=f"arn:aws:iot:{region}:{accountId}:rule/robo_feedback_rule"
        )
        print(f"✓ Lambda permission added for IoT Core: {statement_id}")
        return True
        
    except lambda_client.exceptions.ResourceConflictException:
        print("✓ Lambda permission already exists for IoT Core")
        return True
    except Exception as e:
        print(f"Failed to add Lambda permission for IoT Core: {e}")
        return False

def test_robo_controller(lambda_function_name, action, message):
    try:
        payload = {
            'action': 'HAPPY',
            'message': 'Hello, I am happy'
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
    lambda_function_name = create_lambda_function_arn()
    print(f"lambda_function_name: {lambda_function_name}")

    time.sleep(5)

    action = 'HAPPY'
    message = '오늘은 정말 멋지네요!'
    print(f"action: {action}, message: {message}")
    test_robo_controller(lambda_function_name, action, message)

if __name__ == "__main__":
    main()