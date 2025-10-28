import json
import boto3
import os
from datetime import datetime

def read_sqs_messages():
    """
    Read messages from robo_gesture SQS queue and print them
    """
    # Load configuration
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"Error: config.json not found at {config_path}")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in config.json: {e}")
        return
    
    try:
        region = config['region']
        account_id = config['accountId']
    except KeyError as e:
        print(f"Error: Missing required configuration key: {e}")
        return
    
    # Create SQS client
    try:
        sqs = boto3.client('sqs', region_name=region)
    except Exception as e:
        print(f"Error: Failed to create SQS client: {e}")
        return
    
    # Construct SQS FIFO queue URL
    queue_url = f"https://sqs.{region}.amazonaws.com/{account_id}/robo_gesture.fifo"
    
    print(f"Reading messages from SQS queue: {queue_url}")
    print("Press Ctrl+C to stop...")
    
    try:
        # Test queue access first
        try:
            sqs.get_queue_attributes(QueueUrl=queue_url, AttributeNames=['All'])
            print("Queue access verified successfully")
        except Exception as e:
            print(f"Error: Cannot access SQS queue: {e}")
            print("Please check:")
            print("1. Queue name is correct")
            print("2. AWS credentials are configured")
            print("3. You have permission to access the queue")
            return
        
        while True:
            # Receive messages from SQS
            try:
                response = sqs.receive_message(
                    QueueUrl=queue_url,
                    MaxNumberOfMessages=10,
                    WaitTimeSeconds=20,  # Long polling
                    MessageAttributeNames=['All']
                )
            except Exception as e:
                print(f"Error receiving messages: {e}")
                break
            
            messages = response.get('Messages', [])
            
            if messages:
                print(f"\n[{datetime.now()}] Received {len(messages)} message(s):")
                
                for message in messages:
                    # Print message details
                    print(f"Message ID: {message['MessageId']}")
                    print(f"Receipt Handle: {message['ReceiptHandle']}")
                    
                    # Print message attributes
                    if 'MessageAttributes' in message:
                        print("Message Attributes:")
                        for attr_name, attr_value in message['MessageAttributes'].items():
                            print(f"  {attr_name}: {attr_value['StringValue']}")
                    
                    # Print message body
                    try:
                        message_body = json.loads(message['Body'])
                        print(f"Message Body: {json.dumps(message_body, indent=2)}")
                    except json.JSONDecodeError:
                        print(f"Message Body (raw): {message['Body']}")
                    
                    print("-" * 50)
                    
                    # Delete message after processing
                    try:
                        sqs.delete_message(
                            QueueUrl=queue_url,
                            ReceiptHandle=message['ReceiptHandle']
                        )
                        print(f"Message {message['MessageId']} deleted from queue")
                    except Exception as e:
                        print(f"Error deleting message {message['MessageId']}: {e}")
            else:
                print(f"[{datetime.now()}] No messages received, waiting...")
                
    except KeyboardInterrupt:
        print("\nStopping message reader...")
    except Exception as e:
        print(f"Error reading messages: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    read_sqs_messages()