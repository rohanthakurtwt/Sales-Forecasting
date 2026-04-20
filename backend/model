"""
Sales Forecasting ML Model
Uses ARIMA + Linear Regression for demand prediction.
Project: Sales Forecasting & Demand Prediction System
Author: Rohan Kumar Thakur | Roll: 2330332 | Batch: 2023-2027
"""

import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import warnings
import json
import os

warnings.filterwarnings("ignore")


class SalesForecastingModel:
    """
    Sales Forecasting Model combining ARIMA (time-series) and
    Linear Regression (feature-based) approaches.
    """

    def __init__(self):
        self.arima_models = {}        # product -> ARIMA model
        self.lr_models = {}           # product -> Linear Regression model
        self.scalers = {}             # product -> scaler
        self.data = None
        self.is_trained = False

    def load_data(self, filepath="data/sales_data.csv"):
        """Load and preprocess the sales dataset."""
        self.data = pd.read_csv(filepath)
        self.data["date"] = pd.to_datetime(self.data["date"])
        self.data = self.data.sort_values("date").reset_index(drop=True)
        print(f"✅ Loaded {len(self.data)} records from {filepath}")
        return self.data

    def _get_product_series(self, product, region=None):
        """Aggregate weekly revenue for a specific product (and optionally region)."""
        mask = self.data["product_category"] == product
        if region:
            mask = mask & (self.data["region"] == region)

        series = (
            self.data[mask]
            .groupby("date")["revenue"]
            .sum()
            .reset_index()
            .sort_values("date")
        )
        return series

    def train_arima(self, product, region=None, order=(2, 1, 2)):
        """Train ARIMA model for a product/region."""
        series = self._get_product_series(product, region)
        revenue_series = series["revenue"].values

        if len(revenue_series) < 20:
            raise ValueError(f"Not enough data for {product} ({len(revenue_series)} points)")

        # Split 80/20 train/test
        split_idx = int(len(revenue_series) * 0.8)
        train = revenue_series[:split_idx]

        model = ARIMA(train, order=order)
        fitted = model.fit()

        key = f"{product}_{region}" if region else product
        self.arima_models[key] = {
            "model": fitted,
            "series": revenue_series,
            "dates": series["date"].values,
            "split_idx": split_idx,
            "product": product,
            "region": region
        }

        # Evaluate on test set
        test = revenue_series[split_idx:]
        forecast = fitted.forecast(steps=len(test))
        mae = mean_absolute_error(test, forecast)
        rmse = np.sqrt(mean_squared_error(test, forecast))
        mape = np.mean(np.abs((test - forecast) / (test + 1e-9))) * 100

        print(f"   ARIMA [{product}] → MAE: ₹{mae:,.0f} | RMSE: ₹{rmse:,.0f} | MAPE: {mape:.1f}%")
        return {"mae": round(mae, 2), "rmse": round(rmse, 2), "mape": round(mape, 2)}

    def train_regression(self, product, region=None):
        """Train linear regression model using engineered features."""
        series = self._get_product_series(product, region)

        # Feature engineering
        df = series.copy()
        df["week_num"] = np.arange(len(df))
        df["month"] = df["date"].dt.month
        df["quarter"] = df["date"].dt.quarter
        df["year"] = df["date"].dt.year
        df["sin_week"] = np.sin(2 * np.pi * df["week_num"] / 52)
        df["cos_week"] = np.cos(2 * np.pi * df["week_num"] / 52)
        df["sin_month"] = np.sin(2 * np.pi * df["month"] / 12)
        df["cos_month"] = np.cos(2 * np.pi * df["month"] / 12)
        df["lag_1"] = df["revenue"].shift(1)
        df["lag_4"] = df["revenue"].shift(4)
        df["rolling_mean_4"] = df["revenue"].rolling(4).mean()
        df = df.dropna()

        features = ["week_num", "sin_week", "cos_week", "sin_month", "cos_month",
                    "lag_1", "lag_4", "rolling_mean_4", "month", "quarter"]

        X = df[features].values
        y = df["revenue"].values

        # Train/test split
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        lr = LinearRegression()
        lr.fit(X_train_scaled, y_train)

        y_pred = lr.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        key = f"{product}_{region}" if region else product
        self.lr_models[key] = {"model": lr, "scaler": scaler, "features": features, "df": df}

        print(f"   LR    [{product}] → MAE: ₹{mae:,.0f} | R²: {r2:.3f}")
        return {"mae": round(mae, 2), "r2": round(r2, 3)}

    def train_all(self):
        """Train models for all products."""
        print("\n🔧 Training models...\n")
        products = self.data["product_category"].unique()
        self.metrics = {}

        for product in products:
            print(f"📦 Product: {product}")
            arima_metrics = self.train_arima(product)
            lr_metrics = self.train_regression(product)
            self.metrics[product] = {
                "arima": arima_metrics,
                "linear_regression": lr_metrics
            }

        self.is_trained = True
        print(f"\n✅ All models trained successfully!")
        return self.metrics

    def forecast(self, product, steps=12, region=None):
        """Forecast future sales using ARIMA model."""
        key = f"{product}_{region}" if region else product

        if key not in self.arima_models:
            raise ValueError(f"No ARIMA model found for {key}. Train first.")

        model_data = self.arima_models[key]
        fitted_model = model_data["model"]

        # Re-fit on all data
        full_model = ARIMA(model_data["series"], order=(2, 1, 2))
        full_fitted = full_model.fit()

        forecast_values = full_fitted.forecast(steps=steps)
        fc_obj = full_fitted.get_forecast(steps=steps)
        conf_int = fc_obj.conf_int()

        # Handle both DataFrame and ndarray returns
        if hasattr(conf_int, 'iloc'):
            lower = conf_int.iloc[:, 0].values
            upper = conf_int.iloc[:, 1].values
        else:
            lower = conf_int[:, 0]
            upper = conf_int[:, 1]

        # Generate future dates
        last_date = pd.Timestamp(model_data["dates"][-1])
        future_dates = [last_date + pd.Timedelta(weeks=i+1) for i in range(steps)]

        result = {
            "product": product,
            "region": region,
            "forecast_weeks": steps,
            "historical": {
                "dates": [str(pd.Timestamp(d).date()) for d in model_data["dates"][-20:]],
                "values": [round(float(v), 2) for v in model_data["series"][-20:]]
            },
            "forecast": {
                "dates": [str(d.date()) for d in future_dates],
                "values": [round(float(v), 2) for v in forecast_values],
                "lower_bound": [round(float(v), 2) for v in lower],
                "upper_bound": [round(float(v), 2) for v in upper]
            },
            "metrics": self.metrics.get(product, {})
        }
        return result

    def get_top_products(self, top_n=5):
        """Get top N products by total revenue."""
        top = (
            self.data.groupby("product_category")["revenue"]
            .sum()
            .sort_values(ascending=False)
            .head(top_n)
        )
        return [{"product": k, "total_revenue": round(float(v), 2)} for k, v in top.items()]

    def get_regional_summary(self):
        """Revenue breakdown by region."""
        summary = (
            self.data.groupby("region")["revenue"]
            .sum()
            .sort_values(ascending=False)
        )
        return [{"region": k, "total_revenue": round(float(v), 2)} for k, v in summary.items()]

    def get_monthly_trend(self, product=None):
        """Monthly revenue trend (all products or specific)."""
        df = self.data.copy()
        if product:
            df = df[df["product_category"] == product]

        monthly = (
            df.groupby(["year", "month"])["revenue"]
            .sum()
            .reset_index()
            .sort_values(["year", "month"])
        )
        monthly["period"] = monthly.apply(
            lambda r: f"{int(r['year'])}-{int(r['month']):02d}", axis=1
        )
        return {
            "periods": monthly["period"].tolist(),
            "values": [round(float(v), 2) for v in monthly["revenue"].tolist()]
        }

    def get_kpi_summary(self):
        """High-level KPIs for the dashboard."""
        total_revenue = float(self.data["revenue"].sum())
        total_units = int(self.data["units_sold"].sum())
        avg_weekly = float(self.data.groupby("date")["revenue"].sum().mean())
        best_product = self.data.groupby("product_category")["revenue"].sum().idxmax()
        best_region = self.data.groupby("region")["revenue"].sum().idxmax()

        return {
            "total_revenue": round(total_revenue, 2),
            "total_units": total_units,
            "avg_weekly_revenue": round(avg_weekly, 2),
            "best_product": best_product,
            "best_region": best_region,
            "data_period": f"{self.data['date'].min().date()} to {self.data['date'].max().date()}"
        }


if __name__ == "__main__":
    model = SalesForecastingModel()
    model.load_data("../data/sales_data.csv")
    metrics = model.train_all()

    print("\n📊 Model Metrics:")
    print(json.dumps(metrics, indent=2))

    print("\n📈 Forecast for Electronics (12 weeks):")
    forecast = model.forecast("Electronics", steps=12)
    print(f"  Next 4 weeks: {forecast['forecast']['values'][:4]}")

    print("\n🏆 Top Products:")
    for p in model.get_top_products():
        print(f"  {p['product']}: ₹{p['total_revenue']:,.0f}")

    print("\n📊 KPIs:")
    kpis = model.get_kpi_summary()
    for k, v in kpis.items():
        print(f"  {k}: {v}")
