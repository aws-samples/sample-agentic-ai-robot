# Dataset Setup Guide

## Dataset Extraction and Training Execution Guide

### 1. Extract Dataset

Before using the compressed dataset, extract it with the following commands:

```bash
# Navigate to ml-training-safetydetection directory
cd ml-training-safetydetection

# Extract dataset
unzip dataset_balanced.zip

# Verify extraction
ls -la dataset_balanced/
```

### 2. Run Training Script

After extracting the dataset, start training with the following commands:

```bash
# Install Python dependencies (if needed)
pip install ultralytics opencv-python pillow

# Run training
python complete_training.py
```

### 3. File Structure

After extraction, the following structure will be created:

```
ml-training-safetydetection/
├── dataset_balanced.zip          # Compressed dataset
├── dataset_balanced/             # Extracted dataset
│   ├── train/
│   │   ├── images/              # Training images
│   │   └── labels/              # Training labels
│   ├── val/
│   │   ├── images/              # Validation images
│   │   └── labels/              # Validation labels
│   └── dataset.yaml             # Dataset configuration file
├── complete_training.py          # Training script
├── classes.txt                   # Class definitions
└── README.md                     # Detailed documentation
```

### 4. Important Notes

- Ensure sufficient disk space before extraction
- Check GPU memory and system resources before starting training
- System resource usage may be high during training

### 5. Troubleshooting

If issues occur during extraction or training:

1. Check archive integrity: `unzip -t dataset_balanced.zip`
2. Check disk space: `df -h`
3. Verify Python package installation: `pip list | grep ultralytics`

For more details, refer to the README.md file.
