import json
import os
import time

import boto3
from ultralytics import YOLO
from ultralytics.engine.results import Results

DIR = "/home/ggc_user/images/"
FILENAME = "frame*.jpg"
DEFAULT_WAIT = 0.2
S3_PREFIX = "detected/"
TOPIC = "data/edge/firedetected"


class SafetyDetector:
    def __init__(self):
        s3 = boto3.resource('s3')
        self.bucket = s3.Bucket(os.getenv("BUCKET_NAME"))
        self.iot = boto3.client('iot-data', endpoint_url=f"https://{os.getenv('IOT_ENDPOINT')}")
        self.last_file = None
        self.old_files = []

        # 안전 관련 설정
        self.detect_labels = ["explosion", "fire", "person_down", "emergency_situation"]
        self.detect_count = int(os.getenv("DETECT_COUNT", "1"))
        self.detect_interval = float(os.getenv("DETECT_INTERVAL", "1.0"))
        self.confidence = float(os.getenv("DETECT_CONFIDENCE", "0.3"))

        # 현재 스크립트와 같은 디렉토리에서 모델 로드
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'best.pt')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
            
        self.model = YOLO(model_path)
        print(f"Safety detection model loaded from {model_path}")

    def is_safety_critical(self, class_name):
        return class_name.lower() in [label.lower() for label in self.detect_labels]

    def process(self):
        files = sorted(os.listdir(DIR))
        if not files:
            return
        file = os.path.join(DIR, files[-1])
        if file == self.last_file:
            return
        print(f"Processing {file}")
        
        time.sleep(DEFAULT_WAIT)
        try:
            results = self.model(source=file, conf=self.confidence)
        except FileNotFoundError as e:
            print(e)
            return
            
        result = results[0]
        self.last_file = file
        self.old_files = files
        
        # 빈 박스 체크
        if result.boxes is None or len(result.boxes) == 0:
            return None
        
        # 안전 위험 객체 탐지
        safety_count = 0
        for cls, conf in zip(result.boxes.cls, result.boxes.conf):
            class_name = result.names[int(cls)]
            if self.is_safety_critical(class_name) and conf >= self.confidence:
                safety_count += 1
        
        if safety_count >= self.detect_count:
            return result

    def upload(self, result):
        file = result.path
        filename = f'{int(time.time())}-{file.split("/")[-1]}'
        
        # 안전 위험 객체만 수집
        safety_detections = []
        for box, cls, conf in zip(result.boxes.xyxy, result.boxes.cls, result.boxes.conf):
            class_name = result.names[int(cls)]
            if self.is_safety_critical(class_name):
                x1, y1, x2, y2 = [int(coord) for coord in box]
                detection_info = {
                    "class": class_name,
                    "position": [x1, y1, x2, y2],
                    "confidence": float(conf),
                    "risk_level": "CRITICAL" if class_name.lower() in ["explosion", "fire", "person_down"] else "WARNING"
                }
                safety_detections.append(detection_info)
                print(f"SAFETY ALERT: {class_name} detected at [{x1},{y1},{x2},{y2}] confidence: {conf:.3f}")

        # 안전 위험 객체가 있을 때만 메시지 전송
        if safety_detections:
            msg = {
                "filename": filename, 
                "timestamp": int(time.time()), 
                "results": safety_detections
            }
            
            print(f"Publishing to {TOPIC}: {msg}")
            self.iot.publish(topic=TOPIC, qos=1, payload=json.dumps(msg))

            # S3 업로드
            key = f"{S3_PREFIX}{filename}"
            print(f"Uploading to S3: {key}")
            self.bucket.upload_file(file, key)

    def delete_files(self):
        for file in self.old_files:
            try:
                os.remove(os.path.join(DIR, file))
            except FileNotFoundError:
                pass
        self.old_files = []

    def run(self):
        print("Safety detection system started...")
        while True:
            result = self.process()
            if result:
                self.upload(result)
            self.delete_files()
            
            sleep_time = max(0.01, self.detect_interval - DEFAULT_WAIT)
            time.sleep(sleep_time)


def main():
    detector = SafetyDetector()
    detector.run()


if __name__ == '__main__':
    main()
