// ==================== GLOBÁLNE FUNKCIE ====================

/**
 * Zobraz alert správu
 */
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Automatické skrytie po 5 sekundách
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * Vykonaj API požiadavku
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`/api${endpoint}`, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Chyba pri požiadavke');
        }
        
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Formátuj číslo ako menu s eurom
 */
function formatCurrency(amount) {
    return '€' + parseFloat(amount).toFixed(2).replace('.', ',');
}

/**
 * Parsuj ISO dátum na lokálny formát
 */
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('sk-SK');
}

/**
 * Ziskaj dnes v ISO formáte
 */
function getTodayISO() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Inicializuj aplikáciu s ukážkovými dátami
 */
async function initializeApp() {
    try {
        const result = await apiCall('/init', 'POST');
        console.log('Aplikácia inicializovaná:', result);
        showAlert('Aplikácia bola úspešne inicializovaná s kategóriami!', 'success');
        location.reload();
    } catch (error) {
        // Aplikácia už mohla byť inicializovaná
        console.log('Aplikácia je už inicializovaná');
    }
}

/**
 * Skopíruj text do schránky
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Skopírované do schránky!', 'success');
    });
}

// ==================== NAČÍTANIE STRÁNKY ====================

document.addEventListener('DOMContentLoaded', function() {
    // Skontroluj, či je aplikácia inicializovaná
    checkAppInitialization();
});

/**
 * Skontroluj, či je aplikácia inicializovaná
 */
async function checkAppInitialization() {
    try {
        const categories = await apiCall('/categories');
        if (categories.length === 0) {
            // Inicializuj aplikáciu
            await initializeApp();
        }
    } catch (error) {
        console.error('Chyba pri kontrole inicializácie:', error);
    }
}

// ==================== EXPORT ====================

// Exportuj funkcie aby boli dostupné v ostatných skriptoch
window.showAlert = showAlert;
window.apiCall = apiCall;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.getTodayISO = getTodayISO;
window.initializeApp = initializeApp;
window.copyToClipboard = copyToClipboard;
