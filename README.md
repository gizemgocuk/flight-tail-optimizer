# ✈️ Flight Tail Optimizer

Flight Tail Optimizer is an engineering prototype for an airline operations decision system.  
The focus of the current version is building a clean, modular **backend architecture** with  
core logic for delay risk, maintenance scoring, rotation planning, and tail assignment models  
using **Python + FastAPI**.

Bu repo, ileri aşamalarda gerçek uçuş verileri ve operasyonel süreçlerle entegre edilebilecek  
tam ölçekli bir sistemin temelini oluşturmaktadır.

---

## ⭐ Current Scope (Backend Prototype)

- Modular FastAPI structure  
- Delay Risk Model (XGBoost)  
- Maintenance Risk Model  
- Rotation Engine (prototype logic)  
- Tail Swap Optimizer (prototype logic)  
- Base project layout for future UI, database, and live data integrations  
- Docker-ready backend structure

Mevcut sürüm, uçuş operasyonları için karar destek sisteminin **temel bileşenlerini** içerir ve  
buna veri tabanı, gerçek zamanlı veri kaynakları ve kullanıcı arayüzü sonradan eklenmek üzere  
tasarlanmıştır.

---

## 🧩 Project Structure

backend/
│── src/
│ │── main.py # FastAPI entrypoint
│ │── models/
│ │ ├── delay_risk_model.py
│ │ ├── maintenance_model.py
│ │ ├── rotation_engine.py
│ │ └── tail_swap_optimizer.py
│ └── ...
│── requirements.txt
└── data/
└── delay_training_data.csv



---

## 🚀 Running the Backend Locally

### 1) Virtual Environment

**Windows**
```bash
python -m venv venv
venv\Scripts\activate

python3 -m venv venv
source venv/bin/activate

pip install -r backend/requirements.txt

uvicorn backend.src.main:app --reload --port 8000


API Docs →
http://localhost:8000/docs

📌 Designed For Future Expansion

Bu altyapı, ileri aşamalarda entegre edilebilecek şekilde tasarlandı:

Flight schedule database

Live data sources (ADS-B / airline ops feeds)

Frontend dashboard (React / Streamlit)

Disruption management modules

Optimization improvements (MILP, heuristics)

🛫 Roadmap

 Database schema and storage layer

 Fleet & schedule ingestion module

 Frontend dashboard

 Extended tail swap solver

 Enhanced rotation planner

 Monitoring & alerting

👩‍💻 Author

Gizem Göçük
