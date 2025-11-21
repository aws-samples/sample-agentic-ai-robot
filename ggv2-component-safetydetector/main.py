import json
import logging
import os
import time
from datetime import datetime
import cv2
import boto3
import onnxruntime as ort
import numpy as np
import awsiot.greengrasscoreipc
from awsiot.greengrasscoreipc.model import (
    PublishToIoTCoreRequest,
    PublishMessage,
    BinaryMessage,
    QOS
)

# Logging configuration (output to stdout)
import sys
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout  # Use stdout instead of stderr
)
logger = logging.getLogger(__name__)

class SafetyDetector:
    def __init__(self):
        # Environment variables
        self.bucket_name = os.environ.get('BUCKET_NAME', 'industry-robot-detected-images')
        self.iot_endpoint = os.environ.get('IOT_ENDPOINT', 'a1pm7vwlqx4dto-ats.iot.ap-northeast-2.amazonaws.com')
        self.detect_count = int(os.environ.get('DETECT_COUNT', '1'))
        self.detect_interval = float(os.environ.get('DETECT_INTERVAL', '0.2'))  # Original 0.2 seconds
        
        # ONNX optimization settings (3 classes) - Performance-based thresholds
        self.class_thresholds = {
            'smoke': 0.8,       # Smoke threshold
            'fire': 0.50,        # Fire threshold set to 0.5
            'person_down': 0.8  # Person_down threshold
        }
        
        # Load ONNX model (CPU only)
        try:
            # CPU-only session options
            sess_options = ort.SessionOptions()
            sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            
            self.session = ort.InferenceSession('best.onnx', 
                                              providers=['CPUExecutionProvider'],
                                              sess_options=sess_options)
            self.input_name = self.session.get_inputs()[0].name
            self.output_names = [output.name for output in self.session.get_outputs()]
            
            logger.info("CPU mode -  ONNX model load success")
            
        except Exception as e:
            logger.error(f"ONNX 모델 로드 실패: {e}")
            raise
        
        # 클래스 이름 (ONNX 모델 - 3개 클래스)
        self.class_names = {
            0: 'smoke',      
            1: 'fire',
            2: 'person_down'
        }
        
        # AWS 클라이언트
        self.s3_client = boto3.client('s3')
        
        # Greengrass IPC 클라이언트
        try:
            self.ipc_client = awsiot.greengrasscoreipc.connect()
            logger.info("✅ Greengrass IPC 연결 성공")
        except Exception as e:
            logger.error(f"❌ Greengrass IPC 연결 실패: {e}")
            self.ipc_client = None
        
        # Risk level mapping (3 classes, smoke added)
        self.risk_levels = {
            'smoke': 'MEDIUM',   # smoke risk level added
            'fire': 'HIGH',
            'person_down': 'HIGH'
        }
        
        #logger.info("SafetyDetector initialization completed")
        #logger.info(f"Class thresholds: {self.class_thresholds}")
    
    def preprocess_image(self, image):
        """Image preprocessing"""
        # Resize to 640x640
        resized = cv2.resize(image, (640, 640))
        # BGR to RGB
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        # Normalization and dimension change
        normalized = rgb.astype(np.float32) / 255.0
        input_tensor = np.transpose(normalized, (2, 0, 1))  # HWC to CHW
        input_tensor = np.expand_dims(input_tensor, axis=0)  # 배치 차원 추가
        return input_tensor
    
    def postprocess_outputs(self, outputs, original_shape):
        """Modified ONNX output postprocessing - Handle correct YOLO format"""
        all_detections = []
        output = outputs[0][0]  # (1, 7, 8400) -> (7, 8400)
        
        # 전치: (7, 8400) -> (8400, 7)
        output = output.T
        
        # 원본 이미지 크기
        orig_h, orig_w = original_shape[:2]
        
        for detection in output:
            # YOLOv8 ONNX 출력 형태: [x, y, w, h, cls0_conf, cls1_conf, cls2_conf]
            x, y, w, h = detection[:4]
            class_confs = detection[4:]  # 클래스별 confidence
            
            # 최고 confidence 클래스 찾기
            max_conf = np.max(class_confs)
            cls_id = np.argmax(class_confs)
            
            if cls_id in self.class_names:
                class_name = self.class_names[cls_id]
                
                # 클래스별 임계값만 적용
                if class_name in self.class_thresholds:
                    if max_conf >= self.class_thresholds[class_name]:
                            # 640x640 기준 좌표를 원본 크기로 스케일링
                            x1 = int((x - w/2) * orig_w / 640)
                            y1 = int((y - h/2) * orig_h / 640)
                            x2 = int((x + w/2) * orig_w / 640)
                            y2 = int((y + h/2) * orig_h / 640)
                            
                            # 좌표 범위 제한
                            x1 = max(0, min(x1, orig_w))
                            y1 = max(0, min(y1, orig_h))
                            x2 = max(0, min(x2, orig_w))
                            y2 = max(0, min(y2, orig_h))
                            
                            detection_result = {
                                'class': class_name,
                                'confidence': float(max_conf),
                                'position': [x1, y1, x2, y2],
                                'risk_level': self.risk_levels.get(class_name, 'LOW')
                            }
                            all_detections.append(detection_result)
        
        # 클래스별 최고 신뢰도만 선택
        best_detections = {}
        for detection in all_detections:
            class_name = detection['class']
            if class_name not in best_detections or detection['confidence'] > best_detections[class_name]['confidence']:
                best_detections[class_name] = detection
        
        return list(best_detections.values())
    
    def detect_objects(self, frame):
        """ONNX object detection"""
        try:
            # Store original image size
            original_shape = frame.shape
            
            # Preprocessing
            input_tensor = self.preprocess_image(frame)
            
            # 추론
            outputs = self.session.run(self.output_names, {self.input_name: input_tensor})
            
            # 디버그 로그 추가
            logger.info(f"ONNX output shape: {outputs[0].shape}")
            if len(outputs[0][0]) > 0:
                logger.info(f"First detection sample: {outputs[0][0][:, 0]}")
            
            # Postprocessing (pass original size) - Above threshold only
            detections = self.postprocess_outputs(outputs, original_shape)
            
            return detections
            
        except Exception as e:
            logger.error(f"Object detection error: {e}")
            return []
    
    def log_all_detections(self, outputs, original_shape):
        """Log all detection results (including below threshold)"""
        output = outputs[0][0]  # (1, 7, 8400) -> (7, 8400)
        output = output.T  # (8400, 7)
        
        # 클래스별 최고 신뢰도 수집
        class_scores = {}
        
        for detection in output:
            x, y, w, h, conf, cls_conf, cls_id = detection
            
            if conf > 0.01:  # Collect all detections with very low threshold
                cls_id = int(cls_id)
                if cls_id in self.class_names:
                    class_name = self.class_names[cls_id]
                    
                    # 클래스별 최고 신뢰도 업데이트
                    if class_name not in class_scores or conf > class_scores[class_name]:
                        class_scores[class_name] = float(conf)
        
        # 모든 클래스의 신뢰도 로그 출력
        for class_name in self.class_names.values():
            score = class_scores.get(class_name, 0.0)
            threshold = self.class_thresholds.get(class_name, 0.5)
            status = "✓ DETECTED" if score >= threshold else "✗ NOT_DETECTED"
            logger.info(f"{class_name}: {score:.3f} (임계값: {threshold}) {status}")
    
    def upload_to_s3(self, frame, filename, detections=None):
        """S3에 이미지 업로드 (바운딩 박스 포함)"""
        try:
            # 바운딩 박스 그리기
            if detections:
                for detection in detections:
                    x1, y1, x2, y2 = detection['position']
                    class_name = detection['class']
                    confidence = detection['confidence']
                    risk_level = detection['risk_level']
                    
                    # Color setting based on risk level
                    if risk_level == "CRITICAL":
                        color = (0, 0, 255)  # Red
                    elif risk_level == "HIGH":
                        color = (0, 165, 255)  # 주황
                    elif risk_level == "MEDIUM":
                        color = (0, 255, 255)  # 노랑 (smoke용)
                    else:
                        color = (255, 255, 0)  # 하늘색
                    
                    # 바운딩 박스 그리기
                    thickness = 3
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
                    
                    # 라벨 텍스트 (클래스명 + 신뢰도)
                    label = f"{class_name}: {confidence:.2f}"
                    
                    # 텍스트 크기 계산
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    font_scale = 0.8
                    font_thickness = 2
                    (text_width, text_height), baseline = cv2.getTextSize(label, font, font_scale, font_thickness)
                    
                    # 라벨 배경 박스 (텍스트보다 약간 크게)
                    label_y = y1 - text_height - 10
                    if label_y < 0:  # 이미지 상단 경계 처리
                        label_y = y2 + text_height + 10
                    
                    cv2.rectangle(frame, 
                                (x1, label_y - 5), 
                                (x1 + text_width + 10, label_y + text_height + 5), 
                                color, -1)
                    
                    # 라벨 텍스트 (흰색, 굵게)
                    cv2.putText(frame, label, 
                              (x1 + 5, label_y + text_height), 
                              font, font_scale, (255, 255, 255), font_thickness)
            
            # 이미지 인코딩
            _, buffer = cv2.imencode('.jpg', frame)
            
            # S3 업로드
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=f"detected/{filename}",
                Body=buffer.tobytes(),
                ContentType='image/jpeg'
            )
            
            logger.info(f"S3 업로드 성공: {filename}")
            return True
            
        except Exception as e:
            logger.error(f"S3 업로드 실패: {e}")
            return False
    
    def publish_mqtt_message(self, detections, filename):
        """Greengrass IPC로 IoT Core MQTT 메시지 발행"""
        try:
            if not self.ipc_client:
                logger.error("❌ IPC 클라이언트가 없습니다")
                return
                
            # S3 전체 경로 생성
            s3_url = f"s3://{self.bucket_name}/detected/{filename}"
                
            message = {
                'filename': s3_url,
                'timestamp': int(time.time()),
                'results': detections
            }
            
            # Greengrass IPC로 IoT Core에 발행
            request = PublishToIoTCoreRequest()
            request.topic_name = "data/edge/firedetected"
            request.payload = json.dumps(message).encode('utf-8')
            request.qos = QOS.AT_LEAST_ONCE
            
            operation = self.ipc_client.new_publish_to_iot_core()
            operation.activate(request)
            future = operation.get_response()
            future.result(timeout=10.0)
            
            logger.info(f"✅ Greengrass IPC MQTT message published successfully: {len(detections)} detections")
            
        except Exception as e:
            logger.error(f"❌ MQTT 발행 실패: {e}")
    
    def process_frame(self, frame):
        """프레임 처리"""
        detections = self.detect_objects(frame)
        
        if len(detections) >= self.detect_count:
            # 파일명 생성
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp}-detection.jpg"
            
            # S3 업로드
            if self.upload_to_s3(frame, filename):
                # MQTT 메시지 발행
                self.publish_mqtt_message(detections, filename)
                
                # 로그 출력
                for detection in detections:
                    logger.info(
                        f"Detection: {detection['class']} "
                        f"({detection['confidence']:.3f}) "
                        f"Risk level: {detection['risk_level']}"
                    )
        
        return detections
    
    def run(self):
        """Main execution loop - File monitoring method"""
        logger.info("SafetyDetector started")
        logger.info(f"ONNX-only mode - File monitoring: example /home/unitree/captured_frames/")
        
        DIR = "/home/unitree/captured_frames/"
        old_files = []
        
        try:
            while True:
                # 디렉토리 존재 확인
                if not os.path.exists(DIR):
                    logger.warning(f"디렉토리가 존재하지 않습니다: {DIR}")
                    time.sleep(1.0)  # 디렉토리 없으면 더 오래 대기
                    continue
                
                # Get file list (optimized)
                try:
                    files = [f for f in os.listdir(DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                    if not files:
                        time.sleep(0.5)  # 파일 없으면 더 오래 대기
                        continue
                    files = sorted(files)
                except Exception as e:
                    logger.error(f"디렉토리 읽기 실패: {e}")
                    time.sleep(1.0)  # 에러 시 더 오래 대기
                    continue
                
                # 새로운 파일들만 처리
                new_files = [f for f in files if f not in old_files]
                if not new_files:
                    time.sleep(self.detect_interval)
                    continue
                
                logger.info(f"새 파일 {len(new_files)}개 발견")
                
                for filename in new_files:
                    file_path = os.path.join(DIR, filename)
                    logger.info(f"처리 중: {filename}")
                    
                    try:
                        # 이미지 로드
                        frame = cv2.imread(file_path)
                        if frame is None:
                            logger.warning(f"이미지 로드 실패: {filename}")
                            continue
                        
                        # 프레임 처리
                        detections = self.detect_objects(frame)
                        
                        if len(detections) >= self.detect_count:
                            # 타임스탬프 파일명 생성
                            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                            s3_filename = f"{timestamp}-{filename}"
                            
                            # S3 업로드 (바운딩 박스 포함)
                            if self.upload_to_s3(frame, s3_filename, detections):
                                # MQTT 메시지 발행
                                self.publish_mqtt_message(detections, s3_filename)
                                
                                # 로그 출력 - 클래스별 최고 신뢰도
                                for detection in detections:
                                    logger.info(
                                        f"Highest confidence detection: {detection['class']} "
                                        f"({detection['confidence']:.3f}) "
                                        f"Risk level: {detection['risk_level']}"
                                    )
                        
                        # 처리된 파일 삭제
                        try:
                            os.remove(file_path)
                            logger.info(f"파일 삭제: {filename}")
                        except Exception as e:
                            logger.error(f"파일 삭제 실패 {filename}: {e}")
                            
                    except Exception as e:
                        logger.error(f"파일 처리 오류 {filename}: {e}")
                
                # 파일 목록 업데이트
                old_files = files
                
                # 대기
                time.sleep(self.detect_interval)
                
        except KeyboardInterrupt:
            logger.info("사용자에 의한 종료")
        except Exception as e:
            logger.error(f"실행 오류: {e}")
        finally:
            if hasattr(self, 'ipc_client') and self.ipc_client:
                self.ipc_client.close()
            logger.info("SafetyDetector terminated")

def main():
    """Main function"""
    try:
        detector = SafetyDetector()
        detector.run()
    except Exception as e:
        logger.error(f"Main execution error: {e}")

if __name__ == "__main__":
    main()
