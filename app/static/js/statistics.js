// ==================== STRÁNKA ŠTATISTIKY ====================

const MONTH_LABELS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún',
    'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
];

/** Poradie oblastí vo výpise štatistiky; ostatné abecedne za nimi. */
const AREA_STATS_ORDER = ['Nevyhnutné potreby', 'Chcenia', 'Investície', 'Rezerva', 'Nezaradené'];

let monthlyChart = null;

function sortAreaStatsEntries(entries) {
    return [...entries].sort((a, b) => {
        const na = (a[1] && a[1].name) ? a[1].name : String(a[0]);
        const nb = (b[1] && b[1].name) ? b[1].name : String(b[0]);
        const ia = AREA_STATS_ORDER.indexOf(na);
        const ib = AREA_STATS_ORDER.indexOf(nb);
        const ra = ia === -1 ? AREA_STATS_ORDER.length : ia;
        const rb = ib === -1 ? AREA_STATS_ORDER.length : ib;
        if (ra !== rb) return ra - rb;
        return na.localeCompare(nb, 'sk');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadYearSelect();
    addGroupingControl();
    loadStatistics();
    setupStatisticsEventListeners();
});

function addGroupingControl() {
    const container = document.querySelector('.stats-controls');
    if (!container) return;

    const label = document.createElement('label');
    label.htmlFor = 'groupBy';
    label.textContent = 'Zobraziť:';
    const select = document.createElement('select');
    select.id = 'groupBy';
    const opt1 = document.createElement('option');
    opt1.value = 'category';
    opt1.textContent = 'Podľa kategórií';
    const opt2 = document.createElement('option');
    opt2.value = 'subcategory';
    opt2.textContent = 'Podľa podkategórií';
    const opt3 = document.createElement('option');
    opt3.value = 'area';
    opt3.textContent = 'Podľa oblastí';
    select.appendChild(opt1);
    select.appendChild(opt2);
    select.appendChild(opt3);

    container.appendChild(label);
    container.appendChild(select);

    select.addEventListener('change', loadStatistics);
}

// ==================== NAČÍTANIE ROKOV ====================

async function loadYearSelect() {
    try {
        const [expenses, incomes] = await Promise.all([
            apiCall('/expenses'),
            apiCall('/incomes')
        ]);
        const years = new Set();
        
        expenses.forEach(exp => {
            const year = new Date(exp.date).getFullYear();
            years.add(year);
        });
        incomes.forEach(inc => {
            const year = new Date(inc.date).getFullYear();
            years.add(year);
        });
        
        const select = document.getElementById('statYear');
        const sortedYears = Array.from(years).sort().reverse();
        
        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        });
        
        // Predvolené - aktuálny rok
        if (sortedYears.length > 0) {
            select.value = sortedYears[0];
        }
    } catch (error) {
        console.error('Chyba pri načítaní rokov:', error);
    }
}

// ==================== NAČÍTANIE ŠTATISTIKY ====================

async function loadStatistics() {
    try {
        const year = document.getElementById('statYear').value;
        const groupBy = document.getElementById('groupBy') ? document.getElementById('groupBy').value : 'category';
        
        const endpoint = year ? `/stats/yearly?year=${year}` : '/stats/yearly';
        const stats = await apiCall(endpoint);
        
        displaySummaryStats(stats);
        displayAreaIncomeSummary(groupBy === 'area' ? (stats.by_area || {}) : {}, stats.income_total || 0);
        // choose which set to display based on control
        if (groupBy === 'subcategory') {
            displayCategoryStats(stats.by_subcategory, stats.total);
            displayDetailedStats(stats.by_subcategory);
        } else if (groupBy === 'area') {
            const byArea = stats.by_area || {};
            displayCategoryStats(byArea, stats.income_total || 0, 'area');
            displayDetailedStats(byArea, 'area');
        } else {
            displayCategoryStats(stats.by_category, stats.total);
            displayDetailedStats(stats.by_category);
        }
        displayMonthlyChart(stats.monthly_totals);
        await loadMonthlyCategoryStats(groupBy);
    } catch (error) {
        console.error('Chyba pri načítaní štatistiky:', error);
        showAlert('Chyba pri načítaní štatistiky', 'error');
    }
}

// ==================== ZOBRAZENIE ŠTATISTIKY ====================

function displaySummaryStats(stats) {
    const currentYear = new Date().getFullYear();
    const year = document.getElementById('statYear').value || currentYear;
    
    // Celkové výdavky
    document.getElementById('totalExpenses').textContent = formatCurrency(stats.total);
    const totalIncomeEl = document.getElementById('totalIncome');
    if (totalIncomeEl) {
        totalIncomeEl.textContent = formatCurrency(stats.income_total || 0);
    }
    
    // Počet transakcií
    let count = 0;
    Object.values(stats.by_category).forEach(cat => {
        count += cat.count || 0;
    });
    document.getElementById('expenseCount').textContent = count;
    
    // Priemer na mesiac
    const avg = stats.total / 12;
    document.getElementById('monthlyAverage').textContent = formatCurrency(avg);
}

function displayCategoryStats(categories, overallTotal = 0, sortMode = null) {
    const container = document.getElementById('categoryStats');
    container.innerHTML = '';

    let entries = Object.entries(categories);
    if (sortMode === 'area') {
        entries = sortAreaStatsEntries(entries);
    }

    entries.forEach(([key, data]) => {
        const displayName = data && data.name ? data.name : key;
        const icon = data && data.icon ? data.icon : '';
        const total = data && data.total ? data.total : 0;
        const count = data && data.count ? data.count : 0;
        const percent = overallTotal ? Math.round((total / overallTotal) * 100) : 0;
        const incomeTotal = data && data.income_total ? data.income_total : overallTotal;

        const item = document.createElement('div');
        item.className = 'category-stat-item';
        item.innerHTML = `
            <div class="category-icon">${icon}</div>
            <div class="category-name">${displayName}${count ? ` <span class="cat-count">(${count})</span>` : ''}</div>
            <div class="category-amount">${formatCurrency(total)}</div>
            ${sortMode === 'area' ? `<div class="cat-count">Príjem: ${formatCurrency(incomeTotal || 0)} · ${percent}% z príjmu</div>` : ''}
            <div class="category-bar"><div class="category-bar-fill" style="width:${percent}%"></div></div>
        `;
        container.appendChild(item);
    });
}

function displayMonthlyChart(monthlyData) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    const data = [];
    for (let month = 1; month <= 12; month++) {
        const key = String(month).padStart(2, '0');
        data.push(monthlyData[key] || 0);
    }
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: MONTH_LABELS,
            datasets: [{
                label: 'Výdavky (€)',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Suma (€)'
                    }
                }
            }
        }
    });
}

function displayDetailedStats(categories, sortMode = null) {
    const container = document.getElementById('detailedStats');
    container.innerHTML = '';

    let sorted = Object.entries(categories);
    if (sortMode === 'area') {
        sorted = sortAreaStatsEntries(sorted);
    } else {
        sorted = sorted.sort((a, b) => (b[1].total || 0) - (a[1].total || 0));
    }

    sorted.forEach(([key, data]) => {
        const name = data && data.name ? `${data.icon || ''} ${data.name}` : key;
        const count = data && data.count ? data.count : 0;
        const total = data && data.total ? data.total : 0;
        const incomeTotal = data && data.income_total ? data.income_total : 0;
        const percentIncome = incomeTotal ? Math.round((total / incomeTotal) * 100) : 0;

        const row = document.createElement('div');
        row.className = 'detailed-stat-row';
        row.innerHTML = `
            <div class="detailed-stat-left">
                <div class="detailed-stat-name">${name}</div>
                <div class="detailed-stat-count">${count} transakcií</div>
            </div>
            <div class="detailed-stat-amount ${total < 0 ? 'is-refund' : ''}">
                ${formatCurrency(total)}
                ${sortMode === 'area' ? `<div class="detailed-stat-count">${percentIncome}% z príjmu</div>` : ''}
            </div>
        `;
        container.appendChild(row);
    });
}

function displayAreaIncomeSummary(areas, incomeTotal) {
    const container = document.getElementById('areaIncomeSummary');
    if (!container) return;

    if (!areas || !Object.keys(areas).length) {
        container.innerHTML = '<p class="text-muted">Vyber „Podľa oblastí“, aby si videl porovnanie výdavkov s príjmom.</p>';
        return;
    }

    const sorted = Object.entries(areas).sort((a, b) => (b[1].total || 0) - (a[1].total || 0));
    const table = document.createElement('table');
    table.className = 'area-income-table';

    table.innerHTML = `
        <thead>
            <tr>
                <th>Oblasť</th>
                <th>Výdavky</th>
                <th>Príjem</th>
                <th>% z príjmu</th>
            </tr>
        </thead>
    `;

    const tbody = document.createElement('tbody');
    sorted.forEach(([key, area]) => {
        const expense = area.total || 0;
        const percent = incomeTotal ? Math.round((expense / incomeTotal) * 100) : 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${area.icon || ''} ${area.name || key}</td>
            <td>${formatCurrency(expense)}</td>
            <td>${formatCurrency(incomeTotal || 0)}</td>
            <td>${percent}%</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    const tfoot = document.createElement('tfoot');
    const totalExpenses = sorted.reduce((sum, [, area]) => sum + (area.total || 0), 0);
    const totalPercent = incomeTotal ? Math.round((totalExpenses / incomeTotal) * 100) : 0;
    tfoot.innerHTML = `
        <tr>
            <td>Spolu</td>
            <td>${formatCurrency(totalExpenses)}</td>
            <td>${formatCurrency(incomeTotal || 0)}</td>
            <td>${totalPercent}%</td>
        </tr>
    `;
    table.appendChild(tfoot);

    container.innerHTML = '';
    container.appendChild(table);
}

// ==================== EVENT LISTENERY ====================

function setupStatisticsEventListeners() {
    document.getElementById('statYear').addEventListener('change', loadStatistics);
}

// ==================== MESAČNÝ PREHĽAD KATEGÓRIÍ ====================

function renderMonthlyAreaTableBody(container, data, areas) {
    const months = data.months || MONTH_LABELS.map((_, idx) => String(idx + 1).padStart(2, '0'));
    const monthLabels = months.map(month => MONTH_LABELS[parseInt(month, 10) - 1] || month);

    const sortedAreas = [...areas].sort((a, b) => {
        const ia = AREA_STATS_ORDER.indexOf(a.name);
        const ib = AREA_STATS_ORDER.indexOf(b.name);
        const ra = ia === -1 ? AREA_STATS_ORDER.length : ia;
        const rb = ib === -1 ? AREA_STATS_ORDER.length : ib;
        if (ra !== rb) return ra - rb;
        return (a.name || '').localeCompare(b.name || '', 'sk');
    });

    const table = document.createElement('table');
    table.className = 'category-monthly-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    let headHtml = '<th>Oblasť</th>';
    monthLabels.forEach(label => {
        headHtml += `<th>${label}</th>`;
    });
    headHtml += '<th>Spolu</th>';
    headRow.innerHTML = headHtml;
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    sortedAreas.forEach(area => {
        const row = document.createElement('tr');
        let rowHtml = `<td>${area.icon || ''} ${area.name || ''}</td>`;
        months.forEach(month => {
            const value = area.monthly ? area.monthly[month] : 0;
            rowHtml += `<td>${value ? formatCurrency(value) : '—'}</td>`;
        });
        rowHtml += `<td>${formatCurrency(area.total || 0)}</td>`;
        row.innerHTML = rowHtml;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    const tfoot = document.createElement('tfoot');
    const totalRow = document.createElement('tr');
    let totalHtml = '<td>Spolu</td>';
    months.forEach(month => {
        const sumM = sortedAreas.reduce((s, a) => s + ((a.monthly && a.monthly[month]) || 0), 0);
        totalHtml += `<td>${sumM ? formatCurrency(sumM) : '—'}</td>`;
    });
    const overallTotal = sortedAreas.reduce((s, a) => s + (a.total || 0), 0);
    totalHtml += `<td>${formatCurrency(overallTotal)}</td>`;
    totalRow.innerHTML = totalHtml;
    tfoot.appendChild(totalRow);
    table.appendChild(tfoot);

    container.appendChild(table);

    const note = document.createElement('p');
    note.className = 'text-muted';
    note.style.marginTop = '0.5rem';
    note.style.fontSize = '0.9rem';
    note.textContent = 'V tomto zobrazení riadok Spolu zodpovedá súčtu všetkých výdavkov v danom mesiaci (vrátane položiek zaradených do „Bločky bez kategorie“).';
    container.appendChild(note);
}

async function loadMonthlyCategoryStats(groupBy = 'category') {
    const container = document.getElementById('categoryMonthlyContainer');
    if (!container) return;

    try {
        const year = document.getElementById('statYear').value;
        const endpoint = year ? `/stats/monthly-category?year=${year}` : '/stats/monthly-category';
        const data = await apiCall(endpoint);
        renderMonthlyCategoryTable(data, groupBy);
    } catch (error) {
        console.error('Chyba pri načítaní mesačného prehľadu kategórií:', error);
        container.innerHTML = '<p class="text-muted">Nepodarilo sa načítať dáta.</p>';
    }
}

function renderMonthlyCategoryTable(data, groupBy = 'category') {
    const container = document.getElementById('categoryMonthlyContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!data) {
        container.innerHTML = '<p class="text-muted">Pre zvolené obdobie nie sú dostupné žiadne dáta.</p>';
        return;
    }

    if (groupBy === 'area') {
        const areas = data.areas || [];
        if (areas.length === 0) {
            container.innerHTML = '<p class="text-muted">Pre zvolené obdobie nie sú dostupné žiadne dáta.</p>';
            return;
        }
        renderMonthlyAreaTableBody(container, data, areas);
        return;
    }

    if (!Array.isArray(data.categories) || data.categories.length === 0) {
        container.innerHTML = '<p class="text-muted">Pre zvolené obdobie nie sú dostupné žiadne dáta.</p>';
        return;
    }

    const months = data.months || MONTH_LABELS.map((_, idx) => String(idx + 1).padStart(2, '0'));
    const monthLabels = months.map(month => MONTH_LABELS[parseInt(month, 10) - 1] || month);

    const table = document.createElement('table');
    table.className = 'category-monthly-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    let headHtml = '<th>Kategória</th>';
    monthLabels.forEach(label => {
        headHtml += `<th>${label}</th>`;
    });
    headHtml += '<th>Spolu</th>';
    headRow.innerHTML = headHtml;
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    // Build maps: parents and subcategories
    const parents = {}; // id -> {id,name,icon,monthly,total}
    const subsByParent = {}; // parent_id -> [subcat...]

    data.categories.forEach(cat => {
        const parent_id = cat.parent_id || null;
        if (!parent_id) {
            parents[cat.id] = {
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                monthly: cat.monthly || { ...Object.fromEntries(months.map(m => [m,0])) },
                total: cat.total || 0
            };
        } else {
            subsByParent[parent_id] = subsByParent[parent_id] || [];
            subsByParent[parent_id].push({
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                monthly: cat.monthly || { ...Object.fromEntries(months.map(m => [m,0])) },
                total: cat.total || 0
            });
        }
    });

    // If grouping by subcategory, show flat list of all subcategories + any top-level that have direct expenses
    if (groupBy === 'subcategory') {
        const allCats = [];
        // include parents too (they may have totals if direct expenses exist)
        Object.values(parents).forEach(p => allCats.push(p));
        Object.values(subsByParent).forEach(list => list.forEach(s => allCats.push(s)));
        const sorted = allCats.sort((a,b) => (b.total||0)-(a.total||0));
        sorted.forEach(cat => {
            const row = document.createElement('tr');
            let rowHtml = `<td>${cat.icon||''} ${cat.name}</td>`;
            months.forEach(month => {
                const value = cat.monthly ? cat.monthly[month] : 0;
                rowHtml += `<td>${value ? formatCurrency(value) : '—'}</td>`;
            });
            rowHtml += `<td>${formatCurrency(cat.total || 0)}</td>`;
            row.innerHTML = rowHtml;
            tbody.appendChild(row);
        });
    } else {
        // Grouping by top-level categories: show parents with expand toggles for subcategories
        const sortedParents = Object.values(parents).sort((a,b) => (b.total||0)-(a.total||0));
        sortedParents.forEach(parent => {
            const row = document.createElement('tr');
            row.className = 'parent-row';
            // Add toggle button if has subcategories
            const hasSubs = Array.isArray(subsByParent[parent.id]) && subsByParent[parent.id].length > 0;
            const toggleHtml = hasSubs ? `<button class="toggle-subs" data-parent="${parent.id}" aria-expanded="false" aria-controls="subs-${parent.id}" title="Zobraziť/vybrať podkategórie">▶</button>` : '';
            let rowHtml = `<td>${toggleHtml}${parent.icon || ''} ${parent.name}</td>`;
            months.forEach(month => {
                const value = parent.monthly ? parent.monthly[month] : 0;
                rowHtml += `<td>${value ? formatCurrency(value) : '—'}</td>`;
            });
            rowHtml += `<td>${formatCurrency(parent.total || 0)}</td>`;
            row.innerHTML = rowHtml;
            tbody.appendChild(row);

            // Append hidden subcategory rows
            const subs = subsByParent[parent.id] || [];
            subs.sort((a,b) => (b.total||0)-(a.total||0)).forEach(sub => {
                const subRow = document.createElement('tr');
                subRow.className = `sub-row parent-${parent.id}`;
                subRow.id = `subs-${parent.id}`;
                subRow.style.display = 'none';
                let subHtml = `<td style="padding-left: 2rem;">${sub.icon||''} ${sub.name}</td>`;
                months.forEach(month => {
                    const value = sub.monthly ? sub.monthly[month] : 0;
                    subHtml += `<td>${value ? formatCurrency(value) : '—'}</td>`;
                });
                subHtml += `<td>${formatCurrency(sub.total || 0)}</td>`;
                subRow.innerHTML = subHtml;
                tbody.appendChild(subRow);
            });
        });
    }

    table.appendChild(tbody);

    const tfoot = document.createElement('tfoot');
    const totalRow = document.createElement('tr');
    // Add a small note next to the label to clarify that "Bločky bez kategorie" are excluded from the totals
    let totalHtml = '<td>Spolu <span class="spolu-note">(bez Bločky bez kategorie) <span class="spolu-info" title="Bločky bez kategorie sú zobrazené samostatne a nie sú zahrnuté do riadku Spolu.">ℹ️</span></span></td>';
    months.forEach(month => {
        const value = data.monthly_totals ? data.monthly_totals[month] || 0 : 0;
        totalHtml += `<td>${value ? formatCurrency(value) : '—'}</td>`;
    });
    const overallTotal = Object.values(data.monthly_totals || {}).reduce((sum, value) => sum + (value || 0), 0);
    totalHtml += `<td>${formatCurrency(overallTotal)}</td>`;
    totalRow.innerHTML = totalHtml;
    tfoot.appendChild(totalRow);
    table.appendChild(tfoot);

    container.appendChild(table);

    // Explanatory note under the table for clarity
    const note = document.createElement('p');
    note.className = 'text-muted';
    note.style.marginTop = '0.5rem';
    note.style.fontSize = '0.9rem';
    note.textContent = 'Poznámka: "Bločky bez kategorie" sú zobrazené samostatne a nie sú zahrnuté do riadku Spolu.';
    container.appendChild(note);

    // Bind toggle events
    document.querySelectorAll('.toggle-subs').forEach(btn => {
        btn.addEventListener('click', () => {
            const parentId = btn.getAttribute('data-parent');
            const rows = document.querySelectorAll(`.sub-row.parent-${parentId}`);
            const visible = rows.length && rows[0].style.display !== 'none';
            rows.forEach(r => r.style.display = visible ? 'none' : 'table-row');
            // toggle aria-expanded and visual state
            btn.setAttribute('aria-expanded', visible ? 'false' : 'true');
            btn.classList.toggle('open', !visible);
            btn.textContent = visible ? '▶' : '▼';
        });
    });
}
