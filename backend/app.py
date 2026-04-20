"""
Flask REST API - Sales Forecasting & Demand Prediction System
SAP Analytics Cloud Integration Layer
Author: Rohan Kumar Thakur | Roll: 2330332 | Batch: 2023-2027
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model import SalesForecastingModel
from data_generator import generate_sales_data

app = Flask(__name__)
CORS(app)  # Enable CORS for SAC frontend calls

# Global model instance
forecast_model = SalesForecastingModel()
model_trained = False

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/sales_data.csv")


def initialize_model():
    """Initialize and train the forecasting model on startup."""
    global model_trained

    # Generate data if not exists
    if not os.path.exists(DATA_PATH):
        print("📦 Generating sales data...")
        generate_sales_data(save_path=DATA_PATH)

    # Load and train
    forecast_model.load_data(DATA_PATH)
    forecast_model.train_all()
    model_trained = True
    print("✅ Model initialized and ready!")


# ──────────────────────────────────────────────
# ROUTES
# ──────────────────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "project": "Sales Forecasting & Demand Prediction System",
        "tech_stack": "SAP Analytics Cloud + Python + Flask",
        "author": "Rohan Kumar Thakur",
        "roll_number": "2330332",
        "batch": "2023-2027",
        "status": "running",
        "endpoints": [
            "GET  /api/health",
            "GET  /api/kpis",
            "GET  /api/products",
            "GET  /api/regions",
            "GET  /api/monthly-trend",
            "GET  /api/forecast/<product>",
            "GET  /api/top-products",
            "GET  /api/metrics"
        ]
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model_trained": model_trained,
        "data_loaded": forecast_model.data is not None
    })


@app.route("/api/kpis", methods=["GET"])
def get_kpis():
    """Return high-level KPI summary for dashboard."""
    if not model_trained:
        return jsonify({"error": "Model not trained yet"}), 503
    try:
        kpis = forecast_model.get_kpi_summary()
        return jsonify({"success": True, "data": kpis})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/products", methods=["GET"])
def get_products():
    """Return list of all product categories."""
    if not model_trained:
        return jsonify({"error": "Model not trained yet"}), 503
    products = forecast_model.data["product_category"].unique().tolist()
    return jsonify({"success": True, "data": products})


@app.route("/api/regions", methods=["GET"])
def get_regions():
    """Return regional revenue summary."""
    if not model_trained:
        return jsonify({"error": "Model not trained yet"}), 503
    try:
        regions = forecast_model.get_regional_summary()
        return jsonify({"success": True, "data": regions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/monthly-trend", methods=["GET"])
def get_monthly_trend():
    """Return monthly sales trend."""
    if not model_trained:
        return jsonify({"error": "Model not trained yet"}), 503
    product = request.args.get("product", None)
    try:
        trend = forecast_model.get_monthly_trend(product=product)
        return jsonify({"success": True, "data": trend, "product": product or "All"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/forecast/<product>", methods=["GET"])
def get_forecast(product):
    """
    Forecast future demand for a product.
    Query params:
        weeks  (int, default=12): number of weeks to forecast
        region (str, optional): filter by region
    """
    if not model_trained:
        return jsonify({"error": "Model not trained yet"}), 503

    weeks = int(request.args.get("weeks", 12))
    region = request.args.get("region", None)

    # Normalize product name
    product = product.replace("-", "_").replace("%20", "_")

    valid_products = forecast_model.data["product_category"].unique().tolist()
    if product not in valid_products:
        return jsonify({
            "error": f"Product '{product}' not found",
            "valid_products": valid_products
        }), 404

    try:
        forecast = forecast_model.forecast(product=product, steps=weeks, region=region)
        return jsonify({"success": True, "data": forecast})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/top-products", methods=["GET"])
def get_top_products():
    """Return top N products by revenue."""
    if not model_trained:
        return jsonify({"error": "Model not trained yet"}), 503
    n = int(request.args.get("n", 5))
    try:
        top = forecast_model.get_top_products(top_n=n)
        return jsonify({"success": True, "data": top})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    """Return model accuracy metrics."""
    if not model_trained:
        return jsonify({"error": "Model not trained yet"}), 503
    return jsonify({"success": True, "data": forecast_model.metrics})


@app.route("/api/weekly-data", methods=["GET"])
def get_weekly_data():
    """Return weekly aggregated sales data."""
    if not model_trained:
        return jsonify({"error": "Model not trained yet"}), 503

    product = request.args.get("product", None)
    region = request.args.get("region", None)

    df = forecast_model.data.copy()
    if product:
        df = df[df["product_category"] == product]
    if region:
        df = df[df["region"] == region]

    weekly = (
        df.groupby("date")[["revenue", "units_sold"]]
        .sum()
        .reset_index()
        .sort_values("date")
        .tail(52)  # Last 52 weeks
    )

    return jsonify({
        "success": True,
        "data": {
            "dates": weekly["date"].astype(str).tolist(),
            "revenue": [round(float(v), 2) for v in weekly["revenue"].tolist()],
            "units": weekly["units_sold"].tolist()
        }
    })


# ──────────────────────────────────────────────
# STARTUP
# ──────────────────────────────────────────────

if __name__ == "__main__":
    print("🚀 Starting Sales Forecasting API...")
    initialize_model()
    print("🌐 Server running at http://localhost:5000\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
