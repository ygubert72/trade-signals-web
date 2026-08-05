// js/main.js

import { 
    FUTURES_LIST, STOCKS_LIST, FUTURES_TICKERS, 
    INDICATORS, PATTERNS 
} from './config.js';
import { fetchCandles } from './api/moex.js';
import { generateSignal } from './signals/generator.js';
import { PatternRegistry } from './patterns/registry.js';
import { renderSignals } from './ui/render.js';
import { addLog, clearLog } from './ui/log.js';
import { exportToExcel } from './utils/excel.js';

let state = {
    timeframe: '24',
    indicators: [],
    patterns: [],
    futures: [],
    stocks: [],
    results: [],
    isScanning: false
};

document.addEventListener('DOMContentLoaded', () => {
    renderInstruments();
    renderPatterns();
    setupEvents();
});

function renderInstruments() {
    const fc = document.getElementById('futuresContainer');
    fc.innerHTML = Object.entries(FUTURES_LIST).map(([k, v]) =>
        `<label><input type="checkbox" value="${k}" data-group="futures"> ${v}</label>`
    ).join('');

    const sc = document.getElementById('stocksContainer');
    sc.innerHTML = Object.entries(STOCKS_LIST).map(([k, v]) =>
        `<label><input type="checkbox" value="${k}" data-group="stocks"> ${v}</label>`
    ).join('');
}

function renderPatterns() {
    const c = document.getElementById('patternsContainer');
    c.innerHTML = Object.entries(PATTERNS).map(([k, v]) =>
        `<label><input type="checkbox" value="${k}"> ${v}</label>`
    ).join('');
    updatePatternsCount();
}

function updatePatternsCount() {
    const checked = document.querySelectorAll('#patternsContainer input:checked').length;
    const el = document.getElementById('patternsCount');
    if (el) el.textContent = `(выбрано: ${checked})`;
}

function setupEvents() {
    document.getElementById('scanBtn').addEventListener('click', startScan);
    document.getElementById('exportBtn').addEventListener('click', () => exportToExcel(state.results));

    document.getElementById('selectAllFutures').addEventListener('change', (e) => {
        document.querySelectorAll('#futuresContainer input').forEach(cb => cb.checked = e.target.checked);
    });

    document.getElementById('selectAllStocks').addEventListener('change', (e) => {
        document.querySelectorAll('#stocksContainer input').forEach(cb => cb.checked = e.target.checked);
    });

    document.getElementById('selectAllPatterns').addEventListener('click', () => {
        document.querySelectorAll('#patternsContainer input').forEach(cb => cb.checked = true);
        updatePatternsCount();
    });

    document.getElementById('deselectAllPatterns').addEventListener('click', () => {
        document.querySelectorAll('#patternsContainer input').forEach(cb => cb.checked = false);
        updatePatternsCount();
    });

    document.getElementById('patternsContainer').addEventListener('change', updatePatternsCount);
}

async function startScan() {
    if (state.isScanning) return;

    const selectedFutures = [...document.querySelectorAll('#futuresContainer input:checked')].map(cb => cb.value);
    const selectedStocks = [...document.querySelectorAll('#stocksContainer input:checked')].map(cb => cb.value);
    const allSelected = [...selectedFutures, ...selectedStocks];

    if (allSelected.length === 0) {
        addLog('⚠️ Ошибка: не выбран ни один инструмент', 'error');
        return;
    }

    const selectedIndicators = [...document.querySelectorAll('#indicatorsContainer input:checked')].map(cb => cb.value);
    if (selectedIndicators.length === 0) {
        addLog('⚠️ Ошибка: не выбран ни один индикатор', 'error');
        return;
    }

    const selectedPatterns = [...document.querySelectorAll('#patternsContainer input:checked')].map(cb => cb.value);

    state.indicators = selectedIndicators;
    state.patterns = selectedPatterns;
    state.futures = selectedFutures;
    state.stocks = selectedStocks;
    state.timeframe = document.getElementById('timeframe').value;

    state.isScanning = true;
    document.getElementById('scanBtn').disabled = true;
    document.getElementById('exportBtn').disabled = true;
    clearLog();
    addLog('🚀 Запуск сканирования...');
    addLog(`📊 Инструментов: ${allSelected.length}, Индикаторов: ${selectedIndicators.length}, Паттернов: ${selectedPatterns.length}`);

    const results = [];
    let processed = 0;

    for (const key of allSelected) {
        const isFutures = selectedFutures.includes(key);
        const ticker = isFutures ? (FUTURES_TICKERS[key] || key) : key;
        const displayName = isFutures ? (FUTURES_LIST[key] || key) : (STOCKS_LIST[key] || key);

        addLog(`🔍 Анализ ${displayName}...`);

        try {
            const interval = { '60':'1h','24':'1d','7':'1wk','31':'1mo' }[state.timeframe] || '1d';
            const candles = await fetchCandles(ticker, interval, 150);

            if (!candles || candles.length < 50) {
                addLog(`  ⚠️ ${displayName}: недостаточно данных`, 'warning');
                processed++;
                continue;
            }

            const analysis = generateSignal(candles, {
                indicators: selectedIndicators,
                patterns: selectedPatterns
            });

            const lastPrice = candles[candles.length - 1].close;
            const result = {
                ticker: key,
                name: displayName,
                type: isFutures ? 'Фьючерс' : 'Акция',
                timeframe: state.timeframe,
                price: lastPrice,
                signal: analysis.signal,
                description: analysis.description,
                indicators: analysis.indicators || {},
                patterns: analysis.patterns || []
            };
            results.push(result);

            if (analysis.signal === 'BUY' || analysis.signal === 'SELL') {
                addLog(`  ✅ ${displayName}: ${analysis.signal} — ${analysis.description}`, 'success');
            } else {
                addLog(`  ⏸️ ${displayName}: ${analysis.signal}`, 'warning');
            }
        } catch (e) {
            addLog(`  ❌ ${displayName}: ${e.message}`, 'error');
        }
        processed++;
    }

    state.results = results;
    state.isScanning = false;
    document.getElementById('scanBtn').disabled = false;

    const positive = results.filter(r => r.signal === 'BUY' || r.signal === 'SELL');
    if (positive.length) {
        document.getElementById('exportBtn').disabled = false;
        addLog(`📊 Найдено ${positive.length} сигналов (BUY/SELL)`, 'success');
    } else {
        addLog('📭 Сигналов не найдено', 'warning');
    }

    renderSignals(results);
}
