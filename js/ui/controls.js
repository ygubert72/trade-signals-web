// js/ui/controls.js

export function initControls(loadFn) {
    const timeframe = document.getElementById('timeframe');
    const refreshBtn = document.getElementById('refreshBtn');

    if (timeframe) {
        timeframe.addEventListener('change', () => {
            loadFn(timeframe.value, getSelectedInstruments(), getSelectedPatterns());
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadFn(
                document.getElementById('timeframe').value,
                getSelectedInstruments(),
                getSelectedPatterns()
            );
        });
    }

    document.getElementById('selectAllPatterns')?.addEventListener('click', () => {
        document.querySelectorAll('#patternsContainer input[type="checkbox"]').forEach(cb => cb.checked = true);
        updatePatternsCount();
        loadFn(
            document.getElementById('timeframe').value,
            getSelectedInstruments(),
            getSelectedPatterns()
        );
    });

    document.getElementById('deselectAllPatterns')?.addEventListener('click', () => {
        document.querySelectorAll('#patternsContainer input[type="checkbox"]').forEach(cb => cb.checked = false);
        updatePatternsCount();
        loadFn(
            document.getElementById('timeframe').value,
            getSelectedInstruments(),
            getSelectedPatterns()
        );
    });

    document.addEventListener('change', (e) => {
        if (e.target.closest('#patternsContainer')) {
            updatePatternsCount();
        }
    });
}

function getSelectedInstruments() {
    const checked = document.querySelectorAll('.instrument-checkboxes input:checked');
    return Array.from(checked).map(cb => cb.value);
}

function getSelectedPatterns() {
    const checked = document.querySelectorAll('#patternsContainer input:checked');
    return Array.from(checked).map(cb => cb.value);
}

function updatePatternsCount() {
    const total = document.querySelectorAll('#patternsContainer input').length;
    const selected = document.querySelectorAll('#patternsContainer input:checked').length;
    const countEl = document.querySelector('.patterns-count');
    if (countEl) {
        countEl.textContent = selected === total ? '(выбрано: все)' : `(выбрано: ${selected}/${total})`;
    }
}

export function populatePatterns(patternNames) {
    const container = document.getElementById('patternsContainer');
    if (!container) return;

    container.innerHTML = patternNames.map(name => `
        <label>
            <input type="checkbox" value="${name}" checked>
            ${name}
        </label>
    `).join('');

    updatePatternsCount();

    container.querySelectorAll('input').forEach(cb => {
        cb.addEventListener('change', () => {
            updatePatternsCount();
            const loadFn = window._loadSignals || (() => {});
            loadFn(
                document.getElementById('timeframe').value,
                getSelectedInstruments(),
                getSelectedPatterns()
            );
        });
    });
}
