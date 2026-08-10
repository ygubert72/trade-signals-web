import { FUTURES_LIST, STOCKS_LIST, INDICATORS, PATTERNS, ASSET_CODES, FALLBACK_TICKERS } from './config.js';
import { fetchCandles, fetchStockCandles, getActualFuturesTickers } from './api/moex.js';
import { generateSignal } from './signals/generator.js';
import { renderSignals } from './ui/render.js';
import { addLog, clearLog } from './ui/log.js';
import { exportToExcel } from './utils/excel.js';

// Кэш для тикеров
let tickersCache = null;
let tickersCacheTime = null;
const TICKERS_CACHE_TTL = 3600000; // 1 час

async function getTickers() {
    const now = Date.now();
    if (tickersCache && tickersCacheTime && (now - tickersCacheTime < TICKERS_CACHE_TTL)) {
        return tickersCache;
    }
    try {
        addLog('🔄 Получение актуальных тикеров с MOEX...');
        const tickers = await getActualFuturesTickers(ASSET_CODES);
        
        if (!tickers || Object.keys(tickers).length === 0) {
            addLog('⚠️ Автопоиск не сработал, использую запасные тикеры', 'warning');
            tickersCache = FALLBACK_TICKERS;
        } else {
            tickersCache = tickers;
            for (const [key, value] of Object.entries(FALLBACK_TICKERS)) {
                if (!tickersCache[key]) {
                    tickersCache[key] = value;
                }
            }
        }
        
        tickersCacheTime = now;
        addLog(`✅ Получено ${Object.keys(tickersCache).length} тикеров`);
        return tickersCache;
    } catch (error) {
        addLog(`⚠️ Ошибка получения тикеров, использую запасные: ${error.message}`, 'warning');
        tickersCache = FALLBACK_TICKERS;
        tickersCacheTime = now;
        return tickersCache;
    }
}

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
    setupEventListeners();
});

function renderInstruments() {
    const futuresContainer = document.getElementById('futuresContainer');
    if (futuresContainer) {
        futuresContainer.innerHTML = Object.entries(FUTURES_LIST).map(([key, name]) => `
            <label><input type="checkbox" value="${key}" data-group="futures"> ${name}</label>
        `).join('');
    }

    const stocksContainer = document.getElementById('stocksContainer');
    if (stocksContainer) {
        stocksContainer.innerHTML = Object.entries(STOCKS_LIST).map(([key, name]) => `
            <label><input type="checkbox" value="${key}" data-group="stocks"> ${name}</label>
        `).join('');
    }
}

function renderPatterns() {
    const container = document.getElementById('patternsContainer');
    if (container) {
        container.innerHTML = Object.entries(PATTERNS).map(([key, name]) => `
            <label><input type="checkbox" value="${key}"> ${name}</label>
        `).join('');
        updatePatternsCount();
    }
}

function updatePatternsCount() {
    const container = document.getElementById('patternsContainer');
    if (!container) return;
    const checked = container.querySelectorAll('input:checked').length;
    const total = container.querySelectorAll('input').length;
    const el = document.querySelector('.patterns-count');
    if (el) {
        if (checked === total && total > 0) {
            el.textContent = '(выбрано: все)';
        } else {
            el.textContent = `(выбрано: ${checked}/${total})`;
        }
    }
}

function setupEventListeners() {
    document.getElementById('scanBtn')?.addEventListener('click', startScan);
    document.getElementById('exportBtn')?.addEventListener('click', () => exportToExcel(state.results));

    document.getElementById('selectAllFutures')?.addEventListener('change', (e) => {
        document.querySelectorAll('#futuresContainer input').forEach(cb => cb.checked = e.target.checked);
    });

    document.getElementById('selectAllStocks')?.addEventListener('change', (e) => {
        document.querySelectorAll('#stocksContainer input').forEach(cb => cb.checked = e.target.checked);
    });

    document.getElementById('selectAllPatterns')?.addEventListener('click', () => {
        document.querySelectorAll('#patternsContainer input').forEach(cb => cb.checked = true);
        updatePatternsCount();
    });

    document.getElementById('deselectAllPatterns')?.addEventListener('click', () => {
        document.querySelectorAll('#patternsContainer input').forEach(cb => cb.checked = false);
        updatePatternsCount();
    });

    document.getElementById('patternsContainer')?.addEventListener('change', updatePatternsCount);
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
    const selectedPatterns = [...document.querySelectorAll('#patternsContainer input:checked')].map(cb => cb.value);

    if (selectedIndicators.length === 0 && selectedPatterns.length === 0) {
        addLog('⚠️ Ошибка: выберите хотя бы один индикатор или паттерн', 'error');
        return;
    }

    state.indicators = selectedIndicators;
    state.patterns = selectedPatterns;
    state.futures = selectedFutures;
    state.stocks = selectedStocks;
    state.timeframe = document.getElementById('timeframe')?.value || '24';

    state.isScanning = true;
    const scanBtn = document.getElementById('scanBtn');
    scanBtn.disabled = true;
    scanBtn.textContent = '⏳ Сканирование...';
    document.getElementById('exportBtn').disabled = true;
    
    clearLog();
    addLog('🚀 Запуск сканирования...');
    addLog(`📊 Инструментов: ${allSelected.length}, Индикаторов: ${selectedIndicators.length}, Паттернов: ${selectedPatterns.length}`);

    let actualTickers = {};
    if (selectedFutures.length > 0) {
        actualTickers = await getTickers() || {};
    }

    const interval = { '60': '1h', '24': '1d', '7': '1wk', '31': '1mo' }[state.timeframe] || '1d';
    const results = [];

    // Параллельная загрузка
    const instrumentPromises = allSelected.map(async (key) => {
        const isFutures = selectedFutures.includes(key);
        const isStocks = selectedStocks.includes(key);
        
        let ticker = key;
        let displayName = key;

        if (isFutures) {
            ticker = actualTickers[key] || FALLBACK_TICKERS[key] || key;
            displayName = FUTURES_LIST[key] || key;
        } else if (isStocks) {
            displayName = STOCKS_LIST[key] || key;
        }

        addLog(`🔍 Анализ ${displayName} (${ticker})...`);

        try {
            let candles = isStocks 
                ? await fetchStockCandles(ticker, interval, 200)   // ← акции: 200 свечей
                : await fetchCandles(key, interval, 300);       // ← фьючерсы: 300 свечей

            if (!candles || candles.length < 30) {
                addLog(`  ⚠️ ${displayName}: недостаточно данных (${candles?.length || 0})`, 'warning');
                return null;
            }

            const analysis = generateSignal(candles, {
                indicators: selectedIndicators,
                patterns: selectedPatterns,
                timeframe: state.timeframe
            });

            const result = {
                ticker: key,
                name: displayName,
                type: isFutures ? 'Фьючерс' : 'Акция',
                timeframe: state.timeframe,
                price: candles[candles.length - 1].close,
                signal: analysis.signal,
                description: analysis.description,
                indicators: analysis.indicators || {},
                patterns: analysis.patterns || []
            };

            const emoji = analysis.signal === 'BUY' ? '✅' : analysis.signal === 'SELL' ? '✅' : '⏸️';
            addLog(`  ${emoji} ${displayName}: ${analysis.signal} — ${analysis.description}`, 
                   analysis.signal === 'BUY' || analysis.signal === 'SELL' ? 'success' : 'warning');

            return result;

        } catch (error) {
            addLog(`  ❌ ${displayName}: ${error.message}`, 'error');
            return null;
        }
    });

    const instrumentResults = await Promise.allSettled(instrumentPromises);
    
    instrumentResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
        }
    });

    state.results = results;
    state.isScanning = false;
    
    scanBtn.disabled = false;
    scanBtn.textContent = '🚀 Запустить анализ';

    const positiveResults = results.filter(r => r.signal === 'BUY' || r.signal === 'SELL');
    if (positiveResults.length > 0) {
        document.getElementById('exportBtn').disabled = false;
        addLog(`📊 Найдено ${positiveResults.length} сигналов (BUY/SELL)`, 'success');
    } else {
        addLog('📭 Сигналов не найдено', 'warning');
    }

    renderSignals(results);
}
