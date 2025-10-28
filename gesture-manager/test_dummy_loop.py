import boto3
import time
import json

topic = "data/edge/gesture"

def generate_payload():
    timestamp = int(time.time())
    print('timestamp: ', timestamp)

    payload = {
        "filename": "s3://industry-robot-detected-images/gestures/1758091668-gesture-help!.jpg",
        "timestamp": timestamp,
        "results": [
            {
                "class": "help!",
                "confidence": 1.0
            }
        ]
    }
    
    return payload

def main():
    start_time = time.time()
    while True:
        payload = generate_payload()
        print('payload: ', payload)
        
        client = boto3.client(
            'iot-data',
            region_name='ap-northeast-2'
        )
        response = client.publish(
            topic=topic,
            payload=json.dumps(payload),
            qos=1
        )
        print('response: ', response)
        time.sleep(10)
        if time.time() - start_time > 600:
            break

if __name__ == "__main__":
    main()