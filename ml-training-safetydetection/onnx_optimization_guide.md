# ONNX Model Performance Optimization Guide

## 1. Model Re-export (Most Important)
```python
from ultralytics import YOLO

model = YOLO('runs/detect/train_augmented/weights/best.pt')

# Better ONNX export settings
model.export(
    format='onnx',
    imgsz=640,
    optimize=True,        # Enable optimization
    simplify=True,        # Model simplification
    opset=12,            # Specify ONNX opset version
    dynamic=False,       # Disable dynamic size
    half=False           # Disable FP16 (prioritize accuracy)
)
```

## 2. ONNX Runtime Optimization
```python
import onnxruntime as ort

# Optimized session options
session_options = ort.SessionOptions()
session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
session_options.intra_op_num_threads = 0  # Use all CPU cores
session_options.inter_op_num_threads = 0

# Execution provider priority
providers = [
    'CoreMLExecutionProvider',  # Apple Silicon optimization
    'CPUExecutionProvider'
]

session = ort.InferenceSession(model_path, 
                              sess_options=session_options, 
                              providers=providers)
```

## 3. Preprocessing Optimization
```python
def optimized_preprocess(img_path):
    img = cv2.imread(img_path)
    
    # Efficient resize
    img = cv2.resize(img, (640, 640), interpolation=cv2.INTER_LINEAR)
    
    # BGR to RGB conversion
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Normalization (process at once)
    img = img.astype(np.float32) / 255.0
    
    # Dimension transformation
    img = np.transpose(img, (2, 0, 1))
    img = np.expand_dims(img, axis=0)
    
    return img
```

## 4. Postprocessing Optimization
```python
def optimized_postprocess(outputs, conf_threshold=0.5):
    predictions = outputs[0][0]  # (7, 8400)
    
    # Use vectorized operations
    conf_mask = predictions[4, :] > conf_threshold
    
    if not np.any(conf_mask):
        return []
    
    # Process only filtered predictions
    filtered_preds = predictions[:, conf_mask]
    
    # Batch processing for coordinate transformation
    boxes = filtered_preds[:4, :].T
    confidences = filtered_preds[4, :]
    class_scores = filtered_preds[5:, :].T
    
    return process_detections(boxes, confidences, class_scores)
```

## 5. Model Quantization (Optional)
```python
# INT8 quantization for speed improvement (slight accuracy decrease)
model.export(
    format='onnx',
    imgsz=640,
    int8=True,  # INT8 quantization
    data='dataset_balanced/complete.yaml'  # Calibration data
)
```

## 6. Alternative: Using TensorRT (NVIDIA GPU)
```python
# Export to TensorRT (NVIDIA GPU environment)
model.export(format='engine', imgsz=640)
```

## 7. Performance Comparison Test
```python
import time

def benchmark_model(model_func, img_path, iterations=100):
    times = []
    for _ in range(iterations):
        start = time.time()
        results = model_func(img_path)
        times.append(time.time() - start)
    
    return {
        'avg_time': np.mean(times),
        'std_time': np.std(times),
        'fps': 1.0 / np.mean(times)
    }
```

## Recommended Order
1. **Model re-export** (optimize=True, simplify=True)
2. **ONNX Runtime optimization settings**
3. **Preprocessing/postprocessing optimization**
4. **Apply quantization if needed**
5. **Performance benchmark and comparison**
