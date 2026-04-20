/**
 * Sales Forecasting Dashboard - Frontend Logic
 * SAP Analytics Cloud Style
 * Author: Rohan Kumar Thakur | Roll: 2330332 | Batch: 2023-2027
 */

const API_BASE = "http://localhost:5000/api";
const SAP_COLORS = {
  blue:   "#0070f2",
  green:  "#107e3e",
  gold:   "#f0ab00",
  orange: "#e76500",
  red:    "#bb0000",
  purple: "#6f32be",
  teal:   "#0fa774",
};

let charts = {};
let usingDemoData = false;

// ── Demo Data (used when backend is offline) ──
const DEMO = {
  kpis: {
    total_revenue: 42856320.50,
    total_units: 198430,
    avg_weekly_revenue: 274720.00,
    best_product: "Electronics",
    best_region: "West",
    data_period: "2021-01-04 to 2023-12-25"
  },
  regions: [
    { region: "West",    total_revenue: 9890432 },
    { region: "North",   total_revenue: 9234567 },
    { region: "East",    total_revenue: 8765432 },
    { region: "South",   total_revenue: 7980123 },
    { region: "Central", total_revenue: 6985766 }
  ],
  topProducts: [
    { product: "Electronics",     total_revenue: 14230000 },
    { product: "Food_Beverages",  total_revenue: 10450000 },
    { product: "Clothing",        total_revenue: 8760000  },
    { product: "Home_Appliances", total_revenue: 6400000  },
    { product: "Furniture",       total_revenue: 3016320  }
  ],
  monthlyTrend: {
    periods: ["2021-01","2021-02","2021-03","2021-04","2021-05","2021-06",
              "2021-07","2021-08","2021-09","2021-10","2021-11","2021-12",
              "2022-01","2022-02","2022-03","2022-04","2022-05","2022-06",
              "2022-07","2022-08","2022-09","2022-10","2022-11","2022-12",
              "2023-01","2023-02","2023-03","2023-04","2023-05","2023-06",
              "2023-07","2023-08","2023-09","2023-10","2023-11","2023-12"],
    values: [820000,790000,880000,920000,960000,1010000,
             1040000,1020000,1080000,1120000,1240000,1380000,
             980000,870000,960000,1050000,1090000,1110000,
             1150000,1130000,1190000,1220000,1350000,1490000,
             1060000,950000,1040000,1140000,1200000,1250000,
             1280000,1270000,1340000,1400000,1560000,1640000]
  },
  weeklyData: (function() {
    const dates = [], rev = [], units = [];
    let base = new Date("2023-01-01");
    for (let i = 0; i < 52; i++) {
      dates.push(base.toISOString().slice(0,10));
      const v = 250000 + Math.sin(i * 2 * Math.PI / 52) * 60000
              + Math.random() * 30000 + i * 800;
      rev.push(Math.round(v));
      units.push(Math.round(v / 120));
      base.setDate(base.getDate() + 7);
    }
    return { dates, revenue: rev, units };
  })(),
  metrics: {
    Electronics:     { arima: { mae: 12340, rmse: 15600, mape: 4.2 }, linear_regression: { mae: 13100, r2: 0.94 } },
    Clothing:        { arima: { mae: 8900,  rmse: 11200, mape: 5.1 }, linear_regression: { mae: 9400,  r2: 0.91 } },
    Home_Appliances: { arima: { mae: 7600,  rmse: 9800,  mape: 5.8 }, linear_regression: { mae: 8200,  r2: 0.89 } },
    Food_Beverages:  { arima: { mae: 5400,  rmse: 6900,  mape: 3.9 }, linear_regression: { mae: 5900,  r2: 0.92 } },
    Furniture:       { arima: { mae: 4200,  rmse: 5400,  mape: 6.3 }, linear_regression: { mae: 4800,  r2: 0.87 } }
  }
};

function generateDemoForecast(product, weeks) {
  const bases = {
    Electronics: 285000, Clothing: 175000, Home_Appliances: 145000,
    Food_Beverages: 210000, Furniture: 88000
  };
  const base = bases[product] || 150000;
  const historical = { dates: [], values: [] };
  const forecast   = { dates: [], values: [], lower_bound: [], upper_bound: [] };

  let hDate = new Date("2023-06-01");
  for (let i = 0; i < 20; i++) {
    historical.dates.push(hDate.toISOString().slice(0,10));
    historical.values.push(Math.round(base + Math.sin(i * 0.4) * base * 0.12 + Math.random() * base * 0.06));
    hDate.setDate(hDate.getDate() + 7);
  }
  for (let i = 0; i < weeks; i++) {
    const v = base * (1 + 0.003 * i) + Math.sin(i * 0.5) * base * 0.1;
    const uncertainty = base * 0.08 * (1 + i * 0.04);
    forecast.dates.push(hDate.toISOString().slice(0,10));
    forecast.values.push(Math.round(v));
    forecast.lower_bound.push(Math.round(v - uncertainty));
    forecast.upper_bound.push(Math.round(v + uncertainty));
    hDate.setDate(hDate.getDate() + 7);
  }
  return { product, forecast_weeks: weeks, historical, forecast,
           metrics: DEMO.metrics[product] || {} };
}

// ── API Fetch ──
async function apiFetch(endpoint) {
  try {
    const res = await fetch(API_BASE + endpoint, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// ── Chart Helper ──
function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function formatINR(val) {
  if (val >= 10000000) return "₹" + (val / 10000000).toFixed(1) + " Cr";
  if (val >= 100000)   return "₹" + (val / 100000).toFixed(1) + " L";
  if (val >= 1000)     return "₹" + (val / 1000).toFixed(0) + "K";
  return "₹" + val.toFixed(0);
}

// ── Load KPIs ──
async function loadKPIs() {
  let kpis = await apiFetch("/kpis");
  if (!kpis) { kpis = DEMO.kpis; usingDemoData = true; }

  document.getElementById("totalRevenue").textContent = formatINR(kpis.total_revenue);
  document.getElementById("totalUnits").textContent   = Number(kpis.total_units).toLocaleString("en-IN");
  document.getElementById("avgWeekly").textContent    = formatINR(kpis.avg_weekly_revenue);
  document.getElementById("bestProduct").textContent  = kpis.best_product.replace("_"," ");
  document.getElementById("bestRegion").textContent   = kpis.best_region;
}

// ── Monthly Trend ──
async function loadMonthlyTrend() {
  const product = document.getElementById("productFilter").value || null;
  let data = await apiFetch("/monthly-trend" + (product ? `?product=${product}` : ""));
  if (!data) data = DEMO.monthlyTrend;

  destroyChart("monthlyTrend");
  const ctx = document.getElementById("monthlyTrendChart").getContext("2d");
  charts["monthlyTrend"] = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.periods,
      datasets: [{
        label: "Monthly Revenue (₹)",
        data: data.values,
        borderColor: SAP_COLORS.blue,
        backgroundColor: "rgba(0,112,242,0.08)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: SAP_COLORS.blue
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxRotation: 45, font: { size: 10 } } },
        y: { ticks: { callback: v => formatINR(v), font: { size: 10 } } }
      }
    }
  });
}

// ── Regions Donut ──
async function loadRegions() {
  let data = await apiFetch("/regions");
  if (!data) data = DEMO.regions;

  destroyChart("region");
  const ctx = document.getElementById("regionChart").getContext("2d");
  charts["region"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.map(r => r.region),
      datasets: [{
        data: data.map(r => r.total_revenue),
        backgroundColor: [SAP_COLORS.blue, SAP_COLORS.green, SAP_COLORS.gold,
                          SAP_COLORS.orange, SAP_COLORS.purple],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${formatINR(ctx.raw)}` } }
      }
    }
  });
}

// ── Top Products Bar ──
async function loadTopProducts() {
  let data = await apiFetch("/top-products");
  if (!data) data = DEMO.topProducts;

  destroyChart("topProducts");
  const ctx = document.getElementById("topProductsChart").getContext("2d");
  charts["topProducts"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(p => p.product.replace("_", " ")),
      datasets: [{
        label: "Total Revenue",
        data: data.map(p => p.total_revenue),
        backgroundColor: [SAP_COLORS.blue, SAP_COLORS.green, SAP_COLORS.orange,
                          SAP_COLORS.gold, SAP_COLORS.purple],
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 10 } } },
        y: { ticks: { callback: v => formatINR(v), font: { size: 10 } } }
      }
    }
  });
}

// ── Weekly Chart ──
async function loadWeekly() {
  const product = document.getElementById("productFilter").value || null;
  const region  = document.getElementById("regionFilter").value || null;
  let params = [];
  if (product) params.push("product=" + product);
  if (region)  params.push("region=" + region);

  let data = await apiFetch("/weekly-data" + (params.length ? "?" + params.join("&") : ""));
  if (!data) data = DEMO.weeklyData;

  destroyChart("weekly");
  const ctx = document.getElementById("weeklyChart").getContext("2d");
  charts["weekly"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.dates.map(d => d.slice(5)),
      datasets: [
        {
          label: "Revenue (₹)",
          data: data.revenue,
          backgroundColor: "rgba(0,112,242,0.7)",
          borderColor: SAP_COLORS.blue,
          borderWidth: 1,
          yAxisID: "y"
        },
        {
          label: "Units",
          data: data.units,
          type: "line",
          borderColor: SAP_COLORS.orange,
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.4,
          yAxisID: "y2"
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "top", labels: { font: { size: 11 } } } },
      scales: {
        x: { ticks: { maxRotation: 45, font: { size: 9 } } },
        y:  { ticks: { callback: v => formatINR(v), font: { size: 10 } }, position: "left" },
        y2: { ticks: { font: { size: 10 } }, position: "right", grid: { drawOnChartArea: false } }
      }
    }
  });
}

// ── Forecast ──
async function runForecast() {
  const product = document.getElementById("forecastProduct").value;
  const weeks   = parseInt(document.getElementById("forecastWeeks").value);
  const btn = document.querySelector(".forecast-btn");
  btn.textContent = "⏳ Running...";
  btn.disabled = true;

  let data = await apiFetch(`/forecast/${product}?weeks=${weeks}`);
  if (!data) data = generateDemoForecast(product, weeks);

  btn.textContent = "Run Forecast →";
  btn.disabled = false;

  // Combined chart: historical + forecast + confidence band
  const allDates  = [...data.historical.dates, ...data.forecast.dates];
  const histVals  = [...data.historical.values, ...new Array(weeks).fill(null)];
  const fcastVals = [...new Array(data.historical.values.length).fill(null), ...data.forecast.values];
  const upperBand = [...new Array(data.historical.values.length).fill(null), ...data.forecast.upper_bound];
  const lowerBand = [...new Array(data.historical.values.length).fill(null), ...data.forecast.lower_bound];

  destroyChart("forecast");
  const ctx = document.getElementById("forecastChart").getContext("2d");
  charts["forecast"] = new Chart(ctx, {
    type: "line",
    data: {
      labels: allDates,
      datasets: [
        {
          label: "Historical",
          data: histVals,
          borderColor: SAP_COLORS.blue,
          backgroundColor: "rgba(0,112,242,0.06)",
          borderWidth: 2,
          fill: true,
          pointRadius: 2,
          tension: 0.3
        },
        {
          label: "Forecast",
          data: fcastVals,
          borderColor: SAP_COLORS.orange,
          backgroundColor: "rgba(231,101,0,0.08)",
          borderWidth: 2.5,
          borderDash: [6, 3],
          fill: false,
          pointRadius: 3,
          tension: 0.3
        },
        {
          label: "Upper Bound",
          data: upperBand,
          borderColor: "rgba(231,101,0,0.2)",
          backgroundColor: "rgba(231,101,0,0.08)",
          borderWidth: 1,
          fill: "+1",
          pointRadius: 0,
          tension: 0.3
        },
        {
          label: "Lower Bound",
          data: lowerBand,
          borderColor: "rgba(231,101,0,0.2)",
          backgroundColor: "rgba(231,101,0,0.08)",
          borderWidth: 1,
          fill: false,
          pointRadius: 0,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { font: { size: 11 } } },
        title: {
          display: true,
          text: `${product.replace("_"," ")} — ${weeks}-Week Revenue Forecast (ARIMA)`,
          font: { size: 13 }
        }
      },
      scales: {
        x: { ticks: { maxRotation: 45, font: { size: 9 } } },
        y: { ticks: { callback: v => formatINR(v), font: { size: 10 } } }
      }
    }
  });

  // Populate table
  const tbody = document.getElementById("forecastTableBody");
  tbody.innerHTML = "";
  data.forecast.dates.forEach((date, i) => {
    const val   = data.forecast.values[i];
    const lower = data.forecast.lower_bound[i];
    const upper = data.forecast.upper_bound[i];
    const range = upper - lower;
    const confClass = i < 4 ? "confidence-high" : i < 8 ? "confidence-med" : "confidence-low";
    const confLabel = i < 4 ? "High" : i < 8 ? "Medium" : "Low";
    tbody.innerHTML += `
      <tr>
        <td>Week ${i+1}</td>
        <td>${date}</td>
        <td>₹${val.toLocaleString("en-IN")}</td>
        <td>₹${lower.toLocaleString("en-IN")}</td>
        <td>₹${upper.toLocaleString("en-IN")}</td>
        <td><span class="confidence-badge ${confClass}">${confLabel}</span></td>
      </tr>`;
  });
  document.getElementById("forecastTable").style.display = "block";
}

// ── Model Metrics ──
async function loadMetrics() {
  let data = await apiFetch("/metrics");
  if (!data) data = DEMO.metrics;

  const grid = document.getElementById("metricsGrid");
  grid.innerHTML = "";

  Object.entries(data).forEach(([product, metrics]) => {
    const arima = metrics.arima || {};
    const lr    = metrics.linear_regression || {};
    grid.innerHTML += `
      <div class="metric-card">
        <div class="metric-product">📦 ${product.replace("_"," ")}</div>
        <div class="metric-row">
          <span class="metric-row-label">ARIMA MAE</span>
          <span class="metric-row-value">${arima.mae ? formatINR(arima.mae) : "—"}</span>
        </div>
        <div class="metric-row">
          <span class="metric-row-label">ARIMA RMSE</span>
          <span class="metric-row-value">${arima.rmse ? formatINR(arima.rmse) : "—"}</span>
        </div>
        <div class="metric-row">
          <span class="metric-row-label">ARIMA MAPE</span>
          <span class="metric-row-value">${arima.mape ? arima.mape + "%" : "—"}</span>
        </div>
        <div class="metric-row">
          <span class="metric-row-label">LR R² Score</span>
          <span class="metric-row-value">${lr.r2 !== undefined ? lr.r2 : "—"}</span>
        </div>
        <div class="metric-row">
          <span class="metric-row-label">LR MAE</span>
          <span class="metric-row-value">${lr.mae ? formatINR(lr.mae) : "—"}</span>
        </div>
      </div>`;
  });
}

// ── Filters ──
function applyFilters() {
  loadMonthlyTrend();
  loadWeekly();
}

function setView(view) {
  document.querySelectorAll(".toolbar-btn").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");
}

// ── Load All ──
async function loadAllData() {
  await loadKPIs();
  await loadMonthlyTrend();
  await loadRegions();
  await loadTopProducts();
  await loadWeekly();
  await loadMetrics();
  await runForecast();

  if (usingDemoData) {
    const banner = document.createElement("div");
    banner.className = "demo-banner";
    banner.innerHTML = "⚠️ Backend not detected — showing demo data. Start the Flask server (<code>python backend/app.py</code>) for live data.";
    document.querySelector(".main-content").prepend(banner);
  }
}

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  loadAllData();
});
