import json
import boto3
import os
import traceback

def lambda_handler(event, context):
    print(f"event: {event}")
    print(f"context: {context}")
    
    try:
        # Create SQS client
        sqs = boto3.client('sqs')
        region = os.environ.get('AWS_REGION', 'ap-northeast-2')
        account_id = context.invoked_function_arn.split(':')[4]
        
        # Construct SQS FIFO queue URL
        queue_url = f"https://sqs.{region}.amazonaws.com/{account_id}/robo_detection.fifo"
        
        # Send event to SQS FIFO queue
        response = sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(event),
            MessageGroupId='robo-detection-group',  # Required for FIFO queue
            MessageDeduplicationId=str(context.aws_request_id),  # Required for FIFO queue
            MessageAttributes={
                'source': {
                    'StringValue': 'iot-core',
                    'DataType': 'String'
                },
                'timestamp': {
                    'StringValue': str(context.aws_request_id),
                    'DataType': 'String'
                }
            }
        )
        
        print(f"Message sent to SQS: {response['MessageId']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event successfully pushed to SQS',
                'messageId': response['MessageId'],
                'event': event
            })
        }
        
    except Exception as e:
        print(f"Error pushing to SQS: {str(e)}")
        traceback.print_exc()
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'event': event
            })
        }
