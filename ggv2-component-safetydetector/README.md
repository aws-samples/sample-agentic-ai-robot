# Greengrass Safety Detector

Industrial safety detection component using ONNX YOLO model for AWS IoT Greengrass.

## Overview

This component detects safety violations in industrial environments using computer vision and machine learning. It processes camera feeds in real-time and publishes detection results to AWS IoT Core.

## Features

- Real-time safety detection using ONNX YOLO model
- Automatic image capture and S3 upload for detected violations
- IoT Core integration for real-time alerts
- Configurable detection parameters

## Requirements

- AWS IoT Greengrass Core v2
- Python 3.8+
- Camera device
- AWS credentials configured

## Installation

1. Build the component:
```bash
gdk component build
```

2. Publish to AWS:
```bash
gdk component publish
```

3. Deploy to your Greengrass device through AWS IoT Console

## Configuration

Configure the following parameters in your deployment:

- `BUCKET_NAME`: S3 bucket for storing detected images
- `IOT_ENDPOINT`: Your AWS IoT endpoint
- `DETECT_COUNT`: Number of detections before triggering alert
- `DETECT_INTERVAL`: Detection interval in seconds

## Usage

The component automatically starts when deployed and begins monitoring the camera feed for safety violations.

## License

This project is licensed under the MIT License.
