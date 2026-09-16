# AQUORA Frontend

React + TypeScript single-page app for the AQUORA water-quality platform. Includes a cinematic 3D "Water Core" visualization, live sensor dashboard, dataset explorer, model training UI, predictions, and reports.

## Prerequisites

- Node.js 18+
- Backend running at **http://localhost:8000** (see `../backend/README.md`)

## Setup

```bash
cd frontend
npm install
npm run dev
```

App URL: **http://localhost:5173**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |

## Project Structure

```text
frontend/
├── src/
│   ├── App.tsx                 # Routes and layout shell
│   ├── pages/
│   │   ├── Home.tsx            # Landing page with 3D Water Core
│   │   ├── Dashboard.tsx       # Live stats + WebSocket sensor feed
│   │   ├── Dataset.tsx         # Dataset summary and charts
│   │   ├── Models.tsx          # Train models & view experiments
│   │   ├── Predictions.tsx     # Manual prediction form
│   │   └── Reports.tsx         # Project report and figures
│   ├── components/
│   │   ├── layout/Navbar.tsx
│   │   └── common/ErrorBoundary.tsx
│   └── components3d/
│       └── WaterCore.tsx       # React Three Fiber scene
├── public/
│   └── figures/                # Static analysis charts
└── package.json
```

## Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/dashboard` | Live dashboard & sensor simulator |
| `/dataset` | Dataset analysis |
| `/models` | Model training & experiments |
| `/predictions` | Water-quality predictions |
| `/reports` | Reports & visualizations |

## Backend Integration

The frontend calls the FastAPI backend at `http://localhost:8000`:

- REST: `/api/dashboard/summary`, `/api/datasets/summary`, `/api/models/train`, `/api/experiments/all`, `/api/predict`
- WebSocket: `ws://localhost:8000/ws/sensors` (Dashboard live feed)

Start the backend before using Dashboard, Dataset, Models, or Predictions pages.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — dev server and bundler
- **Tailwind CSS** — styling
- **React Router** — client-side routing
- **React Three Fiber** + **Three.js** — 3D Water Core visualization
- **Recharts** — data charts
- **Framer Motion** + **GSAP** — animations

## Production Build

```bash
npm run build
```

Output is written to `dist/`. Serve with any static file host or `npm run preview`.
