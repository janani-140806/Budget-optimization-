document.addEventListener('DOMContentLoaded', function () {

    // --- DOM refs ---
    const totalBudgetInput  = document.getElementById('totalBudget');
    const budgetError       = document.getElementById('budgetError');
    const currencySelect    = document.getElementById('currencySelect');
    const itemsContainer    = document.getElementById('itemsContainer');
    const addItemBtn        = document.getElementById('addItem');
    const loadSampleBtn     = document.getElementById('loadSample');
    const calculateBtn      = document.getElementById('calculate');
    const resetBtn          = document.getElementById('reset');
    const exportCSVBtn      = document.getElementById('exportCSV');
    const chartTypeSelect   = document.getElementById('chartType');
    const resultsSection    = document.getElementById('results');
    const totalProfitSpan   = document.getElementById('totalProfit');
    const budgetUsedSpan    = document.getElementById('budgetUsed');
    const remainingBudgetSpan = document.getElementById('remainingBudget');
    const budgetProgressFill  = document.getElementById('budgetProgressFill');
    const budgetProgressLabel = document.getElementById('budgetProgressLabel');
    const selectedList      = document.getElementById('selectedList');
    const comparisonBody    = document.getElementById('comparisonBody');
    const profitChartCanvas = document.getElementById('profitChart');
    const darkModeToggle    = document.getElementById('darkModeToggle');
    const historyToggle     = document.getElementById('historyToggle');
    const historyPanel      = document.getElementById('historyPanel');
    const historyList       = document.getElementById('historyList');
    const clearHistoryBtn   = document.getElementById('clearHistory');
    const undoBtn           = document.getElementById('undoBtn');
    const redoBtn           = document.getElementById('redoBtn');
    const tabBtns           = document.querySelectorAll('.tab-btn');

    let chart        = null;
    let selectedItems = [];
    let allItems      = [];
    let undoStack     = [];
    let redoStack     = [];

    // --- Sanitize text to prevent XSS ---
    function sanitize(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // --- Toast ---
    function showToast(message, type = 'info', duration = 3000) {
        const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${sanitize(message)}</span>`;
        document.getElementById('toastContainer').appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // --- Dark mode ---
    if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark-mode');
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        const icon = darkModeToggle.querySelector('i');
        icon.className = document.body.classList.contains('dark-mode') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });

    // --- Tabs ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
            document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
        });
    });

    // --- History toggle ---
    historyToggle.addEventListener('click', () => {
        const visible = historyPanel.style.display !== 'none';
        historyPanel.style.display = visible ? 'none' : 'block';
        if (!visible) renderHistory();
    });

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('budgetHistory');
        renderHistory();
        showToast('History cleared.', 'info');
    });

    // --- Undo / Redo ---
    function saveState() {
        const state = getItemsData(true);
        undoStack.push(JSON.stringify(state));
        redoStack = [];
    }

    undoBtn.addEventListener('click', () => {
        if (undoStack.length === 0) { showToast('Nothing to undo.', 'warning'); return; }
        redoStack.push(JSON.stringify(getItemsData(true)));
        restoreState(JSON.parse(undoStack.pop()));
    });

    redoBtn.addEventListener('click', () => {
        if (redoStack.length === 0) { showToast('Nothing to redo.', 'warning'); return; }
        undoStack.push(JSON.stringify(getItemsData(true)));
        restoreState(JSON.parse(redoStack.pop()));
    });

    function getItemsData(includeEmpty = false) {
        return Array.from(itemsContainer.querySelectorAll('.item')).map(item => ({
            name:   item.querySelector('.item-name').value,
            cost:   item.querySelector('.item-cost').value,
            profit: item.querySelector('.item-profit').value
        })).filter(i => includeEmpty || i.name || i.cost || i.profit);
    }

    function restoreState(items) {
        itemsContainer.innerHTML = '';
        items.forEach(i => addItem(i.name, i.cost, i.profit));
    }

    // --- Add item ---
    addItemBtn.addEventListener('click', () => { saveState(); addItem(); });

    function addItem(name = '', cost = '', profit = '') {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
            <input type="text"   placeholder="Name"   class="item-name"   value="${sanitize(String(name))}">
            <input type="number" placeholder="Cost"   class="item-cost"   min="0" step="0.01" value="${sanitize(String(cost))}">
            <input type="number" placeholder="Profit" class="item-profit" min="0" step="0.01" value="${sanitize(String(profit))}">
            <button class="remove-item"><i class="fa-solid fa-trash"></i></button>
        `;
        itemsContainer.appendChild(div);

        // Clear invalid state on input
        div.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('input', () => inp.classList.remove('invalid'));
        });

        div.querySelector('.remove-item').addEventListener('click', () => {
            saveState();
            div.remove();
        });
    }

    // --- Load sample ---
    loadSampleBtn.addEventListener('click', () => {
        saveState();
        itemsContainer.innerHTML = '';
        [['Stock A', 100, 20], ['Stock B', 50, 15], ['Product C', 200, 50],
         ['Investment D', 75, 25], ['Option E', 150, 30]].forEach(([n, c, p]) => addItem(n, c, p));
        totalBudgetInput.value = 300;
        showToast('Sample data loaded!', 'success');
    });

    // --- Validate ---
    function validateBudget() {
        const val = parseFloat(totalBudgetInput.value);
        if (isNaN(val) || val <= 0) {
            totalBudgetInput.classList.add('invalid');
            budgetError.textContent = 'Enter a valid budget greater than 0.';
            return null;
        }
        totalBudgetInput.classList.remove('invalid');
        budgetError.textContent = '';
        return val;
    }

    function validateItems() {
        const items = [];
        let valid = true;
        itemsContainer.querySelectorAll('.item').forEach(row => {
            const nameInp   = row.querySelector('.item-name');
            const costInp   = row.querySelector('.item-cost');
            const profitInp = row.querySelector('.item-profit');
            const name   = nameInp.value.trim();
            const cost   = parseFloat(costInp.value);
            const profit = parseFloat(profitInp.value);

            if (!name && !costInp.value && !profitInp.value) return; // skip empty rows

            let rowValid = true;
            if (!name)           { nameInp.classList.add('invalid');   rowValid = false; }
            if (isNaN(cost) || cost <= 0)   { costInp.classList.add('invalid');   rowValid = false; }
            if (isNaN(profit) || profit < 0) { profitInp.classList.add('invalid'); rowValid = false; }

            if (rowValid) {
                items.push({ name, cost, profit, ratio: profit / cost });
            } else {
                valid = false;
            }
        });
        return { items, valid };
    }

    // --- Calculate ---
    calculateBtn.addEventListener('click', calculate);

    function calculate() {
        const totalBudget = validateBudget();
        if (totalBudget === null) { showToast('Please enter a valid budget.', 'error'); return; }

        const { items, valid } = validateItems();
        if (!valid) { showToast('Fix the highlighted fields before calculating.', 'error'); return; }
        if (items.length === 0) { showToast('Add at least one valid investment option.', 'warning'); return; }

        allItems = items;
        items.sort((a, b) => b.ratio - a.ratio);

        let totalProfit = 0, budgetUsed = 0;
        const selected = [];

        for (const item of items) {
            if (budgetUsed + item.cost <= totalBudget) {
                totalProfit += item.profit;
                budgetUsed  += item.cost;
                selected.push({ ...item, fraction: 1 });
            } else {
                const fraction = (totalBudget - budgetUsed) / item.cost;
                if (fraction > 0) {
                    totalProfit += fraction * item.profit;
                    budgetUsed  += fraction * item.cost;
                    selected.push({ ...item, fraction });
                }
                break;
            }
        }

        selectedItems = selected;
        const currency = currencySelect.value;
        const remaining = totalBudget - budgetUsed;
        const pct = (budgetUsed / totalBudget) * 100;

        totalProfitSpan.textContent     = `${currency}${totalProfit.toFixed(2)}`;
        budgetUsedSpan.textContent      = `${currency}${budgetUsed.toFixed(2)}`;
        remainingBudgetSpan.textContent = `${currency}${remaining.toFixed(2)}`;
        budgetProgressFill.style.width  = `${Math.min(pct, 100)}%`;
        budgetProgressLabel.textContent = `${pct.toFixed(1)}% used`;

        renderSelectedList(selected, currency);
        renderComparisonTable(items, selected, currency);
        updateChart(selected);

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        saveHistory({ totalBudget, totalProfit, budgetUsed, remaining, selected, currency });
        showToast('Optimization complete!', 'success');
    }

    // --- Render selected list ---
    function renderSelectedList(selected, currency) {
        selectedList.innerHTML = '';
        selected.forEach(item => {
            const li = document.createElement('li');
            const isFull = item.fraction === 1;
            const profitContrib = (item.profit * item.fraction).toFixed(2);
            const costContrib   = (item.cost   * item.fraction).toFixed(2);
            li.innerHTML = `
                <span><strong>${sanitize(item.name)}</strong> &mdash; Cost: ${currency}${costContrib}, Profit: ${currency}${profitContrib}</span>
                <span class="item-badge ${isFull ? 'badge-full' : 'badge-partial'}">${isFull ? '100%' : (item.fraction * 100).toFixed(1) + '%'}</span>
            `;
            selectedList.appendChild(li);
        });
    }

    // --- Render comparison table ---
    function renderComparisonTable(allSorted, selected, currency) {
        const selectedNames = new Set(selected.map(s => s.name));
        comparisonBody.innerHTML = '';
        allSorted.forEach(item => {
            const isSelected = selectedNames.has(item.name);
            const sel = selected.find(s => s.name === item.name);
            const roi = ((item.profit / item.cost) * 100).toFixed(1);
            const roiClass = roi >= 30 ? 'roi-high' : roi >= 15 ? 'roi-mid' : 'roi-low';
            const tr = document.createElement('tr');
            if (isSelected) tr.classList.add('selected-row');
            tr.innerHTML = `
                <td>${sanitize(item.name)}</td>
                <td>${currency}${item.cost.toFixed(2)}</td>
                <td>${currency}${item.profit.toFixed(2)}</td>
                <td><span class="roi-badge ${roiClass}">${roi}%</span></td>
                <td>${isSelected ? '<i class="fa-solid fa-check" style="color:#38a169"></i>' : '<i class="fa-solid fa-xmark" style="color:#e53e3e"></i>'}</td>
                <td>${isSelected && sel ? (sel.fraction * 100).toFixed(1) + '%' : '—'}</td>
            `;
            comparisonBody.appendChild(tr);
        });
    }

    // --- Chart ---
    chartTypeSelect.addEventListener('change', () => { if (selectedItems.length) updateChart(selectedItems); });

    function updateChart(selected) {
        const type = chartTypeSelect.value;
        const colors = ['#667eea','#764ba2','#38b2ac','#ed8936','#e53e3e','#38a169','#3182ce','#d69e2e'];
        const data = {
            labels: selected.map(i => sanitize(i.name)),
            datasets: [{
                label: 'Profit Contribution',
                data: selected.map(i => parseFloat((i.profit * i.fraction).toFixed(2))),
                backgroundColor: type === 'bar' ? colors.map(c => c + 'aa') : colors,
                borderColor: colors,
                borderWidth: 2
            }]
        };
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: type !== 'bar' } }
        };
        if (type === 'bar') options.scales = { y: { beginAtZero: true } };
        if (chart) chart.destroy();
        chart = new Chart(profitChartCanvas, { type, data, options });
    }

    // --- History ---
    function saveHistory(entry) {
        const history = JSON.parse(localStorage.getItem('budgetHistory') || '[]');
        history.unshift({ ...entry, date: new Date().toLocaleString() });
        if (history.length > 20) history.pop();
        localStorage.setItem('budgetHistory', JSON.stringify(history));
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('budgetHistory') || '[]');
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<li style="color:#a0aec0;font-style:italic">No history yet.</li>';
            return;
        }
        history.forEach((entry, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${entry.currency}${entry.totalBudget.toFixed(2)} budget</strong> &rarr; Profit: ${entry.currency}${entry.totalProfit.toFixed(2)}, Used: ${entry.currency}${entry.budgetUsed.toFixed(2)}
                <div class="history-meta">${sanitize(entry.date)} &bull; ${entry.selected.length} item(s) selected</div>
            `;
            historyList.appendChild(li);
        });
    }

    // --- Export CSV ---
    exportCSVBtn.addEventListener('click', () => {
        if (selectedItems.length === 0) { showToast('No results to export. Calculate first.', 'warning'); return; }
        const currency = currencySelect.value;
        let csv = 'Name,Cost,Profit,Fraction,Profit Contribution,ROI %\n';
        selectedItems.forEach(item => {
            const roi = ((item.profit / item.cost) * 100).toFixed(1);
            csv += `"${item.name}",${item.cost},${item.profit},${item.fraction.toFixed(4)},${(item.profit * item.fraction).toFixed(2)},${roi}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'budget_optimization_results.csv';
        a.click();
        URL.revokeObjectURL(url);
        showToast('CSV exported successfully!', 'success');
    });

    // --- Reset ---
    resetBtn.addEventListener('click', () => {
        saveState();
        totalBudgetInput.value = '';
        budgetError.textContent = '';
        totalBudgetInput.classList.remove('invalid');
        itemsContainer.innerHTML = '';
        addItem();
        resultsSection.style.display = 'none';
        selectedItems = [];
        allItems = [];
        if (chart) { chart.destroy(); chart = null; }
        showToast('Reset complete.', 'info');
    });

    // --- Init ---
    addItem();
});
