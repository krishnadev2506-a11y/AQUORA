const API_BASE = import.meta.env.VITE_API_URL || 'https://aquora-ml.onrender.com';
const WS_BASE = import.meta.env.VITE_WS_URL || 'wss://aquora-ml.onrender.com';

export const API_ENDPOINTS = {
  summary: API_BASE + '/api/dashboard/summary',
  predict: API_BASE + '/api/predict',
  train: API_BASE + '/api/models/train',
  experiments: API_BASE + '/api/experiments/all',
  datasetSummary: API_BASE + '/api/datasets/summary',
  wsSensors: WS_BASE + '/ws/sensors',
};

export { API_BASE, WS_BASE };
