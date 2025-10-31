# ML Training - Safety Detection

Industrial safety detection model training using YOLOv8 and ONNX for real-time hazard detection in industrial environments.

## 🎯 Overview

This project provides a complete machine learning pipeline for training safety detection models that can identify:
- **Smoke** - Early fire detection through smoke recognition
- **Fire** - Direct flame and fire detection
- **Person Down** - Detection of fallen or injured personnel

The trained models are optimized for deployment on edge devices using ONNX format for real-time inference.

## 📁 Project Structure

```
ml-training-safetydetection/
├── complete_training.py          # Main training script
├── onnx_inference_final.py       # ONNX inference and testing
├── classes.txt                   # Class definitions
├── README.md                     # This file
├── README.md.ko                  # Korean documentation
├── MODEL_USAGE_GUIDE.md          # Detailed model usage guide
├── onnx_optimization_guide.md    # ONNX optimization tips
├── industrial_safety_final.pt    # Pre-trained PyTorch model (6MB)
├── yolov8n.pt                   # YOLOv8 nano base model (6MB)
└── dataset_balanced/            # Training dataset
    ├── dataset.yaml             # Dataset configuration
    ├── train/
    │   ├── images/              # Training images
    │   └── labels/              # Training labels (YOLO format)
    └── val/
        ├── images/              # Validation images
        └── labels/              # Validation labels (YOLO format)
```

## 🚀 Quick Start

### Prerequisites

```bash
pip install ultralytics opencv-python onnxruntime numpy boto3 sagemaker
```

### Training Options

#### Option 1: Local Training

```bash
python complete_training.py
```

#### Option 2: AWS SageMaker Training

For large-scale training with GPU acceleration:

**1. Prepare SageMaker Training Script**

Create `sagemaker_train.py`:
```python
import sagemaker
from sagemaker.pytorch import PyTorch
from sagemaker import get_execution_role

# SageMaker session and role
sagemaker_session = sagemaker.Session()
role = get_execution_role()

# Upload dataset to S3
dataset_s3_path = sagemaker_session.upload_data(
    path='./dataset_balanced',
    bucket='your-sagemaker-bucket',
    key_prefix='safety-detection/dataset'
)

# Define PyTorch estimator
estimator = PyTorch(
    entry_point='complete_training.py',
    source_dir='.',
    role=role,
    instance_type='ml.g4dn.xlarge',  # GPU instance
    instance_count=1,
    framework_version='2.0.0',
    py_version='py310',
    hyperparameters={
        'epochs': 100,
        'batch-size': 32,
        'learning-rate': 0.001
    }
)

# Start training
estimator.fit({'training': dataset_s3_path})
```

**2. Run SageMaker Training**
```bash
python sagemaker_train.py
```

**3. Deploy Model Endpoint**
```python
# Deploy trained model
predictor = estimator.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.large'
)

# Make predictions
result = predictor.predict(image_data)
```

### 2. Test ONNX Model

```bash
python onnx_inference_final.py
```

This script will:
- Load the ONNX model (`best.onnx`)
- Test inference speed
- Validate detection accuracy
- Generate sample detection results

## 📊 Model Classes

| Class ID | Name | Description |
|----------|------|-------------|
| 0 | smoke | Smoke detection for early fire warning |
| 1 | fire | Direct flame and fire detection |
| 2 | person_down | Fallen or injured person detection |

## 🔧 Training Details

### Local Training Configuration
- Base Model: YOLOv8 nano
- Image Size: 640x640
- Batch Size: 16
- Epochs: 50
- Device: MPS (Apple Silicon) or CPU
- Validation: Disabled for faster training

### SageMaker Training Configuration
- Instance Type: ml.g4dn.xlarge (GPU)
- Base Model: YOLOv8 nano
- Image Size: 640x640
- Batch Size: 32 (larger due to GPU)
- Epochs: 100 (more epochs for better accuracy)
- Framework: PyTorch 2.0.0
- Python: 3.10

### Training Output
- `runs/detect/safety_complete/weights/best.pt` - Best PyTorch model
- `best.onnx` - Exported ONNX model
- SageMaker: Model artifacts stored in S3

### Dataset Format
- **Images**: JPG/PNG format, recommended 640x640 resolution
- **Labels**: YOLO format (.txt files)
  ```
  class_id x_center y_center width height
  ```
  All coordinates normalized to 0-1 range

### Model Architecture
- **Base**: YOLOv8 nano (lightweight for edge deployment)
- **Input Size**: 640x640x3
- **Output**: Bounding boxes with class probabilities
- **Inference Speed**: ~10-20ms on modern hardware

### Training Parameters
```python
epochs=50           # Training iterations
imgsz=640          # Input image size
batch=16           # Batch size
device='mps'       # Apple Silicon GPU
val=False          # Skip validation for speed
```

## 📈 Performance Metrics

### Model Size
- **PyTorch (.pt)**: ~6MB
- **ONNX (.onnx)**: ~12MB
- **Inference Speed**: 10-50ms depending on hardware

### Accuracy (Estimated)
- **Smoke Detection**: 85-90% mAP@0.5
- **Fire Detection**: 90-95% mAP@0.5
- **Person Down**: 80-85% mAP@0.5

## 🔄 Model Export Workflow

1. **Training**: PyTorch model training with YOLOv8
2. **Export**: Convert to ONNX format for deployment
3. **Optimization**: ONNX model optimization for inference
4. **Deployment**: Deploy to edge devices or cloud

## 📝 Usage Examples

### Training Custom Dataset
```python
from ultralytics import YOLO

# Load base model
model = YOLO('yolov8n.pt')

# Train on custom dataset
results = model.train(
    data='./dataset_balanced/dataset.yaml',
    epochs=50,
    imgsz=640,
    batch=16
)

# Export to ONNX
model.export(format='onnx')
```

### ONNX Inference
```python
import onnxruntime as ort
import cv2
import numpy as np

# Load ONNX model
session = ort.InferenceSession('best.onnx')

# Prepare image
image = cv2.imread('test_image.jpg')
image = cv2.resize(image, (640, 640))
image = image.astype(np.float32) / 255.0
image = np.transpose(image, (2, 0, 1))
image = np.expand_dims(image, axis=0)

# Run inference
outputs = session.run(None, {'images': image})
```

## 🛠️ Customization

### SageMaker Training Customization

**Hyperparameter Tuning:**
```python
from sagemaker.tuner import HyperparameterTuner, IntegerParameter, ContinuousParameter

# Define hyperparameter ranges
hyperparameter_ranges = {
    'learning-rate': ContinuousParameter(0.0001, 0.01),
    'batch-size': IntegerParameter(16, 64),
    'epochs': IntegerParameter(50, 200)
}

# Create tuner
tuner = HyperparameterTuner(
    estimator,
    objective_metric_name='validation:mAP',
    hyperparameter_ranges=hyperparameter_ranges,
    max_jobs=10,
    max_parallel_jobs=2
)

# Start tuning
tuner.fit({'training': dataset_s3_path})
```

**Multi-GPU Training:**
```python
estimator = PyTorch(
    entry_point='complete_training.py',
    instance_type='ml.p3.8xlarge',  # Multi-GPU instance
    instance_count=1,
    distribution={'parameter_server': {'enabled': True}}
)
```

**Spot Instance Training (Cost Optimization):**
```python
estimator = PyTorch(
    entry_point='complete_training.py',
    use_spot_instances=True,
    max_wait=7200,  # 2 hours
    max_run=3600,   # 1 hour
    checkpoint_s3_uri='s3://your-bucket/checkpoints/'
)
```

### Adding New Classes
1. Update `classes.txt` with new class names
2. Modify `dataset.yaml` to include new classes
3. Prepare training data with new class labels
4. Retrain the model

### Adjusting Training Parameters
Edit `complete_training.py`:
```python
# Increase epochs for better accuracy
epochs=100

# Adjust batch size based on GPU memory
batch=8  # Smaller for limited memory

# Enable validation
val=True
```

## 🔍 Troubleshooting

### Local Training Issues

**Out of Memory Error:**
- Reduce batch size: `batch=8` or `batch=4`
- Use smaller image size: `imgsz=416`

**Low Detection Accuracy:**
- Increase training epochs: `epochs=100`
- Add more training data
- Enable data augmentation

**Slow Inference:**
- Use GPU acceleration
- Optimize ONNX model
- Reduce input image size

### SageMaker Training Issues

**Training Job Fails:**
```bash
# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /aws/sagemaker/TrainingJobs

# View specific training job logs
aws logs get-log-events --log-group-name /aws/sagemaker/TrainingJobs/your-job-name
```

**High Training Costs:**
- Use Spot Instances (up to 90% cost reduction)
- Choose appropriate instance types
- Enable early stopping
- Use smaller datasets for experimentation

**Data Access Issues:**
```python
# Ensure proper S3 permissions
import boto3
s3 = boto3.client('s3')
s3.head_object(Bucket='your-bucket', Key='dataset/train/images/image1.jpg')
```

**Model Deployment Fails:**
- Check endpoint configuration
- Verify model artifacts in S3
- Review IAM permissions

## 📚 Additional Resources

- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [ONNX Runtime Documentation](https://onnxruntime.ai/docs/)
- [AWS SageMaker Documentation](https://docs.aws.amazon.com/sagemaker/)
- [SageMaker Python SDK](https://sagemaker.readthedocs.io/)
- [MODEL_USAGE_GUIDE.md](./MODEL_USAGE_GUIDE.md) - Detailed usage instructions
- [onnx_optimization_guide.md](./onnx_optimization_guide.md) - Performance optimization

### SageMaker Resources
- [SageMaker Training Best Practices](https://docs.aws.amazon.com/sagemaker/latest/dg/training-best-practices.html)
- [SageMaker Pricing](https://aws.amazon.com/sagemaker/pricing/)
- [SageMaker Instance Types](https://docs.aws.amazon.com/sagemaker/latest/dg/notebooks-available-instance-types.html)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Submit a pull request

## 📞 Support

For questions and support, please refer to the documentation or create an issue in the repository.
