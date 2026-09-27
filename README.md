# Stirred-Tank Bioreactor Energy Balance Simulation

**Anaerobic Ethanol Fermentation (_Saccharomyces cerevisiae_) | First Law Dynamic Model**

---

### **Project Metadata & Team Details**

- **PROJECT**: THERMODYNAMICS B.TECH BT GROUP 6 MICROPROJECT
- **PROGRAM**: B.TECH in BIOTECHNOLOGY
- **BATCH**: 2025–2029
- **SEMESTER**: SEM - 03
- **COURSE**: THERMODYNAMICS FOR BIOLOGICAL SYSTEMS
- **COURSE FACULTY**: DR. RADHIKA CHANDANKERE
- **INSTITUTION**: ALLIANCE UNIVERSITY

#### **MADE BY GROUP 6:**

1. **Ayush Raj**
2. **Sourav Pal**
3. **Gourav Paul**
4. **Tuhin Ghosh**
5. **RN Ayush**

**Live Interactive Simulation**: [https://ayushrkamal-dev.github.io/bioreactor-simulation/](https://ayushrkamal-dev.github.io/bioreactor-simulation/)

---

## 1. Executive Summary & Problem Formulation

In industrial biotechnology, temperature regulation inside stirred-tank bioreactors is vital for cell viability, enzyme stability, and maximum product yield. Biological reactions are intrinsically exothermic, and mechanical agitation constantly converts electrical power into viscous heat. Without controlled heat dissipation, thermal accumulation will denature cellular proteins and cease fermentation.

This project delivers a real-time SCADA simulation representing a 5.0 L stirred-tank reactor cultivating _Saccharomyces cerevisiae_ under anaerobic conditions. The software dynamic model solves the non-steady-state **First Law of Thermodynamics** simultaneously with **Monod microbial growth kinetics** and a **closed-loop feedback PID cooling loop**.

---

## 2. Conceptual System Boundary Diagram

```mermaid
flowchart TD
    subgraph Boundary ["BIOREACTOR SYSTEM BOUNDARY"]
        direction TB

        subgraph Inputs ["External Energy & Fluid Inputs"]
            Inlet["Coolant Inflow<br/><b>T_ci = 15.0°C</b>"]
            Motor["Mechanical Drive Agitator<br/><b>Shaft Work (W_agit)</b>"]
        end

        subgraph Core ["Vessel Reaction Core"]
            Jacket["Cooling Jacket Sleeve<br/><b>Heat Removal (Q_cool)</b>"]
            Broth["Fermentation Broth Volume<br/><b>V = 5.0 L | M = 5000 g</b><br/><i>S. cerevisiae</i> Catabolism<br/><b>Metabolic Heat (Q_met)</b>"]
        end

        subgraph Outputs ["Thermal Dissipation & Coolant Exit"]
            Outlet["Coolant Outflow<br/><b>T_cout (°C)</b>"]
            Loss["Ambient Heat Loss<br/><b>Convective Loss (Q_loss)</b>"]
        end
    end

    Inlet -->|"Coolant Feed"| Jacket
    Motor -->|"Viscous Shear W_agit"| Broth
    Broth -->|"Convective Transfer Q_cool"| Jacket
    Jacket -->|"Discharge"| Outlet
    Broth -->|"Surface Convection Q_loss"| Loss

    style Boundary fill:#071224,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style Inputs fill:#0b1b36,stroke:#1e40af,color:#e2e8f0
    style Core fill:#0e2444,stroke:#38bdf8,color:#f8fafc
    style Outputs fill:#0b1b36,stroke:#1e40af,color:#e2e8f0
    style Broth fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#f8fafc
    style Jacket fill:#0c4a6e,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
```
---

## 3. Thermodynamics & Biological Kinetics Core

### 3.1 First Law Transient Energy Balance

By applying the First Law of Thermodynamics to a closed liquid control volume of constant mass ($M = V \cdot \rho$):

$$\frac{dE_{\text{system}}}{dt} = \dot{Q}_{\text{net}} - \dot{W}_{\text{net}}$$

Expressed in thermal flux terms (Watts or $\text{J}\cdot\text{s}^{-1}$):

$$\frac{dE}{dt} = Q_{\text{met}} + W_{\text{agit}} - Q_{\text{cool}} - Q_{\text{loss}}$$

The transient rate of temperature change of the liquid broth ($dT/dt$) is governed by:

$$\frac{dT}{dt} = \frac{Q_{\text{met}} + W_{\text{agit}} - Q_{\text{cool}} - Q_{\text{loss}}}{M_{\text{broth}} \cdot C_{p,\text{broth}}}$$

Where:

- $V = 5.0\text{ L}$ (Working Volume)
- $\rho = 1000\text{ g/L}$ (Broth Density)
- $M_{\text{broth}} = V \cdot \rho = 5000\text{ g}$
- $C_{p,\text{broth}} = 4.184\text{ J}/(\text{g}\cdot\text{K})$ (Specific heat capacity of aqueous media)

---

### 3.2 Metabolic Heat Generation ($Q_{\text{met}}$)

Biomass accumulation follows Monod substrate-limited growth kinetics:

$$\mu = \mu_{\max} \frac{S}{K_s + S}$$

$$\frac{dX}{dt} = \mu X, \quad \frac{dS}{dt} = -\frac{1}{Y_{X/S}} \frac{dX}{dt}$$

Metabolic heat released by anaerobic glycolysis and cellular maintenance is directly proportional to biomass synthesis:

$$Q_{\text{met}} = \left(\frac{1}{3600} \cdot \frac{dX}{dt}\right) \cdot V \cdot \Delta H_{\text{rxn}}$$

- Maximum specific growth rate ($\mu_{\max}$): $0.38\text{ h}^{-1}$
- Monod constant ($K_s$): $1.25\text{ g/L}$
- Biomass yield coefficient on glucose ($Y_{X/S}$): $0.51\text{ g cells / g glucose}$
- Exothermic heat of reaction ($\Delta H_{\text{rxn}}$): $14{,}500\text{ J/g biomass produced}$

---

### 3.3 Mechanical Agitation Power Dissipation ($W_{\text{agit}}$)

Rotational shaft work from the dual Rushton turbines dissipates entirely as thermal friction within the turbulent regime:

$$P = N_p \cdot \rho \cdot N^3 \cdot D_i^5 \implies W_{\text{agit}} \approx k_{\text{agit}} \cdot N^{2.9}$$

- Impeller speed range ($N$): $0 - 600\text{ RPM}$
- Empirical power dissipation coefficient ($k_{\text{agit}}$): $2.4 \times 10^{-6}$

---

### 3.4 External Heat Transfer Terms

- **Environmental Heat Loss ($Q_{\text{loss}}$)**:
  $$Q_{\text{loss}} = k_{\text{loss}} \cdot (T_{\text{broth}} - T_{\text{amb}})$$
  Where $k_{\text{loss}} = 1.95\text{ W/K}$ and $T_{\text{amb}}$ is the room temperature.

- **PID-Controlled Jacket Cooling ($Q_{\text{cool}}$)**:
  Targeting an optimal fermentation setpoint of $T_{\text{set}} = 30.0^\circ\text{C}$ with inlet coolant at $T_{\text{ci}} = 15.0^\circ\text{C}$:
  $$e(t) = T_{\text{broth}} - T_{\text{set}}$$
  $$Q_{\text{demand}} = K_p \, e(t) + K_i \int_0^t e(\tau)\,d\tau$$
  $$Q_{\text{cool}} = \min\left(Q_{\text{demand}}, \; U A (T_{\text{broth}} - T_{\text{ci}})\right)$$

- **Coolant Exit Temperature ($T_{\text{cout}}$)**:
  $$T_{\text{cout}} = T_{\text{ci}} + \frac{Q_{\text{cool}}}{\dot{m}_c \cdot C_{p,c}}$$

---

## 4. Simulation Execution Logic & Data Flow

```mermaid
flowchart TD
    A(["Initialize Dynamic State (t = 0)<br/>T = 29.67°C, X = 2.85 g/L, S = 84.6 g/L"]) --> B["Poll Real-Time Process Inputs<br/>Agitation (N), Ambient (T_amb), Air (vvm), PID Mode"]
    
    B --> C["Compute Biological Kinetics (Monod)<br/>μ = μ_max · S / (K_s + S)<br/>dX/dt = μ · X<br/>dS/dt = -(1/Y_xs) · dX/dt"]
    
    C --> D["Evaluate First Law Thermal Fluxes (Watts)<br/>• Q_met = (dX/dt / 3600) · V · ΔH_rxn<br/>• W_agit = k_agit · N^2.9<br/>• Q_loss = k_loss · (T - T_amb)<br/>• Q_cool = PID_Compute(T - 30.0°C)"]
    
    D --> E["Sum Net Energy Flux<br/>dE/dt = Q_met + W_agit - Q_cool - Q_loss"]
    
    E --> F["Numerical Integration Step (Euler-Forward)<br/>T += (dE/dt / (M · Cp)) · Δt<br/>X += (dX/dt) · Δt<br/>S += (dS/dt) · Δt<br/>t += Δt"]
    
    F --> G["Render Dynamic SCADA Displays<br/>• Dual Rushton Impeller Rotation Rate<br/>• Aeration Sparger Micro-Bubble Stream<br/>• Live Multi-Axis Chart.js Profiles"]
    
    G -->|"Next Animation Frame (requestAnimationFrame)"| B

    style A fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc
    style B fill:#1e293b,stroke:#64748b,color:#f8fafc
    style C fill:#1e293b,stroke:#22c55e,color:#f8fafc
    style D fill:#1e293b,stroke:#f59e0b,color:#f8fafc
    style E fill:#0c4a6e,stroke:#38bdf8,color:#f8fafc
    style F fill:#1e293b,stroke:#a855f7,color:#f8fafc
    style G fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#f8fafc
```
---

## 5. How to Run Locally

### Prerequisites

- Any modern web browser (Safari, Chrome, Firefox, Edge).
- Visual Studio Code.

### Step-by-Step Instructions

1. **Clone the repository**:
   ```bash
   git clone [https://github.com/ayushrkamal-dev/bioreactor-simulation.git](https://github.com/ayushrkamal-dev/bioreactor-simulation.git)
   cd bioreactor-simulation
   ```
