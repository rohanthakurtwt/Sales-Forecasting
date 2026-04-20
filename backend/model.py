"""
Sales Data Generator
Generates synthetic sales data for the forecasting model.
Project: Sales Forecasting & Demand Prediction System
Author: Rohan Kumar Thakur | Roll: 2330332 | Batch: 2023-2027
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_sales_data(start_date="2021-01-01", periods=156, save_path="../data/sales_data.csv"):
    """
    Generate realistic synthetic sales data with:
    - Weekly seasonality
    - Yearly seasonality
    - Upward trend
    - Random noise
    - Product categories
    """
    np.random.seed(42)

    products = {
        "Electronics":    {"base": 5000, "trend": 15,  "seasonal_amp": 1200},
        "Clothing":       {"base": 3000, "trend": 8,   "seasonal_amp": 900},
        "Home_Appliances":{"base": 2500, "trend": 10,  "seasonal_amp": 700},
        "Food_Beverages": {"base": 4000, "trend": 5,   "seasonal_amp": 500},
        "Furniture":      {"base": 1500, "trend": 6,   "seasonal_amp": 400},
    }

    regions = ["North", "South", "East", "West", "Central"]

    records = []
    start = datetime.strptime(start_date, "%Y-%m-%d")

    for week_idx in range(periods):
        current_date = start + timedelta(weeks=week_idx)
        t = week_idx

        for product, params in products.items():
            for region in regions:
                # Trend component
                trend = params["base"] + params["trend"] * t

                # Yearly seasonality (52-week cycle)
                yearly_seasonal = params["seasonal_amp"] * np.sin(2 * np.pi * t / 52)

                # Monthly seasonality (4-week cycle)
                monthly_seasonal = params["seasonal_amp"] * 0.3 * np.sin(2 * np.pi * t / 4)

                # Festival/Holiday boost (weeks 48-52 = Dec, week 13 = Easter approx)
                festival_boost = 0
                week_of_year = current_date.isocalendar()[1]
                if week_of_year in range(48, 53) or week_of_year in range(1, 3):
                    festival_boost = params["base"] * 0.4
                elif week_of_year in range(13, 15):
                    festival_boost = params["base"] * 0.15

                # Regional multiplier
                region_multipliers = {
                    "North": 1.1, "South": 0.95,
                    "East": 1.05, "West": 1.2, "Central": 0.9
                }
                region_mult = region_multipliers[region]

                # Random noise
                noise = np.random.normal(0, params["base"] * 0.08)

                # Final sales value
                sales = max(0, (trend + yearly_seasonal + monthly_seasonal + festival_boost) * region_mult + noise)

                # Units sold
                avg_price = {"Electronics": 450, "Clothing": 85, "Home_Appliances": 320,
                             "Food_Beverages": 35, "Furniture": 580}
                units = max(1, int(sales / avg_price[product] + np.random.normal(0, 5)))

                records.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "week": week_idx + 1,
                    "year": current_date.year,
                    "month": current_date.month,
                    "quarter": (current_date.month - 1) // 3 + 1,
                    "product_category": product,
                    "region": region,
                    "units_sold": units,
                    "revenue": round(sales, 2),
                    "avg_price": avg_price[product],
                    "is_holiday_week": 1 if festival_boost > 0 else 0
                })

    df = pd.DataFrame(records)
    os.makedirs(os.path.dirname(save_path) if os.path.dirname(save_path) else ".", exist_ok=True)
    df.to_csv(save_path, index=False)
    print(f"✅ Generated {len(df)} records → {save_path}")
    print(f"   Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"   Products: {df['product_category'].unique().tolist()}")
    print(f"   Regions:  {df['region'].unique().tolist()}")
    return df


if __name__ == "__main__":
    df = generate_sales_data(save_path="../data/sales_data.csv")
    print("\nSample data:")
    print(df.head(10).to_string(index=False))
    print(f"\nTotal Revenue: ₹{df['revenue'].sum():,.2f}")
    print(f"Total Units Sold: {df['units_sold'].sum():,}")
