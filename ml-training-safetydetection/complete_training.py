#!/usr/bin/env python3

import os
import yaml
from ultralytics import YOLO

dataset_dir = "./dataset_balanced"

yaml_config = {
    'path': dataset_dir,
    'train': 'train/images',
    'val': 'val/images',
    'names': {0: 'smoke', 1: 'fire', 2: 'person_down'}
}

yaml_path = os.path.join(dataset_dir, 'complete.yaml')
with open(yaml_path, 'w') as f:
    yaml.dump(yaml_config, f)

print("Starting complete model training...")

model = YOLO('yolov8n.pt')
results = model.train(
    data=yaml_path,
    epochs=50,
    imgsz=640,
    batch=16,
    name='safety_complete',
    exist_ok=True,
    device='mps',
    val=False,  # Disable validation for faster training
    save=True
)

# Export to ONNX
best_model = YOLO(f"{results.save_dir}/weights/best.pt")
onnx_path = best_model.export(format='onnx', imgsz=640)

# Copy final model
import shutil
final_target = "./best.onnx"
shutil.copy2(onnx_path, final_target)

print(f"✅ Final model completed: {final_target}")
print("🔥 Safety detection model has been successfully trained!")
