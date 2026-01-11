# ⚡ Strategic Wire Costing Engine (Old vs New Negotiation System)

This project is a **strategic costing calculator + negotiation tool** for copper and aluminium wires & cables.
It allows users to load products from an Excel file, modify technical specs, compare old vs new costs, and evaluate margins & selling prices for negotiation scenarios.

---

## 🎯 **Core Purpose**

- Calculate manufacturing cost of wire/cable products
- Compare **OLD (existing Excel baseline)** vs **NEW (override-based)** costing
- Show **side-by-side breakdowns**
- Perform **margin vs price negotiation**
- Assist in pricing, quoting, and negotiation decisions
- Make costing transparent, fast, and data-driven

---

## 📦 **Data Source (Excel as SOT)**

The project reads product specs from:
`assets/product_cost_master.xlsx`

Excel is the **single source of truth** (SOT).  
Excel structure must not be modified by code.  
Sheets = product categories:

- Multicore Copper Cable
- Multistrand Copper Wire
- Multistrand Aluminium Wire
- Multicore Aluminium Cable

Each sheet contains fields such as:

- `product_name`
- `gauge`
- `strands`
- `cores`
- `length_gaj`
- `coil_weight_kg`
- `metal_rate_per_kg`
- `pvc_rate_per_kg`
- `labour_type`
- `labour_value`
- `metal_weight_kg`
- `pvc_weight_kg`
- `metal_cost`
- `pvc_cost`
- `manufacturing_cost`

These fields load directly into UI.

---

## 🧠 **Category Logic (Auto From Excel)**

Category is automatically derived from the Excel sheet name.
No manual category dropdown in UI.

| Category | strands | cores | metal | factor |
|---|---|---|---|---|
| Multistrand Copper Wire | from excel | hide | copper | 412 |
| Multicore Copper Cable | from excel | show | copper | 412 |
| Multistrand Aluminium Wire | fixed=7 | hide | aluminium | 300 |
| Multicore Aluminium Cable | fixed=7 | show | aluminium | 300 |

---

## ✏️ **Override System (User Inputs)**

User may override:

- gauge
- strands (copper only)
- cores (only multicore)
- length_gaj
- coil_weight_kg
- metal_rate_per_kg
- pvc_rate_per_kg
- labour_type
- labour_value

**Override rules:**

> override > excel default

If no override → no comparison shown.

---

## 🔁 **Calculate Button Behavior**

When user clicks **Calculate Cost**:

1. **OLD** values are taken from Excel row
2. **NEW** values are recalculated using overrides
3. Comparison & negotiation UI becomes visible

---

## 📊 **OLD vs NEW Cost Breakdown**

Displayed side-by-side:

| Component | OLD (Excel) | NEW (Recalc) | Δ |
|---|---|---|---|
| Metal Weight | | | |
| PVC Weight | | | |
| Metal Cost | | | |
| PVC Cost | | | |
| Labour | | | |
| **Manufacturing Cost** | **(Highlight)** | **(Highlight)** | |

**Notes:**

- OLD is never recalculated
- NEW always recalculates via engine
- `Manufacturing Cost` row is visually emphasized

---

## 💸 **Negotiator Logic (2 Modes)**

Negotiator supports **two modes**:

### **MODE 1 — Margin → Selling Price**

*User adjusts Margin % slider.*

`price = cost × (1 + margin%)`

**Outputs:**

| Metric | OLD | NEW |
|---|---|---|
| Cost | | |
| Margin% | (Fixed) | (Fixed) |
| Selling Price | (Calc) | (Calc) |

---

### **MODE 2 — Selling Price → Margin**

*User adjusts Selling Price slider.*

`margin% = (price/cost - 1) × 100`

**Outputs:**

| Metric | OLD | NEW |
|---|---|---|
| Cost | | |
| Price | (Fixed) | (Fixed) |
| Margin% | (Calc) | (Calc) |

---

### **Interpretation & Labeling**

Decision labeled as:

- `SAFE` (margin ≥ 10%)
- `RISKY` (0% ≤ margin < 10%)
- `LOSS` (margin < 0%)

---

## 📱 **Responsive UI Design**

The interface works on:

✔ Mobile  
✔ Tablet  
✔ Desktop  

UI blocks organized as:

1. Product Selector
2. Manufacturing Specs Input
3. Calculate Button
4. Cost Breakdown (OLD vs NEW)
5. Negotiator (Margin/Price modes)
6. Decision/KPI
7. Reset to Default

**Features:**
- No horizontal scrolling needed on mobile.
- Tables stack vertically on small screens.

---

## 🧹 **Reset System**

`Reset to Default`:

✔ restores all excel values  
✔ clears overrides  
✔ hides comparison  
✔ hides negotiator  
✔ keeps category & product selection  

---

## 🔐 **What System Does NOT Do**

- Does not modify Excel
- Does not store selling price
- Does not auto-update DB
- Does not overwrite old cost
- Does not hide cost transparency

---

## 🚀 **Use Cases**

✔ dealership negotiation  
✔ factory costing  
✔ OEM quoting  
✔ product variant feasibility  
✔ spec sensitivity analysis  
✔ margin planning  
✔ market price evaluation  

---

##  **Target Users**

- Manufacturers
- Distributors
- Traders
- Sales teams
- Costing analysts
- Quotation engineers

---

## 🧩 **System Summary (One Line)**

> **OLD** = reference cost (Excel)  
> **NEW** = decision cost (override)  
> **Negotiator** = bridge between cost and price  

---

## 📘 **Mental Model**

> Gauge/Specs → Cost → Margin → Price → Decision → Negotiation

| Specs ↑ | ↓ Price |
|---|---|
| Costing Engine | Margin Solver |

---

# ✔ **END README**