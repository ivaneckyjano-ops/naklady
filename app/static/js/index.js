// ==================== DOMOVSKÁ STRÁNKA ====================

let allCategories = [];
let mainCategories = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadExpenses();
    setupEventListeners();
    
    // Nastav dneš ako predvolený dátum
    document.getElementById('date').value = getTodayISO();
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
        header.innerHTML = `
            <span class="category-name">
                <span>${mainCat.icon}</span>
                <span>${mainCat.name}</span>
            </span>
            <div class="category-actions">
                <button class="btn-small" onclick="deleteCategory(${mainCat.id})">Vymaž</button>
            </div>
        `;
        catItem.appendChild(header);
        
        // Podkategórie
        if (mainCat.subcategories && mainCat.subcategories.length > 0) {
            const subList = document.createElement('div');
            subList.className = 'subcategories-list';
            
            mainCat.subcategories.forEach(subCat => {
                const subItem = document.createElement('div');
                subItem.className = 'subcategory-item';
                subItem.innerHTML = `
                    <span>${subCat.icon} ${subCat.name}</span>
                    <button class="btn-small" onclick="deleteCategory(${subCat.id})">Vymaž</button>
                `;
                subList.appendChild(subItem);
            });
            
            catItem.appendChild(subList);
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
            <div class="expense-amount">${formatCurrency(expense.amount)}</div>
            <div class="expense-actions">
                <button class="btn-small edit" onclick="editExpense(${expense.id})">Uprav</button>
                <button class="btn-small delete" onclick="deleteExpense(${expense.id})">Vymaž</button>
            </div>
        `;
        list.appendChild(item);
    });
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
    
    // Tlačítko na pridanie kategórie
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
        document.getElementById('categoryModal').classList.add('show');
    });
    
    // Tlačítko na pridanie podkategórie
    document.getElementById('addSubcategoryBtn').addEventListener('click', () => {
        document.getElementById('subcategoryModal').classList.add('show');
    });
    
    // Formulár na kategóriu
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('catName').value,
            icon: document.getElementById('catIcon').value,
            description: document.getElementById('catDesc').value
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
            parent_id: parseInt(document.getElementById('subcatParent').value)
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
    document.getElementById('filterBtn').addEventListener('click', loadExpenses);
    
    // Filter pri zmenách
    document.getElementById('filterYear').addEventListener('change', loadExpenses);
    document.getElementById('filterMonth').addEventListener('change', loadExpenses);
    
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

// ==================== SPRÁVA KATEGÓRIÍ ====================

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
