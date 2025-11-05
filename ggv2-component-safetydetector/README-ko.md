# Greengrass 안전 감지기

AWS IoT Greengrass용 ONNX YOLO 모델을 사용한 산업 안전 감지 컴포넌트입니다.

## 개요

이 컴포넌트는 컴퓨터 비전과 머신러닝을 사용하여 산업 환경에서 안전 위반 사항을 감지합니다. 실시간으로 카메라 피드를 처리하고 감지 결과를 AWS IoT Core에 게시합니다.

## 기능

- ONNX YOLO 모델을 사용한 실시간 안전 감지
- 감지된 위반 사항에 대한 자동 이미지 캡처 및 S3 업로드
- 실시간 알림을 위한 IoT Core 통합
- 구성 가능한 감지 매개변수

## 요구사항

- AWS IoT Greengrass Core v2
- Python 3.8+
- 카메라 장치
- AWS 자격 증명 구성

## 설치

1. 컴포넌트 빌드:
```bash
gdk component build
```

2. AWS에 게시:
```bash
gdk component publish
```

3. AWS IoT 콘솔을 통해 Greengrass 장치에 배포

## 구성

배포 시 다음 매개변수를 구성하세요:

- `BUCKET_NAME`: 감지된 이미지를 저장할 S3 버킷
- `IOT_ENDPOINT`: AWS IoT 엔드포인트
- `DETECT_COUNT`: 알림을 트리거하기 전 감지 횟수
- `DETECT_INTERVAL`: 감지 간격(초)

## 사용법

컴포넌트는 배포되면 자동으로 시작되어 안전 위반 사항에 대한 카메라 피드 모니터링을 시작합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 라이선스가 부여됩니다.
