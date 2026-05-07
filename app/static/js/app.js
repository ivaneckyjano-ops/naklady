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

let gitHubBackupStatusTimer = null;

function setGitHubBackupStatus(kind, title, lines = []) {
    const host = document.getElementById('gitHubBackupStatus');
    if (!host) return;

    if (gitHubBackupStatusTimer) {
        clearTimeout(gitHubBackupStatusTimer);
        gitHubBackupStatusTimer = null;
    }

    host.hidden = false;
    host.className = `git-backup-status git-backup-status-${kind}`;
    host.innerHTML = '';

    const box = document.createElement('div');
    box.className = 'git-backup-status-box';

    const heading = document.createElement('div');
    heading.className = 'git-backup-status-title';
    heading.textContent = title;
    box.appendChild(heading);

    const meta = document.createElement('div');
    meta.className = 'git-backup-status-meta';
    const content = lines.filter(Boolean).join('\n').trim();
    meta.textContent = content;
    if (meta.textContent) {
        box.appendChild(meta);
    }

    if (content) {
        const actions = document.createElement('div');
        actions.className = 'git-backup-status-actions';

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'git-backup-copy-btn';
        copyBtn.textContent = 'Kopírovať log';
        copyBtn.addEventListener('click', () => {
            copyToClipboard(`${title}\n${content}`);
        });
        actions.appendChild(copyBtn);
        box.appendChild(actions);
    }

    host.appendChild(box);
}

function hideGitHubBackupStatus() {
    const host = document.getElementById('gitHubBackupStatus');
    if (!host) return;
    if (gitHubBackupStatusTimer) {
        clearTimeout(gitHubBackupStatusTimer);
        gitHubBackupStatusTimer = null;
    }
    host.hidden = true;
    host.className = 'git-backup-status';
    host.innerHTML = '';
}

// ==================== NAČÍTANIE STRÁNKY ====================

document.addEventListener('DOMContentLoaded', function() {
    // Skontroluj, či je aplikácia inicializovaná
    checkAppInitialization();
    setupGitHubBackupButton();
});

/**
 * Tlačidlo „Záloha na GitHub“ — volá lokálny endpoint, ktorý spustí git-upload-naklady.sh
 */
function setupGitHubBackupButton() {
    const btn = document.getElementById('gitHubBackupBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        if (!window.confirm(
            'Spustiť commit a push na GitHub?\n\n' +
            'Repozitár: ivaneckyjano-ops/naklady (vetva main).\n' +
            'Potrebuješ nastavený SSH kľúč pre GitHub.'
        )) {
            return;
        }
        const custom = window.prompt(
            'Voliteľná správa commitu (OK s prázdnym = automatická z dátumu):',
            ''
        );
        if (custom === null) {
            return;
        }
        btn.disabled = true;
        const prev = btn.textContent;
        btn.textContent = '… zálohujem';
        setGitHubBackupStatus('info', 'Záloha na GitHub beží…', [
            'Čakám na odpoveď servera.',
            'Ak push zlyhá, uvidíš sem detailný výstup git príkazov.'
        ]);
        try {
            const res = await fetch('/api/git-backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: (custom || '').trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 403) {
                setGitHubBackupStatus('error', 'Git záloha je blokovaná', [
                    data.error || 'Nepovolený prístup.',
                ]);
                showAlert(data.error || 'Prístup zamietnutý.', 'error');
                return;
            }
            if (!res.ok) {
                setGitHubBackupStatus('error', 'Git záloha zlyhala', [
                    data.error || 'Chyba servera pri zálohe.',
                    data.summary ? `Súhrn: ${data.summary}` : '',
                    data.stderr ? `stderr:\n${data.stderr}` : '',
                    data.stdout ? `stdout:\n${data.stdout}` : '',
                ]);
                showAlert(data.error || 'Chyba servera pri zálohe.', 'error');
                return;
            }
            if (data.ok) {
                setGitHubBackupStatus('success', 'GitHub záloha prebehla úspešne', [
                    data.summary || 'Push a commit boli dokončené.',
                    data.stdout ? `stdout:\n${data.stdout}` : '',
                    data.stderr ? `stderr:\n${data.stderr}` : '',
                ]);
                gitHubBackupStatusTimer = setTimeout(() => {
                    hideGitHubBackupStatus();
                }, 3500);
                showAlert(data.summary || 'Záloha na GitHub prebehla.', 'success');
            } else {
                setGitHubBackupStatus('error', 'GitHub záloha zlyhala', [
                    data.summary || 'Nedá sa dokončiť commit alebo push.',
                    data.returncode !== undefined ? `Návratový kód: ${data.returncode}` : '',
                    data.stderr ? `stderr:\n${data.stderr}` : '',
                    data.stdout ? `stdout:\n${data.stdout}` : '',
                ]);
                showAlert(data.summary || 'Záloha zlyhala.', 'error');
            }
        } catch (e) {
            setGitHubBackupStatus('error', 'Chyba komunikácie', [
                e.message || 'Nepodarilo sa spojiť s backendom.',
            ]);
            showAlert('Chyba pri komunikácii: ' + e.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = prev;
        }
    });
}

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
