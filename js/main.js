// js/main.js (только измененная часть - функция startScan)

import { FUTURES_LIST, STOCKS_LIST, INDICATORS, PATTERNS, ASSET_CODES, FALLBACK_TICKERS } from './config.js';
import { fetchCandles, fetchStockCandles, getActualFuturesTickers } from './api/moex.js';
import { generateSignal } from './signals/generator.js';
import { renderSignals } from './ui/render.js';
import { addLog, clearLog } from './ui/log.js';
import { exportToExcel } from './utils/excel.js';

// ... (остальной код main.js без изменений до функции startScan)

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
                ? await fetchStockCandles(ticker, interval, 150)
                : await fetchCandles(ticker, interval, 150);

            if (!candles || candles.length < 30) {
                addLog(`  ⚠️ ${displayName}: недостаточно данных (${candles?.length || 0})`, 'warning');
                return null;
            }

            // 🔥 ПЕРЕДАЕМ ТАЙМФРЕЙМ В ГЕНЕРАТОР
            const analysis = generateSignal(candles, {
                indicators: selectedIndicators,
                patterns: selectedPatterns,
                timeframe: state.timeframe  // ← Добавлено!
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
