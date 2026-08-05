// js/ui/log.js

const MAX_LOG_ENTRIES = 100;

export function addLog(message, type = 'info') {
    const container = document.getElementById('logContainer');
    if (!container) return;

    // Убираем заглушку, если есть
    const empty = container.querySelector('.log-empty');
    if (empty) empty.remove();

    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
    container.appendChild(entry);

    // Ограничиваем количество записей
    while (container.children.length > MAX_LOG_ENTRIES) {
        container.removeChild(container.firstChild);
    }

    // Скролл вниз
    container.scrollTop = container.scrollHeight;
}

export function clearLog() {
    const container = document.getElementById('logContainer');
    if (!container) return;
    container.innerHTML = '';
}

export function showProgress() {
    // Можно добавить прогресс-бар позже
}

export function hideProgress() {
    // Можно добавить прогресс-бар позже
}
