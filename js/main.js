// js/main.js

import { fetchAllSymbols } from './api/moex.js';
import { analyzeWithPatterns } from './signals/generator.js';
import { renderSignals } from './ui/render.js';
import { initControls, populatePatterns } from './ui/controls.js';
import { PatternRegistry } from './patterns/registry.js';

const FUTURES_SYMBOLS = {
    'RTS': 'RTS-9.26',
    'Si': 'Si-9.26'
};

const FUTURES_NAMES = {
    'RTS': 'Индекс РТС',
    'Si': 'Доллар-рубль'
};

const TIMEFRAMES = {
    'Час': '60',
    'День': '24',
    'Неделя': '7',
    'Месяц': '31'
};

export async function loadSignals(timeframeKey = 'День', selectedPatterns = null) {
    renderSignals([], true);

    const interval = TIMEFRAMES[timeframeKey];
    if (!selectedPatterns) {
        selectedPatterns = PatternRegistry.getPatternNames();
    }

    try {
        const allData = await fetchAllSymbols(FUTURES_SYMBOLS, interval, 150);
        const results = [];

        for (const [symbol, candles] of Object.entries(allData)) {
            if (!candles || candles.length < 50) {
                console.warn(`Недостаточно данных для ${symbol}`);
                continue;
            }

            const analysis = analyzeWithPatterns(candles, selectedPatterns);
            const lastPrice = candles[candles.length - 1].close;

            results.push({
                symbol: symbol,
                display_name: FUTURES_NAMES[symbol] || symbol,
                timeframe: timeframeKey,
                current_price: lastPrice,
                signal: analysis.signal,
                signal_description: analysis.description,
                indicators: analysis.indicators,
                patterns: analysis.patterns
            });
        }

        renderSignals(results);
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        renderSignals([]);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const patternNames = PatternRegistry.getPatternNames();
    populatePatterns(patternNames);
    initControls();
    loadSignals('День');
});
