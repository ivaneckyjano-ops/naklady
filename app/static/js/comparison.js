// ==================== STRÁNKA POROVNANIA ====================

let comparisonChart = null;

document.addEventListener('DOMContentLoaded', function() {
    loadComparisonYears();
    loadComparisonCategories();
    setupComparisonEventListeners();
});

// ==================== NAČÍTANIE ROKOV ====================

async function loadComparisonYears() {
    try {
        const expenses = await apiCall('/expenses');
        const years = new Set();
        
        expenses.forEach(exp => {
            const year = new Date(exp.date).getFullYear();
            years.add(year);
        });
        
        const sortedYears = Array.from(years).sort().reverse();
        
        const select1 = document.getElementById('year1');
        const select2 = document.getElementById('year2');
        
        sortedYears.forEach((year, index) => {
            const option1 = document.createElement('option');
            option1.value = year;
            option1.textContent = year;
            select1.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = year;
            option2.textContent = year;
            select2.appendChild(option2);
        });
        
        // Predvolené hodnoty
        if (sortedYears.length >= 2) {
            select1.value = sortedYears[0];
            select2.value = sortedYears[1];
        } else if (sortedYears.length === 1) {
            select1.value = sortedYears[0];
        }
    } catch (error) {
        console.error('Chyba pri načítaní rokov:', error);
    }
}

// ==================== NAČÍTANIE KATEGÓRIÍ ====================

async function loadComparisonCategories() {
    try {
        const categories = await apiCall('/categories');
        const select = document.getElementById('compCategory');
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = `${cat.icon} ${cat.name}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Chyba pri načítaní kategórií:', error);
    }
}

// ==================== POROVNANIE ====================

async function compareData() {
    try {
        const year1 = document.getElementById('year1').value;
        const year2 = document.getElementById('year2').value;
        const categoryId = document.getElementById('compCategory').value;
        
        if (!year1 || !year2) {
            showAlert('Vyber oba roky na porovnanie', 'warning');
            return;
        }
        
        let endpoint = `/stats/comparison?year1=${year1}&year2=${year2}`;
        if (categoryId) {
            endpoint += `&category_id=${categoryId}`;
        }
        
        const comparison = await apiCall(endpoint);
        
        displayComparisonChart(comparison);
        displayComparisonSummary(comparison);
        displayComparisonDetail(comparison);
    } catch (error) {
        console.error('Chyba pri porovnaní:', error);
        showAlert('Chyba pri porovnaní výdavkov', 'error');
    }
}

// ==================== ZOBRAZENIE POROVNANIA ====================

function displayComparisonChart(comparison) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    const labels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún',
        'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
    ];
    
    const data1 = [];
    const data2 = [];
    
    if (comparison.year1) {
        for (let month = 1; month <= 12; month++) {
            const key = String(month).padStart(2, '0');
            data1.push(comparison.year1.monthly[key] || 0);
        }
    }
    
    if (comparison.year2) {
        for (let month = 1; month <= 12; month++) {
            const key = String(month).padStart(2, '0');
            data2.push(comparison.year2.monthly[key] || 0);
        }
    }
    
    const datasets = [];
    
    if (comparison.year1) {
        datasets.push({
            label: `Rok ${comparison.year1.year} (€)`,
            data: data1,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 2,
            tension: 0.4
        });
    }
    
    if (comparison.year2) {
        datasets.push({
            label: `Rok ${comparison.year2.year} (€)`,
            data: data2,
            borderColor: '#f5576c',
            backgroundColor: 'rgba(245, 87, 108, 0.1)',
            borderWidth: 2,
            tension: 0.4
        });
    }
    
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
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
                    beginAtZero: true
                }
            }
        }
    });
}

function displayComparisonSummary(comparison) {
    const container = document.getElementById('comparisonSummary');
    container.innerHTML = '';
    
    if (comparison.year1) {
        const box = document.createElement('div');
        box.className = 'summary-box';
        const change = comparison.year2 
            ? ((comparison.year2.total - comparison.year1.total) / comparison.year1.total * 100)
            : 0;
        const changeClass = change > 0 ? 'positive' : 'negative';
        
        box.innerHTML = `
            <div class="summary-year">Rok ${comparison.year1.year}</div>
            <div class="summary-total">${formatCurrency(comparison.year1.total)}</div>
            ${comparison.year2 ? `
                <div class="summary-change ${changeClass}">
                    ${change > 0 ? '+' : ''}${change.toFixed(1)}%
                </div>
            ` : ''}
        `;
        container.appendChild(box);
    }
    
    if (comparison.year2) {
        const box = document.createElement('div');
        box.className = 'summary-box year2';
        const change = comparison.year1
            ? ((comparison.year2.total - comparison.year1.total) / comparison.year1.total * 100)
            : 0;
        const changeClass = change > 0 ? 'positive' : 'negative';
        
        box.innerHTML = `
            <div class="summary-year">Rok ${comparison.year2.year}</div>
            <div class="summary-total">${formatCurrency(comparison.year2.total)}</div>
            ${comparison.year1 ? `
                <div class="summary-change ${changeClass}">
                    ${change > 0 ? '+' : ''}${change.toFixed(1)}%
                </div>
            ` : ''}
        `;
        container.appendChild(box);
    }
}

function displayComparisonDetail(comparison) {
    const container = document.getElementById('comparisonDetail');
    container.innerHTML = '';
    
    const labels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún',
        'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
    ];
    
    labels.forEach((month, index) => {
        const monthNum = String(index + 1).padStart(2, '0');
        const value1 = comparison.year1 ? (comparison.year1.monthly[monthNum] || 0) : 0;
        const value2 = comparison.year2 ? (comparison.year2.monthly[monthNum] || 0) : 0;
        const diff = value2 - value1;
        const diffPercent = value1 > 0 ? (diff / value1 * 100) : 0;
        const diffClass = diff > 0 ? 'up' : 'down';
        
        const row = document.createElement('div');
        row.className = 'detail-row';
        row.innerHTML = `
            <div class="detail-month">${month}</div>
            <div class="detail-values">
                ${comparison.year1 ? `
                    <div class="detail-value">
                        <div class="detail-value-label">Rok ${comparison.year1.year}</div>
                        <div class="detail-value-amount">${formatCurrency(value1)}</div>
                    </div>
                ` : ''}
                ${comparison.year2 ? `
                    <div class="detail-value">
                        <div class="detail-value-label">Rok ${comparison.year2.year}</div>
                        <div class="detail-value-amount">${formatCurrency(value2)}</div>
                    </div>
                ` : ''}
            </div>
            ${comparison.year1 && comparison.year2 ? `
                <div class="detail-change ${diffClass}">
                    ${diff > 0 ? '+' : ''}${formatCurrency(diff)}
                </div>
            ` : ''}
        `;
        container.appendChild(row);
    });
}

// ==================== EVENT LISTENERY ====================

function setupComparisonEventListeners() {
    document.getElementById('compareBtn').addEventListener('click', compareData);
    
    // Porovnaj aj pri zmene výberu
    document.getElementById('year1').addEventListener('change', compareData);
    document.getElementById('year2').addEventListener('change', compareData);
    document.getElementById('compCategory').addEventListener('change', compareData);
    
    // Inicializuj porovnanie pri načítaní
    setTimeout(compareData, 500);
}
