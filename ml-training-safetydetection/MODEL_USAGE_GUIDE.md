# 산업 안전 AI 모델 사용 가이드

## 모델 개요
- **모델명**: Industrial Safety Detection Model
- **버전**: Final v1.0
- **훈련 완료일**: 2025-09-26
- **모델 타입**: YOLOv8n 기반 객체 감지 모델

## 모델 파일
### PyTorch 모델
- **파일**: `industrial_safety_final.pt` (5.9MB)
- **용도**: Python 환경에서 직접 사용
- **추론 속도**: 빠름

### ONNX 모델  
- **파일**: `runs/detect/industrial_safety_final/weights/best.onnx` (12MB)
- **용도**: 다양한 플랫폼 호환 (C++, JavaScript, 모바일 등)
- **추론 속도**: 최적화됨

## 감지 가능한 클래스 (12개)
0. **pipe** - 파이프
1. **valve** - 밸브
2. **tank** - 탱크
3. **safety_sign** - 안전 표지
4. **steam** - 증기/연기
5. **equipment** - 장비
6. **stairs** - 계단
7. **railing** - 난간
8. **explosion** - 폭발 ⚠️
9. **fire** - 화재 🔥
10. **person_down** - 누워있는 사람 (인명사고) 🚨
11. **emergency_situation** - 응급상황 🆘

## 모델 성능
- **훈련 에포크**: 33 (Early Stopping)
- **최적 에포크**: 13
- **mAP50**: 0.188
- **mAP50-95**: 0.121
- **추론 속도**: ~32.4ms per image

## 사용 방법

### 1. Python (PyTorch)
```python
from ultralytics import YOLO

# 모델 로드
model = YOLO('industrial_safety_final.pt')

# 이미지 예측
results = model('image.jpg')

# 결과 출력
for result in results:
    boxes = result.boxes
    for box in boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        print(f"Class: {class_id}, Confidence: {confidence:.2f}")
```

### 2. ONNX Runtime
```python
import onnxruntime as ort
import numpy as np
import cv2

# ONNX 모델 로드
session = ort.InferenceSession('best.onnx')

# 이미지 전처리 (640x640)
img = cv2.imread('image.jpg')
img = cv2.resize(img, (640, 640))
img = img.transpose(2, 0, 1)  # HWC to CHW
img = img.astype(np.float32) / 255.0
img = np.expand_dims(img, axis=0)

# 추론
outputs = session.run(None, {'images': img})
```

### 3. CLI 사용
```bash
# PyTorch 모델로 예측
yolo predict model=industrial_safety_final.pt source=image.jpg

# ONNX 모델로 예측  
yolo predict model=best.onnx source=image.jpg
```

## 주요 특징
✅ **고위험 상황 감지**: 폭발, 화재, 인명사고 등 즉시 대응이 필요한 상황 감지
✅ **실시간 처리**: 빠른 추론 속도로 실시간 모니터링 가능
✅ **다중 플랫폼 지원**: ONNX 형식으로 다양한 환경에서 사용 가능
✅ **경량화**: 5.9MB의 작은 모델 크기로 엣지 디바이스에서도 사용 가능

## 활용 분야
- 🏭 **산업 현장 안전 모니터링**
- 🎥 **CCTV 기반 실시간 위험 감지**
- 📱 **모바일 안전 검사 앱**
- 🤖 **자동화 시스템 통합**
- 🚨 **응급 상황 자동 알림 시스템**

## 주의사항
- 입력 이미지 크기: 640x640 권장
- 조명 조건이 좋은 환경에서 최적 성능 발휘
- 실제 운영 환경에서는 추가 검증 필요
- 생명과 직결된 상황에서는 인간의 최종 판단 필수

## 모델 업데이트
- 새로운 데이터 추가 시 재훈련 가능
- 특정 산업 분야에 맞는 커스터마이징 지원
- 성능 개선을 위한 지속적인 업데이트 예정

---
**개발**: Amazon Q AI Assistant
**문의**: 모델 관련 문의사항은 개발팀에 연락
