✈️ Flight Tail Optimizer

Real-time aircraft tail assignment, rotation planning and operational decision system.
Built with FastAPI + Python ML models.

📌 Overview

Flight Tail Optimizer is a backend-driven aviation decision support system that assists airline operations teams with:

Tail assignment

Delay risk prediction (XGBoost model)

Maintenance risk scoring

Rotation planning

Tail swap optimization

The system is designed to work with real flight data via OpenSky Network API and includes modular ML models under a clean FastAPI architecture.

🧩 Project Structure
backend/
   ├── src/
   │     ├── main.py                  # FastAPI entrypoint
   │     ├── models/
   │     │     ├── delay_risk_model.py
   │     │     ├── maintenance_model.py
   │     │     ├── rotation_engine.py
   │     │     └── tail_swap_optimizer.py
   │     └── ...
   ├── requirements.txt
   └── data/
         └── delay_training_data.csv


✔ FastAPI backend
✔ Machine Learning models
✔ Docker support
✔ Ready for integration with React/Streamlit UI

🚀 Running the Backend (Local Development)
1) Create virtual environment
python -m venv venv
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows

2) Install dependencies
pip install -r backend/requirements.txt

3) Start the backend
uvicorn backend.src.main:app --reload --port 8000


Backend opens at:
➡️ http://localhost:8000

Interactive API docs:
➡️ http://localhost:8000/docs

🛰 Real-Time Data (OpenSky Integration)

The system is designed to integrate with:

OpenSky REST API
✓ Live ADS-B flight positions
✓ Aircraft state vectors
✓ Tail number inference
✓ Operational monitoring

Planned endpoints:

/live/fleet
/live/positions
/ops/rotation
/ops/tail-swap

🧠 Machine Learning Models
Model	Purpose	Status
DelayRiskModel	Predict probability of delay from schedule features	✔ Ready
MaintenanceModel	Estimate maintenance-related operational risk	✔ Ready
RotationEngine	Build optimal daily rotations	✔ Prototype
TailSwapOptimizer	Optimize tail swaps under disruptions	✔ Prototype
🐳 Docker (Optional)

Build & run:

docker-compose up --build


Backend starts on port 8000 inside the container.

📌 Roadmap

 React/Streamlit frontend

 OpenSky real-time ingest pipeline

 Tail swap solver (MILP + heuristics)

 Fleet dashboard

 Delay model v2 (Gradient Boosting)

🧑‍💻 Author

Gizem Göçük
