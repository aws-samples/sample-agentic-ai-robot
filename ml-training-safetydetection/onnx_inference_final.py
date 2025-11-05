#!/usr/bin/env python3
import onnxruntime as ort
import cv2
import numpy as np
import os

class IndustrialSafetyDetector:
    def __init__(self, model_path):
        self.session = ort.InferenceSession(model_path)
        self.input_name = self.session.get_inputs()[0].name
        
        self.class_names = {
            0: 'pipe', 1: 'valve', 2: 'tank', 3: 'safety_sign',
            4: 'steam', 5: 'equipment', 6: 'stairs', 7: 'railing',
            8: 'explosion', 9: 'fire', 10: 'person_down', 11: 'emergency_situation'
        }
        
        self.colors = {
            0: (255, 0, 0),      # pipe - blue
            1: (0, 255, 0),      # valve - green
            2: (255, 255, 0),    # tank - cyan
            3: (255, 0, 255),    # safety_sign - magenta
            4: (128, 128, 128),  # steam - gray
            5: (0, 128, 255),    # equipment - orange
            6: (255, 128, 0),    # stairs - sky blue
            7: (128, 255, 0),    # railing - lime
            8: (0, 255, 255),    # explosion - yellow
            9: (0, 0, 255),      # fire - red
            10: (255, 0, 255),   # person_down - magenta
            11: (0, 165, 255),   # emergency_situation - orange
        }

    def preprocess(self, image_path):
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot load image: {image_path}")
        
        original_img = img.copy()
        img = cv2.resize(img, (640, 640))
        img = img.transpose(2, 0, 1)  # HWC to CHW
        img = img.astype(np.float32) / 255.0
        img = np.expand_dims(img, axis=0)
        
        return img, original_img

    def postprocess(self, outputs, original_img, conf_threshold=0.1):
        # YOLO output format: [batch, 16, 8400] -> [batch, 8400, 16]
        predictions = outputs[0].transpose(0, 2, 1)
        boxes = []
        
        for i in range(predictions.shape[1]):
            detection = predictions[0, i, :]
            
            # 클래스 확률들 (4번째 인덱스부터)
            class_scores = detection[4:]
            confidence = np.max(class_scores)
            
            if confidence > conf_threshold:
                class_id = np.argmax(class_scores)
                x_center, y_center, width, height = detection[:4]
                
                # Convert to original image size
                h, w = original_img.shape[:2]
                x_center *= w / 640
                y_center *= h / 640
                width *= w / 640
                height *= h / 640
                
                x1 = int(x_center - width / 2)
                y1 = int(y_center - height / 2)
                x2 = int(x_center + width / 2)
                y2 = int(y_center + height / 2)
                
                # 유효한 바운딩 박스인지 확인
                if x1 >= 0 and y1 >= 0 and x2 <= w and y2 <= h and x2 > x1 and y2 > y1:
                    boxes.append({
                        'class_id': class_id,
                        'class_name': self.class_names[class_id],
                        'confidence': confidence,
                        'bbox': (x1, y1, x2, y2)
                    })
        
        return boxes

    def draw_results(self, image, boxes):
        for box in boxes:
            x1, y1, x2, y2 = box['bbox']
            class_name = box['class_name']
            confidence = box['confidence']
            class_id = box['class_id']
            
            # 색상 선택
            color = self.colors.get(class_id, (128, 128, 128))
            
            # 바운딩 박스 그리기
            cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
            
            # 라벨 텍스트
            label = f"{class_name}: {confidence:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            
            # 라벨 배경
            cv2.rectangle(image, (x1, y1 - label_size[1] - 10), 
                         (x1 + label_size[0], y1), color, -1)
            
            # 라벨 텍스트
            cv2.putText(image, label, (x1, y1 - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        return image

    def predict(self, image_path, output_path=None):
        # 전처리
        input_data, original_img = self.preprocess(image_path)
        
        # 추론
        outputs = self.session.run(None, {self.input_name: input_data})
        
        # 후처리
        boxes = self.postprocess(outputs, original_img)
        
        # 결과 그리기
        result_img = self.draw_results(original_img.copy(), boxes)
        
        # 결과 저장
        if output_path:
            cv2.imwrite(output_path, result_img)
        
        return boxes, result_img

def main():
    # 모델 로드
    model_path = "runs/detect/industrial_safety_final/weights/best.onnx"
    detector = IndustrialSafetyDetector(model_path)
    
    # Test images
    test_images = [
        "images/val/dt037.jpg",
        "images/train/dt013.jpg", 
        "images/train/dt033.jpg"
    ]
    
    print("=== ONNX 기반 산업 안전 AI 추론 결과 ===\n")
    
    for i, img_path in enumerate(test_images):
        if os.path.exists(img_path):
            print(f"📸 Test image {i+1}: {img_path}")
            
            try:
                # 추론 실행
                boxes, result_img = detector.predict(img_path, f"onnx_result_{i+1}.jpg")
                
                print(f"✅ 감지된 객체 수: {len(boxes)}")
                
                # 위험 상황 체크
                danger_detected = False
                normal_objects = []
                
                for box in boxes:
                    class_name = box['class_name']
                    confidence = box['confidence']
                    
                    if class_name in ['explosion', 'fire', 'person_down', 'emergency_situation']:
                        print(f"🚨 위험 감지: {class_name} (신뢰도: {confidence:.2f})")
                        danger_detected = True
                    else:
                        normal_objects.append(f"{class_name}: {confidence:.2f}")
                
                # 일반 객체들 출력
                if normal_objects:
                    print("📋 일반 객체:")
                    for obj in normal_objects:
                        print(f"   - {obj}")
                
                if not danger_detected and len(boxes) == 0:
                    print("✅ 객체 감지되지 않음")
                elif not danger_detected:
                    print("✅ 위험 상황 없음")
                
                print(f"💾 Result image saved: onnx_result_{i+1}.jpg\n")
                
            except Exception as e:
                print(f"❌ Error occurred: {e}\n")
        else:
            print(f"❌ Image file not found: {img_path}\n")
    
    print("🎯 Inference completed! Check the result images.")

if __name__ == "__main__":
    main()
