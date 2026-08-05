// js/ui/controls.js

import { loadSignals } from '../main.js';

const TIMEFRAMES = {
    'Час': '60',
    'День': '24',
    'Неделя': '7',
    'Месяц': '31'
};

export function initControls() {
    const timeframeSelect = document.getElementById('timeframe');
    const patternsSelect = document.getElementById('patterns');
    const refreshBtn = document.getElementById('refreshBtn');

    if (timeframeSelect) {
        // Заполняем таймфреймы
        Object.keys(TIMEFRAMES).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            if (key === 'День') option.selected = true;
            timeframeSelect.appendChild(option);
        });

        timeframeSelect.addEventListener('change', () => {
            loadSignals(timeframeSelect.value, getSelectedPatterns());
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadSignals(
                timeframeSelect?.value || 'День',
                getSelectedPatterns()
            );
        });
    }

    if (patternsSelect) {
        patternsSelect.addEventListener('change', () => {
            loadSignals(
                timeframeSelect?.value || 'День',
                getSelectedPatterns()
            );
        });
    }
}

function getSelectedPatterns() {
    const patternsSelect = document.getElementById('patterns');
    if (!patternsSelect) return [];
    return Array.from(patternsSelect.selectedOptions).map(opt => opt.value);
}

export function populatePatterns(patternNames) {
    const select = document.getElementById('patterns');
    if (!select) return;

    select.innerHTML = patternNames.map(name => `
        <option value="${name}" selected>${name}</option>
    `).join('');
}
