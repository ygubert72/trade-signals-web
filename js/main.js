import { FUTURES_LIST, STOCKS_LIST, INDICATORS, PATTERNS } from './config.js';
import { fetchCandles, fetchStockCandles, getActualFuturesTickers } from './api/moex.js';
import { generateSignal } from './signals/generator.js';
import { renderSignals } from './ui/render.js';
import { addLog, clearLog } from './ui/log.js';
import { exportToExcel } from './utils/excel.js';

const ASSET_CODES = {
    'RTS': 'RTS', 'Si': 'Si', 'BR': 'BR', 'GOLD': 'GOLD',
    'SILV': 'SILV', 'PLAT': 'PLT', 'PALL': 'PLD', 'COPPER': 'COPPER',
    'ALUM': 'ALUM', 'NICK': 'NICKEL', 'WHT': 'WHEAT', 'CORN': 'CORN',
    'SOYB': 'SOYB', 'SUGR': 'SUGAR', 'COFF': 'COFFEE', 'CACA': 'COCOA',
    'COTN': 'COTTON', 'OIL': 'WTI', 'GAS': 'NG', 'MX': 'MIX',
    'RVI': 'RVI', 'ROS': 'ROSN', 'GAZ': 'GAZR', 'LKOH': 'LKOH',
    'SBER': 'SBRF', 'VTBR': 'VTBR', 'TATN': 'TATN', 'NVTK': 'NOTK',
    'PLZL': 'PLZL', 'GMKN': 'GMKN'
};

let tickersCache = null;
let tickersCacheTime = null;
const TICKERS_CACHE_TTL = 3600000;

async function getTickers() {
    const now = Date.now();
    if (tickersCache && tickersCacheTime && (now - tickersCacheTime < TICKERS_CACHE_TTL)) {
        return tickersCache;
    }
    try {
        addLog('🔄 Получение актуальных тикеров с MOEX...');
        const tickers = await getActualFuturesTickers(ASSET_CODES);
        tickersCache = tickers;
        tickersCacheTime = now;
        addLog(`✅ Получено ${Object.keys(tickers).length} актуальных тикеров`);
        return tickers;
    } catch (error) {
        addLog('⚠️ Ошибка получения тикеров', 'error');
        return null;
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
    const checked = document.querySelectorAll('#patternsContainer input:checked').length;
    const el = document.querySelector('.patterns-count');
    if (el) el.textContent = `(выбрано: ${checked})`;
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
    if (selectedIndicators.length === 0) {
        addLog('⚠️ Ошибка: не выбран ни один индикатор', 'error');
        return;
    }

    const selectedPatterns = [...document.querySelectorAll('#patternsContainer input:checked')].map(cb => cb.value);

    state.indicators = selectedIndicators;
    state.patterns = selectedPatterns;
    state.futures = selectedFutures;
    state.stocks = selectedStocks;
    state.timeframe = document.getElementById('timeframe')?.value || '24';

    state.isScanning = true;
    document.getElementById('scanBtn').disabled = true;
    document.getElementById('exportBtn').disabled = true;
    clearLog();
    addLog('🚀 Запуск сканирования...');
    addLog(`📊 Инструментов: ${allSelected.length}, Индикаторов: ${selectedIndicators.length}, Паттернов: ${selectedPatterns.length}`);

    let actualTickers = {};
    if (selectedFutures.length > 0) {
        const tickers = await getTickers();
        if (tickers) actualTickers = tickers;
    }

    const results = [];
    const interval = { '60':'1h', '24':'1d', '7':'1wk', '31':'1mo' }[state.timeframe] || '1d';

    for (const key of allSelected) {
        const isFutures = selectedFutures.includes(key);
        const isStocks = selectedStocks.includes(key);
        
        let ticker = key;
        let displayName = key;

        if (isFutures) {
            ticker = actualTickers[key] || ASSET_CODES[key] || key;
            displayName = FUTURES_LIST[key] || key;
        } else if (isStocks) {
            displayName = STOCKS_LIST[key] || key;
        }

        addLog(`🔍 Анализ ${displayName} (${ticker})...`);

        try {
            let candles = isStocks 
                ? await fetchStockCandles(ticker, interval, 150)
                : await fetchCandles(ticker, interval, 150);

            if (!candles || candles.length < 30) {
                addLog(`  ⚠️ ${displayName}: недостаточно данных (${candles?.length || 0})`, 'warning');
                continue;
            }

            const analysis = generateSignal(candles, {
                indicators: selectedIndicators,
                patterns: selectedPatterns
            });

            results.push({
                ticker: key,
                name: displayName,
                type: isFutures ? 'Фьючерс' : 'Акция',
                timeframe: state.timeframe,
                price: candles[candles.length - 1].close,
                signal: analysis.signal,
                description: analysis.description,
                indicators: analysis.indicators || {},
                patterns: analysis.patterns || []
            });

            const emoji = analysis.signal === 'BUY' ? '✅' : analysis.signal === 'SELL' ? '✅' : '⏸️';
            addLog(`  ${emoji} ${displayName}: ${analysis.signal} — ${analysis.description}`, analysis.signal === 'BUY' || analysis.signal === 'SELL' ? 'success' : 'warning');

        } catch (error) {
            addLog(`  ❌ ${displayName}: ${error.message}`, 'error');
        }
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

    renderSignals(results);
}
