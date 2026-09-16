# AQUORA

AQUORA is a futuristic water-quality intelligence and monitoring platform. It is designed to analyze water-quality data, handle missing sensor values, train machine-learning models, predict water-quality classes, and simulate real-time sensors.

> **Disclaimer:** This is an AI analytical system, NOT a certified drinking-water safety device. Predictions should not be treated as a substitute for laboratory testing, professional water-quality assessment, or regulatory certification.

## Features
- **Dataset Analysis & Synthetic Generation:** Analyzes CSV datasets (e.g., pH, Turbidity) for data quality and target class balance.
- **ML Pipeline & Missing Data Lab:** Implements baseline Decision Tree and multiple imputation strategies (Median, KNN, Deletion) on simulated missingness (10%, 20%, 30%).
- **Automated Recommendation Engine:** Dynamically recommends the best missing-data strategy prioritizing unsafe-class recall.
- **Real-time Sensor Simulator:** Fast API WebSocket endpoint streaming simulated pH, TDS, DO, Temperature, and Turbidity data.
- **Cinematic 3D Frontend:** React + Vite + Three.js application featuring a dynamic "Water Core" visualization.

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Three Fiber, React Router
- **Backend:** Python 3.11, FastAPI, SQLite, Scikit-learn, Pandas, Joblib

## Installation & Setup

For detailed setup in each part of the stack, see:

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

### 1. Dataset Generation
The dataset must exist at `data/dataset.csv`. A script is provided to generate a realistic synthetic dataset.
```bash
cd data
python generate_dataset.py
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The backend API runs at http://localhost:8000

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend UI runs at http://localhost:5173

## Architecture

### Machine Learning Methodology
- **Baseline:** Decision Tree Classifier with GridSearchCV hyperparameter tuning.
- **Validation:** Stratified train-test split (80/20) to prevent data leakage, ensuring `random_state=42` for reproducibility.
- **Missing Data Strategy:** Tests SimpleImputer (median), KNNImputer, and listwise deletion to analyze prediction stability and data retention.
- **Metrics:** F1 Score, Precision, Recall, Accuracy, and Confusion Matrices.

### Future IoT Architecture
```text
ESP32 -> Physical Sensors (pH, TDS, DO) -> MQTT Broker -> Python Backend -> ML Pipeline -> WebSocket -> React UI
```
*Currently, the system implements a Virtual Sensor Simulator to mock the hardware layer.*
