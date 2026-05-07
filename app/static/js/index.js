// ==================== DOMOVSKÁ STRÁNKA ====================

let allCategories = [];
let mainCategories = [];

const AREA_CUSTOM_VALUE = '__custom__';
const SUGGESTED_CATEGORY_AREAS = [
    { value: '', label: 'Nezaradené' },
    { value: 'Nevyhnutné potreby', label: 'Nevyhnutné potreby' },
    { value: 'Chcenia', label: 'Chcenia' },
    { value: 'Investície', label: 'Investície' },
    { value: 'Rezerva', label: 'Rezerva' },
    { value: AREA_CUSTOM_VALUE, label: 'Vlastná oblasť…' },
];

function predefinedAreaValues() {
    return new Set(SUGGESTED_CATEGORY_AREAS.filter(o => o.value && o.value !== AREA_CUSTOM_VALUE).map(o => o.value));
}

/** Naplní select oblasťami; currentValue môže byť vlastný text z DB. */
function fillAreaSelect(selectEl, currentValue) {
    const predefined = predefinedAreaValues();
    const raw = (currentValue || '').trim();
    selectEl.innerHTML = '';
    SUGGESTED_CATEGORY_AREAS.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        selectEl.appendChild(opt);
    });
    if (raw && !predefined.has(raw)) {
        const opt = document.createElement('option');
        opt.value = raw;
        opt.textContent = `${raw} (uložená)`;
        const customOpt = selectEl.querySelector(`option[value="${AREA_CUSTOM_VALUE}"]`);
        selectEl.insertBefore(opt, customOpt);
    }
    const values = [...selectEl.options].map(o => o.value);
    if (!raw) {
        selectEl.value = '';
    } else if (values.includes(raw)) {
        selectEl.value = raw;
    } else {
        selectEl.value = AREA_CUSTOM_VALUE;
        const wrapId = selectEl.id === 'subcatArea' ? 'subcatAreaCustomWrap' :
            selectEl.id === 'areaEditSelect' ? 'areaEditCustomWrap' : 'catAreaCustomWrap';
        const inputId = selectEl.id === 'subcatArea' ? 'subcatAreaCustom' :
            selectEl.id === 'areaEditSelect' ? 'areaEditCustom' : 'catAreaCustom';
        const wrap = document.getElementById(wrapId);
        const input = document.getElementById(inputId);
        if (wrap && input) {
            wrap.style.display = 'block';
            input.value = raw;
        }
    }
}

function toggleAreaCustomVisibility(selectEl) {
    const isCat = selectEl.id === 'catArea';
    const isSub = selectEl.id === 'subcatArea';
    const isEdit = selectEl.id === 'areaEditSelect';
    const wrap = document.getElementById(isCat ? 'catAreaCustomWrap' : isSub ? 'subcatAreaCustomWrap' : 'areaEditCustomWrap');
    const customInput = document.getElementById(isCat ? 'catAreaCustom' : isSub ? 'subcatAreaCustom' : 'areaEditCustom');
    if (!wrap || !customInput) return;
    const show = selectEl.value === AREA_CUSTOM_VALUE;
    wrap.style.display = show ? 'block' : 'none';
    if (!show) customInput.value = '';
}

function readAreaFromSelect(selectEl, customInputEl) {
    if (selectEl.value === AREA_CUSTOM_VALUE) {
        return (customInputEl.value || '').trim() || null;
    }
    const v = selectEl.value;
    return (typeof v === 'string' && v.trim()) ? v.trim() : null;
}

document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadExpenses();
    loadIncomes();
    setupEventListeners();
    
    // Nastav dneš ako predvolený dátum
    document.getElementById('date').value = getTodayISO();
    const incomeDate = document.getElementById('incomeDate');
    if (incomeDate) incomeDate.value = getTodayISO();
});

// ==================== NAČÍTANIE DÁT ====================

async function loadCategories() {
    try {
        // Načítaj hierarchiu (s podkategóriami)
        mainCategories = await apiCall('/categories');
        
        // Načítaj plochý zoznam všetkých kategórií
        allCategories = await apiCall('/categories/flat');
        
        displayCategories();
        populateCategorySelects();
    } catch (error) {
        console.error('Chyba pri načítaní kategórií:', error);
        showAlert('Chyba pri načítaní kategórií', 'error');
    }
}

async function loadExpenses() {
    try {
        const year = document.getElementById('filterYear').value;
        const month = document.getElementById('filterMonth').value;
        
        let endpoint = '/expenses';
        const params = [];
        
        if (year) params.push(`year=${year}`);
        if (month) params.push(`month=${month}`);
        
        if (params.length) {
            endpoint += '?' + params.join('&');
        }
        
        const expenses = await apiCall(endpoint);
        displayExpenses(expenses);
    } catch (error) {
        console.error('Chyba pri načítaní výdavkov:', error);
        showAlert('Chyba pri načítaní výdavkov', 'error');
    }
}

async function loadIncomes() {
    const listEl = document.getElementById('incomesList');
    if (!listEl) return;
    try {
        const year = document.getElementById('filterYear').value;
        const month = document.getElementById('filterMonth').value;
        let endpoint = '/incomes';
        const params = [];
        if (year) params.push(`year=${year}`);
        if (month) params.push(`month=${month}`);
        if (params.length) endpoint += '?' + params.join('&');
        const incomes = await apiCall(endpoint);
        displayIncomes(incomes);
    } catch (error) {
        console.error('Chyba pri načítaní príjmov:', error);
        showAlert('Chyba pri načítaní príjmov', 'error');
    }
}

// ==================== ZOBRAZENIE DÁT ====================

function displayCategories() {
    const tree = document.getElementById('categoriesList');
    tree.innerHTML = '';
    
    mainCategories.forEach(mainCat => {
        const catItem = document.createElement('div');
        catItem.className = 'category-item';
        
        // Hlavná kategória
        const header = document.createElement('div');
        header.className = 'category-header';
        const effArea = mainCat.effective_area || 'Nezaradené';
        const hasSubs = mainCat.subcategories && mainCat.subcategories.length > 0;
        header.innerHTML = `
            <span class="category-name">
                ${hasSubs ? `<button type="button" class="category-toggle-btn" aria-expanded="false" title="Zbaliť/rozbaliť podkategórie">▶</button>` : '<span style="width: 1rem; display: inline-block;"></span>'}
                <span>${mainCat.icon}</span>
                <span>${mainCat.name}</span>
                <span class="category-area-badge" title="Oblasť v štatistikách">${effArea}</span>
            </span>
            <div class="category-actions">
                <button type="button" class="btn-small btn-muted" onclick="openAreaEditor(${mainCat.id})">Oblasť</button>
                <button class="btn-small" onclick="deleteCategory(${mainCat.id})">Vymaž</button>
            </div>
        `;
        catItem.appendChild(header);
        
        // Podkategórie
        if (mainCat.subcategories && mainCat.subcategories.length > 0) {
            const subList = document.createElement('div');
            subList.className = 'subcategories-list';
            subList.classList.add('is-hidden');
            
            mainCat.subcategories.forEach(subCat => {
                const subItem = document.createElement('div');
                subItem.className = 'subcategory-item';
                const subEff = subCat.effective_area || 'Nezaradené';
                subItem.innerHTML = `
                    <span>${subCat.icon} ${subCat.name} <span class="category-area-badge sub" title="Oblasť v štatistikách">${subEff}</span></span>
                    <span>
                        <button type="button" class="btn-small btn-muted" onclick="openAreaEditor(${subCat.id})">Oblasť</button>
                        <button class="btn-small" onclick="deleteCategory(${subCat.id})">Vymaž</button>
                    </span>
                `;
                subList.appendChild(subItem);
            });
            
            catItem.appendChild(subList);

            const toggleBtn = header.querySelector('.category-toggle-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    const hidden = subList.classList.toggle('is-hidden');
                    toggleBtn.textContent = hidden ? '▶' : '▼';
                    toggleBtn.setAttribute('aria-expanded', hidden ? 'false' : 'true');
                });
            }
        }
        
        tree.appendChild(catItem);
    });
}

function displayExpenses(expenses) {
    const list = document.getElementById('expensesList');
    list.innerHTML = '';
    
    if (expenses.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Žiadne výdavky.</p>';
        return;
    }
    
    expenses.forEach(expense => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        
        // Nájdi kategóriu pre detaily
        const category = allCategories.find(c => c.id === expense.category_id);
        
        let categoryDisplay = `${expense.category_icon} ${expense.category}`;
        let subcategoryDisplay = '';
        
        // Ak je to podkategória, zobraz hierarchiu
        if (category && category.parent_id) {
            const parentCat = allCategories.find(c => c.id === category.parent_id);
            if (parentCat) {
                categoryDisplay = `${parentCat.icon} ${parentCat.name}`;
                subcategoryDisplay = `<div class="expense-subcategory">${category.icon} ${category.name}</div>`;
            }
        }
        
        item.innerHTML = `
            <div class="expense-info">
                <div class="expense-category">${categoryDisplay}</div>
                ${subcategoryDisplay}
                <div class="expense-details">
                    ${expense.description || 'Bez popisu'} • ${formatDate(expense.date)}
                </div>
            </div>
            <div class="expense-amount ${expense.amount < 0 ? 'is-refund' : ''}">${formatCurrency(expense.amount)}</div>
            <div class="expense-actions">
                <button class="btn-small edit" onclick="editExpense(${expense.id})">Uprav</button>
                <button class="btn-small delete" onclick="deleteExpense(${expense.id})">Vymaž</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function displayIncomes(incomes) {
    const list = document.getElementById('incomesList');
    if (!list) return;
    list.innerHTML = '';
    if (!incomes || incomes.length === 0) {
        list.innerHTML = '<p class="incomes-empty">Žiadne príjmy pre zvolený filter (alebo ešte nemáš nič zapísané).</p>';
        return;
    }
    incomes.forEach(inc => {
        const item = document.createElement('div');
        item.className = 'income-item';
        const source = (inc.source && inc.source.trim()) ? inc.source.trim() : 'Príjem';
        const desc = (inc.description && inc.description.trim()) ? inc.description.trim() : 'Bez popisu';
        item.innerHTML = `
            <div class="income-info">
                <div class="income-source-line">${escapeHtml(source)}</div>
                <div class="income-meta">${escapeHtml(desc)} · ${formatDate(inc.date)}</div>
            </div>
            <div class="income-amount">${formatCurrency(inc.amount)}</div>
            <div class="income-actions">
                <button type="button" class="btn-small delete" onclick="deleteIncome(${inc.id})" title="Odstrániť záznam">Vymaž</button>
            </div>
        `;
        list.appendChild(item);
    });
}

/** Bezpečné zobrazenie textu z API v HTML. */
function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function populateCategorySelects() {
    // Hlavný select pre výdavky (len hlavné kategórie)
    const mainSelect = document.getElementById('mainCategory');
    mainSelect.innerHTML = '<option value="">-- Vyber kategóriu --</option>';
    
    mainCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.icon} ${cat.name}`;
        mainSelect.appendChild(option);
    });
    
    // Select pre vytvorenie podkategórie (len hlavné kategórie)
    const parentSelect = document.getElementById('subcatParent');
    parentSelect.innerHTML = '<option value="">-- Vyber kategóriu --</option>';
    
    mainCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.icon} ${cat.name}`;
        parentSelect.appendChild(option);
    });
}

// ==================== ZOBRAZENIE PODKATEGÓRIÍ ====================

function updateSubcategories() {
    const mainCatId = parseInt(document.getElementById('mainCategory').value);
    const subcatGroup = document.getElementById('subcategoryGroup');
    const subcatSelect = document.getElementById('subCategory');
    
    if (!mainCatId) {
        subcatGroup.style.display = 'none';
        subcatSelect.innerHTML = '<option value="">-- Bez podkategórie --</option>';
        return;
    }
    
    const mainCat = mainCategories.find(c => c.id === mainCatId);
    
    if (mainCat && mainCat.subcategories && mainCat.subcategories.length > 0) {
        subcatGroup.style.display = 'block';
        subcatSelect.innerHTML = '<option value="">-- Bez podkategórie --</option>';
        
        mainCat.subcategories.forEach(subcat => {
            const option = document.createElement('option');
            option.value = subcat.id;
            option.textContent = `${subcat.icon} ${subcat.name}`;
            subcatSelect.appendChild(option);
        });
    } else {
        subcatGroup.style.display = 'none';
        subcatSelect.innerHTML = '<option value="">-- Bez podkategórie --</option>';
    }
}

// ==================== EVENT LISTENERY ====================

function setupEventListeners() {
    // Zmena hlavnej kategórie - aktualizuj podkategórie
    document.getElementById('mainCategory').addEventListener('change', updateSubcategories);
    
    // Formulár na výdavky
    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Použi podkategóriu ak je vybraná, inak hlavnú
        const subCatId = document.getElementById('subCategory').value;
        const mainCatId = document.getElementById('mainCategory').value;
        const categoryId = subCatId ? parseInt(subCatId) : parseInt(mainCatId);
        
        const formData = {
            category_id: categoryId,
            amount: parseFloat(document.getElementById('amount').value),
            description: document.getElementById('description').value,
            date: document.getElementById('date').value
        };
        
        try {
            await apiCall('/expenses', 'POST', formData);
            showAlert('Výdavok bol pridaný!', 'success');
            document.getElementById('expenseForm').reset();
            document.getElementById('date').value = getTodayISO();
            document.getElementById('subcategoryGroup').style.display = 'none';
            loadExpenses();
        } catch (error) {
            showAlert('Chyba pri pridávaní výdavku: ' + error.message, 'error');
        }
    });
    
    const catAreaSel = document.getElementById('catArea');
    const subcatAreaSel = document.getElementById('subcatArea');
    const areaEditSel = document.getElementById('areaEditSelect');
    [catAreaSel, subcatAreaSel, areaEditSel].forEach(sel => {
        if (!sel) return;
        sel.addEventListener('change', () => toggleAreaCustomVisibility(sel));
    });

    // Tlačítko na pridanie kategórie
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
        fillAreaSelect(catAreaSel, '');
        document.getElementById('catAreaCustomWrap').style.display = 'none';
        document.getElementById('catAreaCustom').value = '';
        document.getElementById('categoryModal').classList.add('show');
    });
    
    // Tlačítko na pridanie podkategórie
    document.getElementById('addSubcategoryBtn').addEventListener('click', () => {
        fillAreaSelect(subcatAreaSel, '');
        document.getElementById('subcatAreaCustomWrap').style.display = 'none';
        document.getElementById('subcatAreaCustom').value = '';
        document.getElementById('subcategoryModal').classList.add('show');
    });

    document.getElementById('areaEditSaveBtn').addEventListener('click', saveAreaEditor);

    const incomeForm = document.getElementById('incomeForm');
    if (incomeForm) {
        incomeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                amount: parseFloat(document.getElementById('incomeAmount').value),
                source: document.getElementById('incomeSource').value,
                description: document.getElementById('incomeDesc').value,
                date: document.getElementById('incomeDate').value
            };
            try {
                await apiCall('/incomes', 'POST', formData);
                showAlert('Príjem bol pridaný!', 'success');
                incomeForm.reset();
                document.getElementById('incomeDate').value = getTodayISO();
                loadIncomes();
            } catch (error) {
                showAlert('Chyba pri pridávaní príjmu: ' + error.message, 'error');
            }
        });
    }
    
    // Formulár na kategóriu
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('catName').value,
            icon: document.getElementById('catIcon').value,
            description: document.getElementById('catDesc').value,
            area: readAreaFromSelect(document.getElementById('catArea'), document.getElementById('catAreaCustom'))
        };
        
        try {
            await apiCall('/categories', 'POST', formData);
            showAlert('Kategória bola vytvorená!', 'success');
            document.getElementById('categoryModal').classList.remove('show');
            document.getElementById('categoryForm').reset();
            loadCategories();
        } catch (error) {
            showAlert('Chyba pri vytváraní kategórie: ' + error.message, 'error');
        }
    });
    
    // Formulár na podkategóriu
    document.getElementById('subcategoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('subcatName').value,
            icon: document.getElementById('subcatIcon').value,
            description: document.getElementById('subcatDesc').value,
            parent_id: parseInt(document.getElementById('subcatParent').value),
            area: readAreaFromSelect(document.getElementById('subcatArea'), document.getElementById('subcatAreaCustom'))
        };
        
        try {
            await apiCall('/categories', 'POST', formData);
            showAlert('Podkategória bola vytvorená!', 'success');
            document.getElementById('subcategoryModal').classList.remove('show');
            document.getElementById('subcategoryForm').reset();
            loadCategories();
        } catch (error) {
            showAlert('Chyba pri vytváraní podkategórie: ' + error.message, 'error');
        }
    });
    
    // Tlačítko na filtrovanie
    document.getElementById('filterBtn').addEventListener('click', () => {
        loadExpenses();
        loadIncomes();
    });
    
    // Filter pri zmenách
    document.getElementById('filterYear').addEventListener('change', () => {
        loadExpenses();
        loadIncomes();
    });
    document.getElementById('filterMonth').addEventListener('change', () => {
        loadExpenses();
        loadIncomes();
    });
    
    // Zatváranie modálov
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('show');
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
}

// ==================== SPRÁVA VÝDAVKOV ====================

async function editExpense(id) {
    const expense = await apiCall(`/expenses/${id}`);
    showAlert('Editovanie zatiaľ nie je implementované. Vymaž a vytvor nový výdavok.', 'info');
}

async function deleteExpense(id) {
    if (!confirm('Naozaj chceš vymazať tento výdavok?')) {
        return;
    }
    
    try {
        await apiCall(`/expenses/${id}`, 'DELETE');
        showAlert('Výdavok bol vymazaný!', 'success');
        loadExpenses();
    } catch (error) {
        showAlert('Chyba pri mazaní výdavku: ' + error.message, 'error');
    }
}

async function deleteIncome(id) {
    if (!confirm('Naozaj chceš vymazať tento príjem?')) {
        return;
    }
    try {
        await apiCall(`/incomes/${id}`, 'DELETE');
        showAlert('Príjem bol vymazaný.', 'success');
        loadIncomes();
    } catch (error) {
        showAlert('Chyba pri mazaní príjmu: ' + error.message, 'error');
    }
}

window.deleteIncome = deleteIncome;

// ==================== SPRÁVA KATEGÓRIÍ ====================

function openAreaEditor(categoryId) {
    const cat = allCategories.find(c => c.id === categoryId);
    if (!cat) return;
    let title = `${cat.icon || ''} ${cat.name || ''}`.trim();
    if (cat.parent_id) {
        const parent = allCategories.find(c => c.id === cat.parent_id);
        if (parent) title = `${parent.icon} ${parent.name} → ${cat.icon} ${cat.name}`;
    }
    document.getElementById('areaEditCatTitle').textContent = title;
    document.getElementById('areaEditCatId').value = String(categoryId);
    const sel = document.getElementById('areaEditSelect');
    fillAreaSelect(sel, (cat.area || '').trim());
    document.getElementById('areaEditCustom').value = '';
    toggleAreaCustomVisibility(sel);
    document.getElementById('areaEditModal').classList.add('show');
}

async function saveAreaEditor() {
    const id = parseInt(document.getElementById('areaEditCatId').value, 10);
    if (!id) return;
    const sel = document.getElementById('areaEditSelect');
    const custom = document.getElementById('areaEditCustom');
    const area = readAreaFromSelect(sel, custom);
    try {
        await apiCall(`/categories/${id}`, 'PUT', { area });
        showAlert('Oblasť bola uložená.', 'success');
        document.getElementById('areaEditModal').classList.remove('show');
        loadCategories();
    } catch (error) {
        showAlert('Chyba pri ukladaní oblasti: ' + error.message, 'error');
    }
}

window.openAreaEditor = openAreaEditor;

async function deleteCategory(id) {
    if (!confirm('Naozaj chceš vymazať túto kategóriu?')) {
        return;
    }
    
    try {
        await apiCall(`/categories/${id}`, 'DELETE');
        showAlert('Kategória bola vymazaná!', 'success');
        loadCategories();
    } catch (error) {
        showAlert('Chyba pri mazaní kategórie: ' + error.message, 'error');
    }
}
