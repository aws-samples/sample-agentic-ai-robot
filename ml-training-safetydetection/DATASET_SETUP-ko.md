# Dataset Setup Guide

## 데이터셋 압축 해제 및 훈련 실행 가이드

### 1. 데이터셋 압축 해제

압축된 데이터셋을 사용하기 전에 다음 명령어로 압축을 해제하세요:

```bash
# ml-training-safetydetection 디렉토리로 이동
cd ml-training-safetydetection

# 데이터셋 압축 해제
unzip dataset_balanced.zip

# 압축 해제 확인
ls -la dataset_balanced/
```

### 2. 훈련 스크립트 실행

데이터셋 압축 해제 후 다음 명령어로 훈련을 시작할 수 있습니다:

```bash
# Python 의존성 설치 (필요한 경우)
pip install ultralytics opencv-python pillow

# 훈련 실행
python complete_training.py
```

### 3. 파일 구조

압축 해제 후 다음과 같은 구조가 생성됩니다:

```
ml-training-safetydetection/
├── dataset_balanced.zip          # 압축된 데이터셋
├── dataset_balanced/             # 압축 해제된 데이터셋
│   ├── train/
│   │   ├── images/              # 훈련용 이미지
│   │   └── labels/              # 훈련용 라벨
│   ├── val/
│   │   ├── images/              # 검증용 이미지
│   │   └── labels/              # 검증용 라벨
│   └── dataset.yaml             # 데이터셋 설정 파일
├── complete_training.py          # 훈련 스크립트
├── classes.txt                   # 클래스 정의
└── README.md                     # 상세 문서
```

### 4. 주의사항

- 압축 해제 전에 충분한 디스크 공간이 있는지 확인하세요
- 훈련 시작 전에 GPU 메모리와 시스템 리소스를 확인하세요
- 훈련 중에는 시스템 리소스 사용량이 높을 수 있습니다

### 5. 문제 해결

압축 해제나 훈련 중 문제가 발생하면:

1. 압축 파일 무결성 확인: `unzip -t dataset_balanced.zip`
2. 디스크 공간 확인: `df -h`
3. Python 패키지 설치 확인: `pip list | grep ultralytics`

자세한 내용은 README.md 파일을 참조하세요.
