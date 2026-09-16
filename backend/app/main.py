"""
FastAPI backend for WaterGuard AI.
"""
from __future__ import annotations

import asyncio
import os
import random
from pathlib import Path
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.config import settings
from app.ml.pipeline import get_pipeline

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "dataset.csv"

# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    try:
        pipeline = get_pipeline(str(DATA_PATH))
        pipeline.load_and_validate()
        pipeline.train_baseline()
        print("[OK] Dataset loaded & baseline Decision Tree trained on startup.")
    except Exception as e:
        print(f"[WARN] Startup: {e}")


# ── Dashboard ─────────────────────────────────────────────────────────────────

@app.get("/api/dashboard/summary")
async def get_dashboard_summary():
    try:
        p = get_pipeline(str(DATA_PATH))
        stats = p.load_and_validate()
        good = stats["class_distribution"].get("1", 0)
        poor = stats["class_distribution"].get("0", 0)
        total = good + poor
        quality_pct = round(100 * good / total, 1) if total else 0
        return {
            "samples":       stats["rows"],
            "engineered_rows": stats["engineered_rows"],
            "sensors":       5,
            "missingValues": stats["total_missing"],
            "dataQuality":   f"{quality_pct}%",
            "bestModel":     "Decision Tree",
            "status":        "GOOD QUALITY" if good >= poor else "POOR QUALITY",
            "classDistribution": stats["class_distribution"],
            "targetLabels":  stats["target_labels"],
            "features":      stats["engineered_features"],
            "waterBodyTypes": stats["water_body_types"],
            "states":        stats["states"],
        }
    except Exception as e:
        return {"error": str(e)}


# ── Dataset ───────────────────────────────────────────────────────────────────

@app.get("/api/datasets/summary")
async def get_dataset_summary():
    try:
        p = get_pipeline(str(DATA_PATH))
        return p.load_and_validate()
    except Exception as e:
        return {"error": str(e)}


# ── Models ────────────────────────────────────────────────────────────────────

@app.post("/api/models/train")
async def train_model():
    try:
        p = get_pipeline(str(DATA_PATH))
        p.load_and_validate()
        result = p.train_baseline()
        return {"status": "trained", **result}
    except Exception as e:
        return {"error": str(e)}


# ── Experiments ───────────────────────────────────────────────────────────────

@app.post("/api/experiments/run")
async def run_experiment(missing_rate: float = 0.2):
    try:
        p = get_pipeline(str(DATA_PATH))
        p.load_and_validate()
        return p.simulate_missing_and_evaluate(missing_rate)
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/experiments/all")
async def run_all_experiments():
    """Run experiments for 10%, 20%, 30% missingness."""
    try:
        p = get_pipeline(str(DATA_PATH))
        p.load_and_validate()
        results = {}
        for rate in [0.10, 0.20, 0.30]:
            key = f"{int(rate*100)}pct"
            results[key] = p.simulate_missing_and_evaluate(rate)
        return results
    except Exception as e:
        return {"error": str(e)}


# ── Prediction ────────────────────────────────────────────────────────────────

class PredictionInput(BaseModel):
    features: dict[str, float | None] = Field(
        ...,
        example={
            "Dissolved_Oxygen": 6.0,
            "BOD": 2.5,
            "pH": 7.4,
            "Temperature": 27.0,
            "Conductivity": 350.0,
            "NitrateN": 1.5,
            "Fecal_Coliform": 120.0,
            "Total_Coliform": 450.0,
        }
    )

@app.post("/api/predict")
async def predict(body: PredictionInput):
    try:
        p = get_pipeline(str(DATA_PATH))
        return p.predict_sample(body.features)
    except RuntimeError as e:
        return {"error": str(e), "hint": "Train the model first via POST /api/models/train"}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/features")
async def get_features():
    """Return the feature list so the frontend can build the prediction form dynamically."""
    try:
        p = get_pipeline(str(DATA_PATH))
        p.load_and_validate()
        return {"features": p.features}
    except Exception as e:
        return {"error": str(e)}


# ── WebSocket Sensor Simulator ────────────────────────────────────────────────

@app.websocket("/ws/sensors")
async def websocket_sensors(websocket: WebSocket):
    await websocket.accept()
    sensors = {
        "pH":          7.20,
        "TDS":         438.0,
        "Turbidity":   2.10,
        "Dissolved_O2": 6.50,
        "Temperature": 26.7,
        "BOD":         2.0,
        "Conductivity": 350.0,
    }
    limits = {
        "pH":          (0, 14),
        "TDS":         (100, 2000),
        "Turbidity":   (0, 20),
        "Dissolved_O2": (0, 15),
        "Temperature": (5, 45),
        "BOD":         (0, 50),
        "Conductivity": (50, 3000),
    }
    try:
        while True:
            for key in sensors:
                delta = random.uniform(-0.05, 0.05) * (limits[key][1] - limits[key][0]) * 0.02
                sensors[key] = round(
                    max(limits[key][0], min(limits[key][1], sensors[key] + delta)), 3
                )
            await websocket.send_json({
                "sensors": sensors,
                "source": "SIMULATED",
                "status": {k: "ONLINE" for k in sensors},
                "health": {k: round(random.uniform(92, 99), 1) for k in sensors},
            })
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "AQUORA AI API", "version": "1.0.0", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "ok"}
