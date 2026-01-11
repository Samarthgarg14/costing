document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('costingForm');
    const btnReset = document.getElementById('btn_reset');
    const resultCard = document.getElementById('resultCard');
    const errorBox = document.getElementById('errorBox');

    // Result Elements - Standard
    const standardBreakdown = document.getElementById('standard_breakdown');
    const elMetalWeight = document.getElementById('res_metal_weight');
    const elPvcWeight = document.getElementById('res_pvc_weight');
    const elMetalCost = document.getElementById('res_metal_cost');
    const elPvcCost = document.getElementById('res_pvc_cost');
    const elLabourCost = document.getElementById('res_labour_cost');
    const elMfgCost = document.getElementById('res_mfg_cost');

    // Comparison Elements
    const comparisonTable = document.getElementById('comparison_table');
    const comparisonBody = document.getElementById('comparison_body');

    // Negotiation Elements
    const negTableContainer = document.getElementById('neg_table_container');
    const negTableBody = document.getElementById('neg_table_body');
    const sliderMargin = document.getElementById('slider_margin');
    const sliderPrice = document.getElementById('slider_price');
    const valMargin = document.getElementById('val_margin');
    const valPrice = document.getElementById('val_price');
    const negStatus = document.getElementById('neg_status');
    const negWarnings = document.getElementById('neg_warnings');

    // Category Logic Elements
    const hiddenCategory = document.getElementById('hidden_category');
    const visualCategory = document.getElementById('visual_category');
    const lblMetalRate = document.getElementById('lbl_metal_rate');

    // Master Data Elements
    const masterCatSelect = document.getElementById('master_category_select');
    const masterProdSelect = document.getElementById('master_product_select');

    // STATE
    let currentMfgCost = 0;
    let productsCache = [];
    let currentMasterData = null;
    let negotiationMode = 'margin'; // 'margin' or 'price'

    // --- HELPER: Map Sheet Name to Enum ---
    function mapSheetToCategory(sheetName) {
        if (!sheetName) return '';
        const s = sheetName.toLowerCase();
        if (s.includes('multistrand copper')) return 'multistrand_copper_wire';
        if (s.includes('multistrand aluminium')) return 'multistrand_aluminium_wire';
        if (s.includes('multicore aluminium')) return 'multicore_aluminium_cable';
        if (s.includes('multicore copper')) return 'multicore_copper_cable';
        return 'multicore_copper_cable';
    }

    function updateCategoryUI() {
        const cat = hiddenCategory.value;
        const groupStrands = document.getElementById('group_strands');
        const groupCores = document.getElementById('group_cores');

        if (!cat) {
            visualCategory.textContent = "(Select Sheet Above)";
            return;
        }

        visualCategory.textContent = cat.replace(/_/g, ' ').toUpperCase();

        groupStrands.classList.remove('hidden');
        groupCores.classList.remove('hidden');
        lblMetalRate.textContent = "Copper Rate (₹/Kg)";

        if (cat === 'multicore_copper_cable') {
            lblMetalRate.textContent = "Copper Rate (₹/Kg)";
        }
        else if (cat === 'multistrand_copper_wire') {
            groupCores.classList.add('hidden');
            lblMetalRate.textContent = "Copper Rate (₹/Kg)";
        }
        else if (cat === 'multistrand_aluminium_wire') {
            groupStrands.classList.add('hidden');
            groupCores.classList.add('hidden');
            lblMetalRate.textContent = "Aluminium Rate (₹/Kg)";
        }
        else if (cat === 'multicore_aluminium_cable') {
            groupStrands.classList.add('hidden');
            lblMetalRate.textContent = "Aluminium Rate (₹/Kg)";
        }
    }

    async function loadMasterCategories() {
        try {
            const res = await fetch('/api/master/categories');
            const categories = await res.json();
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                masterCatSelect.appendChild(opt);
            });
        } catch (e) { console.error(e); }
    }

    loadMasterCategories();

    masterCatSelect.addEventListener('change', async (e) => {
        const catName = e.target.value;
        masterProdSelect.innerHTML = '<option value="">-- Select Product --</option>';
        masterProdSelect.disabled = true;
        currentMasterData = null;

        if (catName) {
            const mappedCat = mapSheetToCategory(catName);
            hiddenCategory.value = mappedCat;
            updateCategoryUI();
        } else {
            hiddenCategory.value = "";
            updateCategoryUI();
            return;
        }

        try {
            const res = await fetch(`/api/master/products?category=${encodeURIComponent(catName)}`);
            const products = await res.json();
            productsCache = products;

            products.forEach((prod, index) => {
                const opt = document.createElement('option');
                opt.value = index;
                opt.textContent = prod.product_name || `Product ${index + 1}`;
                masterProdSelect.appendChild(opt);
            });
            masterProdSelect.disabled = false;
        } catch (e) { console.error(e); }
    });

    masterProdSelect.addEventListener('change', (e) => {
        const idx = e.target.value;
        if (idx === "") return;
        const prod = productsCache[idx];
        if (!prod) return;
        populateForm(prod);
    });

    function populateForm(data) {
        currentMasterData = data;
        btnReset.style.display = 'none'; // Hidden initially

        setInputValue('gauge', data.gauge);
        setInputValue('strands', data.strands);
        setInputValue('cores', data.cores);
        setInputValue('length_gaj', data.length_gaj);
        setInputValue('coil_weight_kg', data.coil_weight_kg);
        setInputValue('metal_rate_per_kg', data.metal_rate_per_kg);
        setInputValue('pvc_rate_per_kg', data.pvc_rate_per_kg);

        if (data.labour_type) {
            const lType = data.labour_type.toString().toLowerCase();
            const typeSelect = form.querySelector('[name="labour_type"]');
            if (lType.includes('percent')) typeSelect.value = 'percentage';
            else if (lType.includes('kg')) typeSelect.value = 'per_kg';
        } else {
            form.querySelector('[name="labour_type"]').value = 'per_kg';
        }

        setInputValue('labour_value', data.labour_value || 0);
        form.dispatchEvent(new Event('submit'));
    }

    function setInputValue(name, value) {
        const input = form.querySelector(`[name="${name}"]`);
        if (input && value !== undefined && value !== null) input.value = value;
    }

    btnReset.addEventListener('click', () => {
        if (currentMasterData) {
            negotiationMode = 'margin'; // Reset mode
            populateForm(currentMasterData);
        }
    });

    function checkIsOverride(formData) {
        if (!currentMasterData) return false;
        const keys = ['gauge', 'length_gaj', 'coil_weight_kg', 'metal_rate_per_kg', 'pvc_rate_per_kg', 'labour_value'];
        const cat = hiddenCategory.value;
        if (!cat.includes('aluminium')) keys.push('strands');
        if (!cat.includes('multistrand')) keys.push('cores');

        for (const key of keys) {
            let formVal = parseFloat(formData.get(key));
            let masterVal = parseFloat(currentMasterData[key]);
            if (isNaN(formVal)) formVal = 0;
            if (isNaN(masterVal)) masterVal = 0;
            if (Math.abs(formVal - masterVal) > 0.001) return true;
        }
        return false;
    }

    function getOldLaborCost(masterData) {
        if (masterData.labour_cost && masterData.labour_cost > 0) return masterData.labour_cost;
        const lValue = masterData.labour_value || 0;
        const lType = (masterData.labour_type || '').toString().toLowerCase();

        if (lType.includes('percent')) {
            const matCost = (masterData.metal_cost || 0) + (masterData.pvc_cost || 0);
            return (matCost * lValue) / 100;
        } else {
            return (masterData.metal_weight_kg || 0) * lValue;
        }
    }

    // --- COSTING LOGIC ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {};
        const cat = hiddenCategory.value;
        if (!cat) { alert("Please select a Master Excel Sheet first."); return; }

        const validKeys = ['category', 'gauge', 'strands', 'cores', 'length_gaj', 'coil_weight_kg', 'metal_rate_per_kg', 'pvc_rate_per_kg', 'labour_type', 'labour_value'];
        formData.forEach((value, key) => {
            if (validKeys.includes(key)) {
                data[key] = (!isNaN(value) && value !== '') ? parseFloat(value) : value;
            }
        });

        if (cat === 'multistrand_copper_wire') data.cores = 1;
        if (cat.includes('aluminium')) data.strands = 7;
        if (cat === 'multistrand_aluminium_wire') data.cores = 1;

        errorBox.style.display = 'none';
        resultCard.style.opacity = '0.5';

        try {
            const res = await fetch('/api/calculate-cost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (!res.ok) {
                errorBox.style.display = 'block';
                errorBox.innerText = result.error || "Error";
                resultCard.style.pointerEvents = 'none';
                return;
            }

            resultCard.style.opacity = '1';
            resultCard.style.pointerEvents = 'auto';
            currentMfgCost = result.manufacturing_cost;

            const isOverride = checkIsOverride(formData);

            if (isOverride && currentMasterData) {
                btnReset.style.display = 'block';
                standardBreakdown.style.display = 'none';
                comparisonTable.style.display = 'block';
                negTableContainer.style.display = 'block';

                const oldData = { ...currentMasterData };
                oldData.labour_cost = getOldLaborCost(oldData);
                if (!oldData.manufacturing_cost || oldData.manufacturing_cost === 0) {
                    oldData.manufacturing_cost = (oldData.metal_cost || 0) + (oldData.pvc_cost || 0) + oldData.labour_cost;
                }

                renderComparisonTable(oldData, result);

                // Set default mode margin 10% on fresh calculate, or preserve?
                // "If user changes ... system enters Mode". On fresh calc, default Margin Mode.
                negotiationMode = 'margin';
                updateNegotiation(); // Updates with current slider values (resets visuals)

            } else {
                btnReset.style.display = 'none';
                comparisonTable.style.display = 'none';
                negTableContainer.style.display = 'none';
                standardBreakdown.style.display = 'block';

                elMetalWeight.textContent = result.metal_weight_kg.toFixed(4) + ' kg';
                elPvcWeight.textContent = result.pvc_weight_kg.toFixed(4) + ' kg';
                elMetalCost.textContent = '₹ ' + result.metal_cost.toFixed(2);
                elPvcCost.textContent = '₹ ' + result.pvc_cost.toFixed(2);
                elLabourCost.textContent = '₹ ' + result.labour_cost.toFixed(2);
                elMfgCost.textContent = '₹ ' + result.manufacturing_cost.toFixed(2);

                // Standard single mode negotiation
                negotiationMode = 'margin';
                updateNegotiation();
            }

        } catch (err) {
            console.error(err);
            errorBox.style.display = 'block';
            errorBox.innerText = "Network Error";
        }
    });

    function renderComparisonTable(oldData, newData) {
        comparisonBody.innerHTML = '';

        const rows = [
            { label: 'Metal Weight', old: oldData.metal_weight_kg, new: newData.metal_weight_kg, unit: 'kg' },
            { label: 'PVC Weight', old: oldData.pvc_weight_kg, new: newData.pvc_weight_kg, unit: 'kg' },
            { label: 'Metal Cost', old: oldData.metal_cost, new: newData.metal_cost, unit: '₹', isCurrency: true, isBadUp: true },
            { label: 'PVC Cost', old: oldData.pvc_cost, new: newData.pvc_cost, unit: '₹', isCurrency: true, isBadUp: true },
            { label: 'Labour', old: oldData.labour_cost, new: newData.labour_cost, unit: '₹', isCurrency: true, isBadUp: true },
            { label: 'Mfg Cost', old: oldData.manufacturing_cost, new: newData.manufacturing_cost, unit: '₹', isCurrency: true, isBold: true, isBadUp: true }
        ];

        rows.forEach((r, idx) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #334155';

            // Highlight Mfg Cost (Last Row)
            if (idx === rows.length - 1) {
                tr.style.borderTop = '2px solid var(--border-color)';
                tr.style.fontSize = '1.1em';
                tr.style.backgroundColor = 'rgba(255,255,255,0.02)';
            }

            const valOld = parseFloat(r.old || 0);
            const valNew = parseFloat(r.new || 0);
            const delta = valNew - valOld;

            const fmt = (v) => r.isCurrency ? '₹ ' + v.toFixed(2) : v.toFixed(4) + ' ' + r.unit;

            let deltaColor = 'var(--text-secondary)';
            if (Math.abs(delta) > 0.0001) {
                if (r.isBadUp) {
                    deltaColor = delta > 0 ? '#ef4444' : '#22c55e';
                } else {
                    if (!r.isCurrency) deltaColor = '#94a3b8';
                }
            }

            tr.innerHTML = `
                <td style="padding: 0.5rem; color: var(--text-secondary); ${r.isBold ? 'font-weight: 700; color: var(--text-primary);' : ''}">${r.label}</td>
                <td style="padding: 0.5rem;">${fmt(valOld)}</td>
                <td style="padding: 0.5rem; font-weight: 600; color: var(--accent-blue);">
                    ${fmt(valNew)} 
                    <span style="font-size: 0.8em; color: ${deltaColor}; margin-left: 5px;">
                        (${delta > 0 ? '+' : ''}${r.isCurrency ? delta.toFixed(2) : delta.toFixed(4)})
                    </span>
                </td>
            `;
            comparisonBody.appendChild(tr);
        });
    }

    // --- NEGOTIATION LOGIC (DUAL MODE) ---
    async function updateNegotiation() {
        if (!currentMfgCost) return;

        // Get Inputs
        const marginVal = parseFloat(sliderMargin.value);
        const priceVal = parseFloat(sliderPrice.value);

        // Determine Old Cost
        let oldCost = 0;
        if (currentMasterData) {
            oldCost = currentMasterData.manufacturing_cost;
            if (!oldCost || oldCost === 0) {
                oldCost = (currentMasterData.metal_cost || 0) + (currentMasterData.pvc_cost || 0) + getOldLaborCost(currentMasterData);
            }
        }

        let reqNew = {};
        let reqOld = {};

        // MODE 1: MARGIN Driven
        if (negotiationMode === 'margin') {
            reqNew = { manufacturing_cost: currentMfgCost, target_margin_percent: marginVal };
            if (oldCost > 0) reqOld = { manufacturing_cost: oldCost, target_margin_percent: marginVal };
        }
        // MODE 2: PRICE Driven
        else {
            reqNew = { manufacturing_cost: currentMfgCost, target_selling_price: priceVal };
            if (oldCost > 0) reqOld = { manufacturing_cost: oldCost, target_selling_price: priceVal };
        }

        try {
            // Call API for New (active)
            const resNew = await fetch('/api/negotiate', {
                method: 'POST', body: JSON.stringify(reqNew), headers: { 'Content-Type': 'application/json' }
            }).then(r => r.json());

            // Call API for Old (baseline) - only if comparison
            let resOld = null;
            if (oldCost > 0 && negTableContainer.style.display !== 'none') {
                resOld = await fetch('/api/negotiate', {
                    method: 'POST', body: JSON.stringify(reqOld), headers: { 'Content-Type': 'application/json' }
                }).then(r => r.json());
            }

            if (resNew.error) return;

            // Update UI State (without triggering events)
            valMargin.textContent = resNew.margin_percent.toFixed(2) + '%';
            valPrice.textContent = '₹ ' + resNew.selling_price.toFixed(2);

            // Only update the OTHER slider to avoid fighting the user
            if (negotiationMode === 'margin') {
                sliderPrice.value = resNew.selling_price;
            } else {
                sliderMargin.value = resNew.margin_percent;
            }

            negStatus.className = 'status-badge status-' + resNew.status;
            negStatus.textContent = resNew.status;

            if (resNew.warnings && resNew.warnings.length > 0) {
                negWarnings.style.display = 'block';
                negWarnings.innerHTML = resNew.warnings.join('<br>');
            } else { negWarnings.style.display = 'none'; }

            // Render Summary Table
            if (resOld) {
                renderNegTable(resOld, resNew);
            }

        } catch (err) { console.error(err); }
    }

    // Sliders
    sliderMargin.addEventListener('input', () => {
        negotiationMode = 'margin';
        valMargin.textContent = parseFloat(sliderMargin.value).toFixed(2) + '%';
        updateNegotiation();
    });

    sliderPrice.addEventListener('input', () => {
        negotiationMode = 'price';
        valPrice.textContent = '₹ ' + parseFloat(sliderPrice.value).toFixed(2);
        updateNegotiation();
    });

    function renderNegTable(oldRes, newRes) {
        negTableBody.innerHTML = '';

        // Rows: Mfg Cost, Selling Price, Margin
        const rows = [
            { label: 'Mfg Cost', old: oldRes.manufacturing_cost, new: newRes.manufacturing_cost, badUp: true, isCurr: true },
            { label: 'Selling Price', old: oldRes.selling_price, new: newRes.selling_price, badUp: false, isCurr: true },
            { label: 'Margin %', old: oldRes.margin_percent, new: newRes.margin_percent, badUp: false, suffix: '%' }
        ];

        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #334155';

            const delta = r.new - r.old;
            let color = 'var(--text-secondary)';

            // Simple Threshold for coloring
            if (Math.abs(delta) > 0.01) {
                if (r.badUp) color = delta > 0 ? '#ef4444' : '#22c55e';
                else color = delta > 0 ? '#22c55e' : '#ef4444';
            }
            // If values are functionally same (due to mode), Gray it out
            if (Math.abs(delta) < 0.01) {
                color = 'var(--text-secondary)';
            }

            const fmt = (v) => r.suffix ? v.toFixed(2) + '%' : '₹ ' + v.toFixed(2);

            tr.innerHTML = `
                <td style="padding: 0.5rem; color: var(--text-secondary);">${r.label}</td>
                <td style="padding: 0.5rem;">${fmt(r.old)}</td>
                <td style="padding: 0.5rem; color: var(--accent-blue); font-weight: 600;">
                     ${fmt(r.new)}
                     <span style="font-size: 0.8em; color: ${color}; margin-left: 5px;">
                        (${delta > 0 ? '+' : ''}${Math.abs(delta) < 0.01 ? '-' : delta.toFixed(2)})
                     </span>
                </td>
            `;
            negTableBody.appendChild(tr);
        });
    }

});
