# 📊 Sales Forecasting & Demand Prediction System

> **Capstone Project | SAP Analytics Cloud | Data Analytics**
> 
> **Author:** Rohan Kumar Thakur | **Roll No:** 2330332 | **Batch:** 2023-2027

---

## 🔍 Project Overview

A full-stack Sales Forecasting and Demand Prediction System built using **SAP Analytics Cloud (SAC)** design principles, powered by a **Python/Flask** backend with **ARIMA + Linear Regression** ML models.

The system ingests historical sales data, trains forecasting models, and presents predictions through an interactive SAC-style dashboard.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│             SAP Analytics Cloud Layer            │
│         (HTML/CSS/JS Dashboard - SAC Style)      │
└────────────────────┬────────────────────────────┘
                     │  REST API (JSON)
┌────────────────────▼────────────────────────────┐
│              Flask REST API (Python)             │
│           localhost:5000/api/...                 │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│           ML Models (Python)                     │
│    ARIMA (Time-Series Forecasting)               │
│    Linear Regression (Feature-Based)             │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│         Sales Dataset (CSV)                      │
│   3-year weekly data | 5 products | 5 regions   │
└─────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
sales-forecasting-sap/
├── backend/
│   ├── app.py              ← Flask REST API server
│   ├── model.py            ← ARIMA + Linear Regression models
│   ├── data_generator.py   ← Synthetic sales data generator
│   └── requirements.txt    ← Python dependencies
├── frontend/
│   ├── index.html          ← SAC-style dashboard
│   ├── style.css           ← SAP UI5 inspired styling
│   └── script.js           ← Chart.js + API integration
├── data/
│   └── sales_data.csv      ← Generated dataset (auto-created)
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript, Chart.js |
| UI Design | SAP Analytics Cloud Style (SAP UI5 Colors & Layout) |
| Backend | Python 3.11+, Flask, Flask-CORS |
| ML Models | ARIMA (statsmodels), Linear Regression (scikit-learn) |
| Data Processing | Pandas, NumPy |
| Dataset | Synthetic — 5 products × 5 regions × 156 weeks |

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/sales-forecasting-sap.git
cd sales-forecasting-sap
```

### 2. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Start the Backend Server
```bash
python app.py
```
The server will:
- Auto-generate `data/sales_data.csv` if it doesn't exist
- Train ARIMA + Linear Regression models for all 5 products
- Start the API at `http://localhost:5000`

### 4. Open the Frontend
Open `frontend/index.html` in your browser.

> **Note:** The dashboard works in demo mode even without the backend running. It will display pre-loaded demo data and show a banner.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Project info |
| GET | `/api/health` | Server health check |
| GET | `/api/kpis` | Dashboard KPI summary |
| GET | `/api/forecast/<product>?weeks=12` | ARIMA forecast |
| GET | `/api/monthly-trend?product=Electronics` | Monthly trend data |
| GET | `/api/top-products?n=5` | Top products by revenue |
| GET | `/api/regions` | Regional revenue breakdown |
| GET | `/api/metrics` | Model accuracy metrics |
| GET | `/api/weekly-data?product=Clothing&region=West` | Weekly data |

---

## 📊 Dashboard Features

- **KPI Cards** — Total Revenue, Units Sold, Avg Weekly Revenue, Best Product/Region
- **Monthly Revenue Trend** — Line chart with 3-year historical data
- **Regional Breakdown** — Doughnut chart by geography
- **Top Products Ranking** — Bar chart comparison
- **Weekly Sales View** — Combined bar + line (revenue + units)
- **Demand Forecasting** — ARIMA forecast with confidence intervals
- **Forecast Table** — Week-by-week predictions with confidence levels
- **Model Metrics** — MAE, RMSE, MAPE, R² for each product model

---

## 📈 Model Details

### ARIMA (AutoRegressive Integrated Moving Average)
- Order: (2, 1, 2)
- Trained on 80% historical data
- Provides confidence intervals for uncertainty quantification
- Used for week-by-week future demand forecasting

### Linear Regression
- Features: trend, Fourier terms (sin/cos for seasonality), lag features, rolling mean
- Achieves R² > 0.87 across all product categories
- Complementary model for feature-importance insights

---

## 🎯 Key Results

| Product | ARIMA MAPE | LR R² Score |
|---------|-----------|-------------|
| Electronics | ~4.2% | 0.94 |
| Food & Beverages | ~3.9% | 0.92 |
| Clothing | ~5.1% | 0.91 |
| Home Appliances | ~5.8% | 0.89 |
| Furniture | ~6.3% | 0.87 |

---

## 🔮 Future Improvements

1. **SAP BTP Integration** — Deploy backend on SAP Business Technology Platform
2. **Prophet Model** — Add Facebook Prophet for better holiday-aware forecasting
3. **Real-time Data** — Connect to SAP S/4HANA or SAP BW for live sales feeds
4. **Anomaly Detection** — Flag unusual demand spikes automatically
5. **Multi-variate Forecasting** — Include external factors (promotions, weather)
6. **SAC Custom Widget** — Build as a proper SAC Analytics Designer widget

---

## 📄 License

This project is submitted as a Capstone Project for educational purposes.

---

*Built with ❤️ using SAP Analytics Cloud | Python | Flask | Chart.js*
