# ML 훈련 - 안전 감지

산업 환경에서 실시간 위험 감지를 위한 YOLOv8 및 ONNX를 사용한 산업 안전 감지 모델 훈련 프로젝트입니다.

## 🎯 개요

이 프로젝트는 다음을 식별할 수 있는 안전 감지 모델 훈련을 위한 완전한 머신러닝 파이프라인을 제공합니다:
- **연기(Smoke)** - 연기 인식을 통한 조기 화재 감지
- **화재(Fire)** - 직접적인 불꽃 및 화재 감지
- **사람 쓰러짐(Person Down)** - 쓰러지거나 부상당한 인원 감지

훈련된 모델은 실시간 추론을 위해 ONNX 형식을 사용하여 엣지 디바이스에 배포하도록 최적화되었습니다.

## 📁 프로젝트 구조

```
ml-training-safetydetection/
├── complete_training.py          # 메인 훈련 스크립트
├── onnx_inference_final.py       # ONNX 추론 및 테스트
├── classes.txt                   # 클래스 정의
├── README.md                     # 영문 문서
├── README.md.ko                  # 한글 문서 (이 파일)
├── MODEL_USAGE_GUIDE.md          # 상세 모델 사용 가이드
├── onnx_optimization_guide.md    # ONNX 최적화 팁
├── industrial_safety_final.pt    # 사전 훈련된 PyTorch 모델 (6MB)
├── yolov8n.pt                   # YOLOv8 nano 베이스 모델 (6MB)
└── dataset_balanced/            # 훈련 데이터셋
    ├── dataset.yaml             # 데이터셋 설정
    ├── train/
    │   ├── images/              # 훈련 이미지
    │   └── labels/              # 훈련 라벨 (YOLO 형식)
    └── val/
        ├── images/              # 검증 이미지
        └── labels/              # 검증 라벨 (YOLO 형식)
```

## 🚀 빠른 시작

### 사전 요구사항

```bash
pip install ultralytics opencv-python onnxruntime numpy boto3 sagemaker
```

### 훈련 옵션

#### 옵션 1: 로컬 훈련

```bash
python complete_training.py
```

#### 옵션 2: AWS SageMaker 훈련

GPU 가속을 통한 대규모 훈련의 경우:

**1. SageMaker 훈련 스크립트 준비**

`sagemaker_train.py` 생성:
```python
import sagemaker
from sagemaker.pytorch import PyTorch
from sagemaker import get_execution_role

# SageMaker 세션 및 역할
sagemaker_session = sagemaker.Session()
role = get_execution_role()

# 데이터셋을 S3에 업로드
dataset_s3_path = sagemaker_session.upload_data(
    path='./dataset_balanced',
    bucket='your-sagemaker-bucket',
    key_prefix='safety-detection/dataset'
)

# PyTorch 추정기 정의
estimator = PyTorch(
    entry_point='complete_training.py',
    source_dir='.',
    role=role,
    instance_type='ml.g4dn.xlarge',  # GPU 인스턴스
    instance_count=1,
    framework_version='2.0.0',
    py_version='py310',
    hyperparameters={
        'epochs': 100,
        'batch-size': 32,
        'learning-rate': 0.001
    }
)

# 훈련 시작
estimator.fit({'training': dataset_s3_path})
```

**2. SageMaker 훈련 실행**
```bash
python sagemaker_train.py
```

**3. 모델 엔드포인트 배포**
```python
# 훈련된 모델 배포
predictor = estimator.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.large'
)

# 예측 수행
result = predictor.predict(image_data)
```

### 2. ONNX 모델 테스트

```bash
python onnx_inference_final.py
```

이 스크립트는 다음을 수행합니다:
- ONNX 모델 로드 (`best.onnx`)
- 추론 속도 테스트
- 감지 정확도 검증
- 샘플 감지 결과 생성

## 📊 모델 클래스

| 클래스 ID | 이름 | 설명 |
|----------|------|-------------|
| 0 | smoke | 조기 화재 경고를 위한 연기 감지 |
| 1 | fire | 직접적인 불꽃 및 화재 감지 |
| 2 | person_down | 쓰러지거나 부상당한 사람 감지 |

## 🔧 훈련 세부사항

### 로컬 훈련 설정
- 베이스 모델: YOLOv8 nano
- 이미지 크기: 640x640
- 배치 크기: 16
- 에포크: 50
- 디바이스: MPS (Apple Silicon) 또는 CPU
- 검증: 빠른 훈련을 위해 비활성화

### SageMaker 훈련 설정
- 인스턴스 타입: ml.g4dn.xlarge (GPU)
- 베이스 모델: YOLOv8 nano
- 이미지 크기: 640x640
- 배치 크기: 32 (GPU로 인한 더 큰 크기)
- 에포크: 100 (더 나은 정확도를 위한 더 많은 에포크)
- 프레임워크: PyTorch 2.0.0
- Python: 3.10

### 훈련 출력
- `runs/detect/safety_complete/weights/best.pt` - 최고 PyTorch 모델
- `best.onnx` - 내보낸 ONNX 모델
- SageMaker: S3에 저장된 모델 아티팩트

### 데이터셋 형식
- **이미지**: JPG/PNG 형식, 권장 해상도 640x640
- **라벨**: YOLO 형식 (.txt 파일)
  ```
  class_id x_center y_center width height
  ```
  모든 좌표는 0-1 범위로 정규화

### 모델 아키텍처
- **베이스**: YOLOv8 nano (엣지 배포를 위한 경량화)
- **입력 크기**: 640x640x3
- **출력**: 클래스 확률이 포함된 바운딩 박스
- **추론 속도**: 최신 하드웨어에서 ~10-20ms

### 훈련 매개변수
```python
epochs=50           # 훈련 반복 횟수
imgsz=640          # 입력 이미지 크기
batch=16           # 배치 크기
device='mps'       # Apple Silicon GPU
val=False          # 속도를 위해 검증 건너뛰기
```

## 📈 성능 지표

### 모델 크기
- **PyTorch (.pt)**: ~6MB
- **ONNX (.onnx)**: ~12MB
- **추론 속도**: 하드웨어에 따라 10-50ms

### 정확도 (추정치)
- **연기 감지**: 85-90% mAP@0.5
- **화재 감지**: 90-95% mAP@0.5
- **사람 쓰러짐**: 80-85% mAP@0.5

## 🔄 모델 내보내기 워크플로

1. **훈련**: YOLOv8을 사용한 PyTorch 모델 훈련
2. **내보내기**: 배포를 위해 ONNX 형식으로 변환
3. **최적화**: 추론을 위한 ONNX 모델 최적화
4. **배포**: 엣지 디바이스 또는 클라우드에 배포

## 📝 사용 예제

### 커스텀 데이터셋 훈련
```python
from ultralytics import YOLO

# 베이스 모델 로드
model = YOLO('yolov8n.pt')

# 커스텀 데이터셋으로 훈련
results = model.train(
    data='./dataset_balanced/dataset.yaml',
    epochs=50,
    imgsz=640,
    batch=16
)

# ONNX로 내보내기
model.export(format='onnx')
```

### ONNX 추론
```python
import onnxruntime as ort
import cv2
import numpy as np

# ONNX 모델 로드
session = ort.InferenceSession('best.onnx')

# 이미지 준비
image = cv2.imread('test_image.jpg')
image = cv2.resize(image, (640, 640))
image = image.astype(np.float32) / 255.0
image = np.transpose(image, (2, 0, 1))
image = np.expand_dims(image, axis=0)

# 추론 실행
outputs = session.run(None, {'images': image})
```

## 🛠️ 커스터마이징

### SageMaker 훈련 커스터마이징

**하이퍼파라미터 튜닝:**
```python
from sagemaker.tuner import HyperparameterTuner, IntegerParameter, ContinuousParameter

# 하이퍼파라미터 범위 정의
hyperparameter_ranges = {
    'learning-rate': ContinuousParameter(0.0001, 0.01),
    'batch-size': IntegerParameter(16, 64),
    'epochs': IntegerParameter(50, 200)
}

# 튜너 생성
tuner = HyperparameterTuner(
    estimator,
    objective_metric_name='validation:mAP',
    hyperparameter_ranges=hyperparameter_ranges,
    max_jobs=10,
    max_parallel_jobs=2
)

# 튜닝 시작
tuner.fit({'training': dataset_s3_path})
```

**멀티 GPU 훈련:**
```python
estimator = PyTorch(
    entry_point='complete_training.py',
    instance_type='ml.p3.8xlarge',  # 멀티 GPU 인스턴스
    instance_count=1,
    distribution={'parameter_server': {'enabled': True}}
)
```

**스팟 인스턴스 훈련 (비용 최적화):**
```python
estimator = PyTorch(
    entry_point='complete_training.py',
    use_spot_instances=True,
    max_wait=7200,  # 2시간
    max_run=3600,   # 1시간
    checkpoint_s3_uri='s3://your-bucket/checkpoints/'
)
```

### 새 클래스 추가
1. 새 클래스 이름으로 `classes.txt` 업데이트
2. 새 클래스를 포함하도록 `dataset.yaml` 수정
3. 새 클래스 라벨로 훈련 데이터 준비
4. 모델 재훈련

### 훈련 매개변수 조정
`complete_training.py` 편집:
```python
# 더 나은 정확도를 위해 에포크 증가
epochs=100

# GPU 메모리에 따라 배치 크기 조정
batch=8  # 제한된 메모리용

# 검증 활성화
val=True
```

## 🔍 문제 해결

### 로컬 훈련 문제

**메모리 부족 오류:**
- 배치 크기 줄이기: `batch=8` 또는 `batch=4`
- 더 작은 이미지 크기 사용: `imgsz=416`

**낮은 감지 정확도:**
- 훈련 에포크 증가: `epochs=100`
- 더 많은 훈련 데이터 추가
- 데이터 증강 활성화

**느린 추론:**
- GPU 가속 사용
- ONNX 모델 최적화
- 입력 이미지 크기 줄이기

### SageMaker 훈련 문제

**훈련 작업 실패:**
```bash
# CloudWatch 로그 확인
aws logs describe-log-groups --log-group-name-prefix /aws/sagemaker/TrainingJobs

# 특정 훈련 작업 로그 보기
aws logs get-log-events --log-group-name /aws/sagemaker/TrainingJobs/your-job-name
```

**높은 훈련 비용:**
- 스팟 인스턴스 사용 (최대 90% 비용 절감)
- 적절한 인스턴스 타입 선택
- 조기 중단 활성화
- 실험용으로 더 작은 데이터셋 사용

**데이터 접근 문제:**
```python
# 적절한 S3 권한 확인
import boto3
s3 = boto3.client('s3')
s3.head_object(Bucket='your-bucket', Key='dataset/train/images/image1.jpg')
```

**모델 배포 실패:**
- 엔드포인트 설정 확인
- S3의 모델 아티팩트 검증
- IAM 권한 검토

## 📚 추가 자료

- [YOLOv8 문서](https://docs.ultralytics.com/)
- [ONNX Runtime 문서](https://onnxruntime.ai/docs/)
- [AWS SageMaker 문서](https://docs.aws.amazon.com/sagemaker/)
- [SageMaker Python SDK](https://sagemaker.readthedocs.io/)
- [MODEL_USAGE_GUIDE.md](./MODEL_USAGE_GUIDE.md) - 상세 사용 지침
- [onnx_optimization_guide.md](./onnx_optimization_guide.md) - 성능 최적화

### SageMaker 자료
- [SageMaker 훈련 모범 사례](https://docs.aws.amazon.com/sagemaker/latest/dg/training-best-practices.html)
- [SageMaker 요금](https://aws.amazon.com/ko/sagemaker/pricing/)
- [SageMaker 인스턴스 타입](https://docs.aws.amazon.com/sagemaker/latest/dg/notebooks-available-instance-types.html)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 라이선스가 부여됩니다 - 자세한 내용은 LICENSE 파일을 참조하세요.

## 🤝 기여

1. 저장소 포크
2. 기능 브랜치 생성
3. 개선사항 추가
4. 풀 리퀘스트 제출

## 📞 지원

질문 및 지원은 문서를 참조하거나 저장소에 이슈를 생성해 주세요.
