// js/ui/log.js

const MAX = 100;

export function addLog(message, type = 'info') {
    const container = document.getElementById('logContainer');
    if (!container) return;

    const empty = container.querySelector('.log-empty');
    if (empty) empty.remove();

    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
    container.appendChild(entry);

    while (container.children.length > MAX) {
        container.removeChild(container.firstChild);
    }
    container.scrollTop = container.scrollHeight;
}

export function clearLog() {
    const container = document.getElementById('logContainer');
    if (container) container.innerHTML = '';
}
