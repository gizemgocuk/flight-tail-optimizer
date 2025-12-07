# Senior Tail Optimizer

A full-stack decision support system for airline flight operations.

## 🏗 Project Structure

- **frontend/**: React + Vite application (Currently running in this preview)
- **backend/**: Python + FastAPI + Machine Learning Models (Reference implementation)
- **dashboard/**: Streamlit Operations Dashboard (Reference implementation)

## 🚀 Running the Frontend (Web Preview)

In this environment, the **Frontend** is configured to run in "Standalone Mode". 
The complex backend logic (XGBoost models, Rotation Engine) has been simulated in `services/optimizerEngine.ts` to allow you to test the functionality immediately without a Python environment.

## 🐍 Running the Full Stack (Local Development)

To run the complete system with the actual Python backend and Streamlit dashboard:

1. **Install Docker** on your machine.
2. **Clone** this repository.
3. Run the stack:
   ```bash
   docker-compose up --build
   ```

### Services Ports
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8000/docs
- **Streamlit Dashboard**: http://localhost:8501

## 🧠 Models Included

1. **Delay Risk Model**: XGBoost implementation to predict delay probability based on weather and schedule.
2. **Maintenance Risk**: Heuristic model based on aircraft age, cycles, and snag list.
3. **Rotation Engine**: Validates connection times (MCT) and geographic continuity.
4. **Tail Swap Optimizer**: Suggests aircraft swaps to minimize operational risk.
