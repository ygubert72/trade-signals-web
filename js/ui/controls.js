// js/ui/controls.js

export function initControls(loadFn) {
    const timeframe = document.getElementById('timeframe');
    const refreshBtn = document.getElementById('refreshBtn');

    if (timeframe) {
        timeframe.addEventListener('change', () => {
            const selected = getSelectedInstruments();
            loadFn(timeframe.value, selected);
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const selected = getSelectedInstruments();
            loadFn(document.getElementById('timeframe').value, selected);
        });
    }
}

function getSelectedInstruments() {
    const checked = document.querySelectorAll('.instrument-checkboxes input:checked');
    return Array.from(checked).map(cb => cb.value);
}

export function populatePatterns(patternNames) {
    // Паттерны теперь отображаются в карточках, не нужен отдельный select
    // Но если хотите оставить выбор паттернов — раскомментируйте код ниже
    /*
    const container = document.getElementById('patterns-container');
    if (!container) return;
    container.innerHTML = patternNames.map(name =>
        `<label><input type="checkbox" value="${name}" checked> ${name}</label>`
    ).join('');
    */
}
