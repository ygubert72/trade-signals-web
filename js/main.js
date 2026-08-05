// js/main.js

import { 
    FUTURES_LIST, STOCKS_LIST, FUTURES_TICKERS, 
    INDICATORS, PATTERNS 
} from './config.js';
import { fetchCandles } from './api/moex.js';
import { generateSignal } from './signals/generator.js';
import { PatternRegistry } from './patterns/registry.js';
import { renderSignals } from './ui/render.js';
import { addLog, clearLog, showProgress, hideProgress } from './ui/log.js';
import { exportToExcel } from './utils/excel.js';

// Состояние
let state = {
    timeframe: '24',
    indicators: [],
    patterns: [],
    futures: [],
    stocks: [],
    results: [],
    isScanning: false
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    renderInstruments();
    renderPatterns();
    setupEventListeners();
});

// Рендер инструментов
function renderInstruments() {
    // Фьючерсы
    const futuresContainer = document.getElementById('futuresContainer');
    futuresContainer.innerHTML = Object.entries(FUTURES_LIST).map(([key, name]) => `
        <label>
            <input type="checkbox" value="${key}" data-group="futures">
            ${name}
        </label>
    `).join('');

    // Акции
    const stocksContainer = document.getElementById('stocksContainer');
    stocksContainer.innerHTML = Object.entries(STOCKS_LIST).map(([key, name]) => `
        <label>
            <input type="checkbox" value="${key}" data-group="stocks">
            ${name}
        </label>
    `).join('');
}

// Рендер паттернов (все выключены)
function renderPatterns() {
    const container = document.getElementById('patternsContainer');
    container.innerHTML = Object.entries(PATTERNS).map(([key, name]) => `
        <label>
            <input type="checkbox" value="${key}">
            ${name}
        </label>
    `).join('');
    updatePatternsCount();
}

function updatePatternsCount() {
    const checked = document.querySelectorAll('#patternsContainer input:checked').length;
    const el = document.querySelector('.patterns-count');
    if (el) el.textContent = `(выбрано: ${checked})`;
}

// Настройка событий
function setupEventListeners() {
    // Кнопка "Запустить анализ"
    document.getElementById('scanBtn').addEventListener('click', startScan);

    // Экспорт в Excel
    document.getElementById('exportBtn').addEventListener('click', () => {
        exportToExcel(state.results);
    });

    // "Все фьючерсы"
    document.getElementById('selectAllFutures').addEventListener('change', (e) => {
        document.querySelectorAll('#futuresContainer input').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // "Все акции"
    document.getElementById('selectAllStocks').addEventListener('change', (e) => {
        document.querySelectorAll('#stocksContainer input').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // Паттерны: выбор всех / снять все
    document.getElementById('selectAllPatterns').addEventListener('click', () => {
        document.querySelectorAll('#patternsContainer input').forEach(cb => cb.checked = true);
        updatePatternsCount();
    });

    document.getElementById('deselectAllPatterns').addEventListener('click', () => {
        document.querySelectorAll('#patternsContainer input').forEach(cb => cb.checked = false);
        updatePatternsCount();
    });

    // Обновление счётчика паттернов при изменении
    document.getElementById('patternsContainer').addEventListener('change', updatePatternsCount);
}

// Основная функция сканирования
async function startScan() {
    if (state.isScanning) return;

    // Собираем выбранные инструменты
    const selectedFutures = [];
    document.querySelectorAll('#futuresContainer input:checked').forEach(cb => {
        selectedFutures.push(cb.value);
    });

    const selectedStocks = [];
    document.querySelectorAll('#stocksContainer input:checked').forEach(cb => {
        selectedStocks.push(cb.value);
    });

    const allSelected = [...selectedFutures, ...selectedStocks];

    if (allSelected.length === 0) {
        addLog('⚠️ Ошибка: не выбран ни один инструмент', 'error');
        return;
    }

    // Собираем индикаторы
    const selectedIndicators = [];
    document.querySelectorAll('#indicatorsContainer input:checked').forEach(cb => {
        selectedIndicators.push(cb.value);
    });

    if (selectedIndicators.length === 0) {
        addLog('⚠️ Ошибка: не выбран ни один индикатор', 'error');
        return;
    }

    // Собираем паттерны
    const selectedPatterns = [];
    document.querySelectorAll('#patternsContainer input:checked').forEach(cb => {
        selectedPatterns.push(cb.value);
    });

    // Сохраняем состояние
    state.indicators = selectedIndicators;
    state.patterns = selectedPatterns;
    state.futures = selectedFutures;
    state.stocks = selectedStocks;
    state.timeframe = document.getElementById('timeframe').value;

    // Запускаем
    state.isScanning = true;
    document.getElementById('scanBtn').disabled = true;
    document.getElementById('exportBtn').disabled = true;
    clearLog();
    addLog('🚀 Запуск сканирования...');
    addLog(`📊 Инструментов: ${allSelected.length}, Индикаторов: ${selectedIndicators.length}, Паттернов: ${selectedPatterns.length}`);

    const results = [];
    const total = allSelected.length;
    let processed = 0;

    for (const key of allSelected) {
        const isFutures = selectedFutures.includes(key);
        const isStocks = selectedStocks.includes(key);
        
        let ticker = key;
        let displayName = key;

        if (isFutures) {
            ticker = FUTURES_TICKERS[key] || key;
            displayName = FUTURES_LIST[key] || key;
        } else if (isStocks) {
            displayName = STOCKS_LIST[key] || key;
        }

        addLog(`🔍 Анализ ${displayName} (${key})...`);

        try {
            const interval = getInterval(state.timeframe);
            const candles = await fetchCandles(ticker, interval, 150);

            if (!candles || candles.length < 50) {
                addLog(`  ⚠️ ${displayName}: недостаточно данных`, 'warning');
                processed++;
                continue;
            }

            // Генерация сигнала с выбранными индикаторами и паттернами
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
                addLog(`  ⏸️ ${displayName}: ${analysis.signal} — ${analysis.description}`, 'warning');
            }

        } catch (error) {
            addLog(`  ❌ ${displayName}: ошибка — ${error.message}`, 'error');
        }

        processed++;
        // Обновляем прогресс (можно добавить прогресс-бар позже)
    }

    state.results = results;
    state.isScanning = false;
    document.getElementById('scanBtn').disabled = false;

    const positiveResults = results.filter(r => r.signal === 'BUY' || r.signal === 'SELL');
    if (positiveResults.length > 0) {
        document.getElementById('exportBtn').disabled = false;
        addLog(`📊 Найдено ${positiveResults.length} сигналов (BUY/SELL)`, 'success');
    } else {
        addLog('📭 Сигналов не найдено', 'warning');
    }

    // Рендер результатов
    renderSignals(results);
}

function getInterval(timeframe) {
    const map = {
        '60': '1h',
        '24': '1d',
        '7': '1wk',
        '31': '1mo'
    };
    return map[timeframe] || '1d';
}
