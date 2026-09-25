// --- Physical & Biological Constants ---
const V_liters = 5.0; // Working volume (L)
const rho_broth = 1000.0; // Broth density (g/L)
const Cp_broth = 4.184; // J/(g * °C)
const Broth_Mass = V_liters * rho_broth; // 5000 g
const T_ci = 15.0; // Coolant Inlet Temp (°C)
const Target_T = 30.0; // Setpoint (°C)
const k_loss = 1.95; // Heat loss factor to ambient (W/°C)
const Heat_Reaction = 14500.0; // Joules per gram biomass produced
const Yield_XS = 0.51; // Biomass yield on substrate
const Mu_Max = 0.38; // Maximum specific growth rate (1/h)
const K_s = 1.25; // Monod affinity constant (g/L)
const k_agit_const = 2.4e-6; // Power correlation factor

// --- Simulation State ---
let time_hours = 0.0;
let T_broth = 29.67;
let Biomass_X = 2.85;
let Glucose_S = 84.6;
let isRunning = true;
let integral_err = 0.0;

// --- DOM References ---
const clockTxt = document.getElementById("clock-txt");
const statusTxt = document.getElementById("status-txt");
const badgeDot = document.getElementById("badge-dot");

const coolingModeSel = document.getElementById("cooling-mode");
const rpmSlider = document.getElementById("rpm-slider");
const tambSlider = document.getElementById("tamb-slider");
const airSlider = document.getElementById("air-slider");
const accelSlider = document.getElementById("accel-slider");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");

const rpmLabel = document.getElementById("rpm-label");
const tambLabel = document.getElementById("tamb-label");
const airLabel = document.getElementById("air-label");
const accelLabel = document.getElementById("accel-label");

const valQmet = document.getElementById("val-qmet");
const valWagit = document.getElementById("val-wagit");
const valQcool = document.getElementById("val-qcool");
const valQloss = document.getElementById("val-qloss");

const valTbroth = document.getElementById("val-tbroth");
const valTcout = document.getElementById("val-tcout");
const valBiomass = document.getElementById("val-biomass");
const valGlucose = document.getElementById("val-glucose");
const svgTcoText = document.getElementById("svg-tco-text");

const bladeTop = document.getElementById("blade-top");
const bladeBottom = document.getElementById("blade-bottom");
const bubbleContainer = document.getElementById("bubble-container");

// --- Input Listeners ---
rpmSlider.addEventListener("input", (e) => {
  const val = parseInt(e.target.value);
  rpmLabel.textContent = `${val} RPM`;
  if (val === 0) {
    bladeTop.style.animationPlayState = "paused";
    bladeBottom.style.animationPlayState = "paused";
  } else {
    bladeTop.style.animationPlayState = isRunning ? "running" : "paused";
    bladeBottom.style.animationPlayState = isRunning ? "running" : "paused";
    const dur = Math.max(0.06, 55 / val);
    bladeTop.style.animationDuration = `${dur}s`;
    bladeBottom.style.animationDuration = `${dur}s`;
  }
});

tambSlider.addEventListener("input", (e) => {
  tambLabel.textContent = `${parseFloat(e.target.value).toFixed(1)} °C`;
});

airSlider.addEventListener("input", (e) => {
  const vvm = parseFloat(e.target.value);
  airLabel.textContent = `${vvm.toFixed(1)} vvm`;
  bubbleContainer.style.opacity = vvm > 0 ? 0.3 + (vvm / 2.5) * 0.7 : 0;
});

accelSlider.addEventListener("input", (e) => {
  accelLabel.textContent = `${e.target.value}x`;
});

pauseBtn.addEventListener("click", () => {
  isRunning = !isRunning;
  pauseBtn.textContent = isRunning ? "Pause Simulation" : "Resume Simulation";
  pauseBtn.style.background = isRunning ? "#e11d48" : "#2563eb";
  statusTxt.textContent = isRunning ? "RUNNING" : "PAUSED";
  statusTxt.style.color = isRunning ? "var(--green)" : "var(--amber)";
  badgeDot.style.background = isRunning ? "var(--green)" : "var(--amber)";
  badgeDot.style.boxShadow = isRunning
    ? "0 0 8px var(--green)"
    : "0 0 8px var(--amber)";
  bladeTop.style.animationPlayState = isRunning ? "running" : "paused";
  bladeBottom.style.animationPlayState = isRunning ? "running" : "paused";
});

resetBtn.addEventListener("click", resetBatch);

// --- Chart.js Setup ---
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      labels: {
        color: "#8ea5c8",
        boxWidth: 10,
        font: { size: 9.5 },
      },
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "Time (h)",
        color: "#8ea5c8",
        font: { size: 9 },
      },
      ticks: { color: "#8ea5c8", font: { size: 9 }, maxTicksLimit: 10 },
      grid: { color: "rgba(255,255,255,0.04)" },
    },
    y: {
      ticks: { color: "#8ea5c8", font: { size: 9 } },
      grid: { color: "rgba(255,255,255,0.04)" },
    },
  },
};

const tempCtx = document.getElementById("tempChart").getContext("2d");
const tempChart = new Chart(tempCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Broth Temp T (°C)",
        data: [],
        borderColor: "#38bdf8",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.15,
      },
      {
        label: "Setpoint (30.0°C)",
        data: [],
        borderColor: "rgba(255,255,255,0.3)",
        borderDash: [3, 3],
        borderWidth: 1.5,
        pointRadius: 0,
      },
    ],
  },
  options: {
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      y: {
        ...baseOptions.scales.y,
        title: {
          display: true,
          text: "Temp (°C)",
          color: "#8ea5c8",
          font: { size: 9 },
        },
        min: 20,
        max: 45,
      },
    },
  },
});

const bioCtx = document.getElementById("bioChart").getContext("2d");
const bioChart = new Chart(bioCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Glucose S (g/L)",
        data: [],
        borderColor: "#f59e0b",
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: "y",
      },
      {
        label: "Biomass X (g/L)",
        data: [],
        borderColor: "#22c55e",
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: "y1",
      },
    ],
  },
  options: {
    ...baseOptions,
    scales: {
      x: baseOptions.scales.x,
      y: {
        type: "linear",
        position: "left",
        title: {
          display: true,
          text: "Glucose (g/L)",
          color: "#f59e0b",
          font: { size: 9 },
        },
        min: 0,
        max: 100,
        ticks: { color: "#f59e0b", font: { size: 9 } },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y1: {
        type: "linear",
        position: "right",
        title: {
          display: true,
          text: "Biomass (g/L)",
          color: "#22c55e",
          font: { size: 9 },
        },
        min: 0,
        max: 15,
        ticks: { color: "#22c55e", font: { size: 9 } },
        grid: { drawOnChartArea: false },
      },
    },
  },
});

function resetBatch() {
  time_hours = 0.0;
  T_broth = 29.67;
  Biomass_X = 2.85;
  Glucose_S = 84.6;
  integral_err = 0.0;

  tempChart.data.labels = [];
  tempChart.data.datasets[0].data = [];
  tempChart.data.datasets[1].data = [];
  bioChart.data.labels = [];
  bioChart.data.datasets[0].data = [];
  bioChart.data.datasets[1].data = [];
  tempChart.update();
  bioChart.update();
}

// --- Numerical Integration Step ---
function stepModel(dt_seconds) {
  if (!isRunning) return;

  const N = parseFloat(rpmSlider.value);
  const T_amb = parseFloat(tambSlider.value);
  const mode = coolingModeSel.value;
  const dt_hours = dt_seconds / 3600.0;

  // 1. Biological Monod Kinetics
  const mu = Glucose_S > 0.02 ? (Mu_Max * Glucose_S) / (K_s + Glucose_S) : 0;
  const dX_dt = mu * Biomass_X; // g/(L*h)
  const dS_dt = -(1.0 / Yield_XS) * dX_dt; // g/(L*h)

  Biomass_X = Math.max(0, Biomass_X + dX_dt * dt_hours);
  Glucose_S = Math.max(0, Glucose_S + dS_dt * dt_hours);

  // 2. Energy Flux Terms
  const dX_dt_per_sec = dX_dt / 3600.0;
  const Q_met = Math.max(0, dX_dt_per_sec * V_liters * Heat_Reaction);
  const W_agit = k_agit_const * Math.pow(N, 2.9);
  const Q_loss = k_loss * (T_broth - T_amb);

  // 3. Cooling Exchange & Outlet Coolant Calculation
  let Q_cool = 0.0;
  let T_cout = T_ci;

  if (mode === "pid") {
    const error = T_broth - Target_T;
    integral_err = Math.max(-5, Math.min(20, integral_err + error * dt_hours));
    const demand = Math.max(0, 22.0 * error + 0.8 * integral_err);
    const max_heat_transfer = 32.0 * Math.max(0, T_broth - T_ci);
    Q_cool = Math.min(demand, max_heat_transfer);
    T_cout = T_ci + Q_cool / 18.0;
  } else if (mode === "manual") {
    Q_cool = Math.max(0, 24.0 * (T_broth - T_ci));
    T_cout = T_ci + Q_cool / 18.0;
  }

  // 4. Broth Temperature Dynamic
  const dE_dt = Q_met + W_agit - Q_cool - Q_loss;
  const dT_dt = dE_dt / (Broth_Mass * Cp_broth);
  T_broth += dT_dt * dt_seconds;
  time_hours += dt_hours;

  // Update UI Elements
  clockTxt.textContent = `${time_hours.toFixed(2)} h`;
  valQmet.textContent = `${Q_met.toFixed(1)} W`;
  valWagit.textContent = `${W_agit.toFixed(1)} W`;
  valQcool.textContent = `${Q_cool.toFixed(1)} W`;
  valQloss.textContent = `${Q_loss.toFixed(1)} W`;

  valTbroth.textContent = `${T_broth.toFixed(2)} °C`;
  valTcout.textContent = `${T_cout.toFixed(2)} °C`;
  svgTcoText.textContent = `COOLANT OUT (${T_cout.toFixed(1)}°C)`;
  valBiomass.textContent = `${Biomass_X.toFixed(2)} g/L`;
  valGlucose.textContent = `${Glucose_S.toFixed(1)} g/L`;

  // Update Charts at fixed intervals (~0.04h)
  const lastPoint = tempChart.data.labels[tempChart.data.labels.length - 1];
  if (!lastPoint || time_hours - parseFloat(lastPoint) >= 0.04) {
    const timeLabel = time_hours.toFixed(2);

    tempChart.data.labels.push(timeLabel);
    tempChart.data.datasets[0].data.push(T_broth.toFixed(2));
    tempChart.data.datasets[1].data.push(Target_T);

    bioChart.data.labels.push(timeLabel);
    bioChart.data.datasets[0].data.push(Glucose_S.toFixed(2));
    bioChart.data.datasets[1].data.push(Biomass_X.toFixed(2));

    if (tempChart.data.labels.length > 70) {
      tempChart.data.labels.shift();
      tempChart.data.datasets.forEach((ds) => ds.data.shift());
      bioChart.data.labels.shift();
      bioChart.data.datasets.forEach((ds) => ds.data.shift());
    }

    tempChart.update();
    bioChart.update();
  }
}

// --- Animation Loop ---
let lastTick = performance.now();
function runEngine(currentTick) {
  const deltaRealSec = (currentTick - lastTick) / 1000;
  lastTick = currentTick;

  const accel = parseFloat(accelSlider.value);
  stepModel(deltaRealSec * accel);

  requestAnimationFrame(runEngine);
}

requestAnimationFrame(runEngine);
