// js/main.js

import { fetchAllSymbols } from './api/moex.js';
import { analyzeWithPatterns } from './signals/generator.js';
import { renderSignals } from './ui/render.js';
import { initControls, populatePatterns } from './ui/controls.js';
import { PatternRegistry } from './patterns/registry.js';

const ALL_SYMBOLS = {
    'RTS': 'RTS-9.26',
    'Si': 'Si-9.26',
    'BR': 'BR-9.26',
    'GOLD': 'GOLD-9.26'
};

const SYMBOL_NAMES = {
    'RTS': 'Индекс РТС',
    'Si': 'Доллар/рубль',
    'BR': 'Нефть Brent',
    'GOLD': 'Золото'
};

const TIMEFRAMES = {
    '60': '1h',
    '24': '1d',
    '7': '1wk',
    '31': '1mo'
};

let currentTimeframe = '24';
let currentInstruments = ['RTS', 'Si', 'BR', 'GOLD'];

export async function loadSignals(timeframe = null, instruments = null) {
    if (timeframe) currentTimeframe = timeframe;
    if (instruments) currentInstruments = instruments;

    const container = document.getElementById('results');
    container.innerHTML = '<div class="loading">⏳ Загрузка...</div>';

    const symbols = {};
    const names = {};
    for (const key of currentInstruments) {
        if (ALL_SYMBOLS[key]) {
            symbols[key] = ALL_SYMBOLS[key];
            names[key] = SYMBOL_NAMES[key] || key;
        }
    }

    if (Object.keys(symbols).length === 0) {
        container.innerHTML = '<div class="loading">Выберите хотя бы один инструмент</div>';
        return;
    }

    try {
        const interval = TIMEFRAMES[currentTimeframe] || '1d';
        const allData = await fetchAllSymbols(symbols, interval, 150);
        const results = [];

        for (const [key, candles] of Object.entries(allData)) {
            if (!candles || candles.length < 50) {
                console.warn(`Недостаточно данных для ${key}`);
                continue;
            }

            const selectedPatterns = PatternRegistry.getPatternNames();
            const analysis = analyzeWithPatterns(candles, selectedPatterns);
            const lastPrice = candles[candles.length - 1].close;

            results.push({
                symbol: key,
                display_name: names[key] || key,
                timeframe: currentTimeframe,
                current_price: lastPrice,
                signal: analysis.signal,
                signal_description: analysis.description,
                indicators: analysis.indicators,
                patterns: analysis.patterns
            });
        }

        renderSignals(results);
    } catch (error) {
        console.error('Ошибка:', error);
        container.innerHTML = '<div class="loading">❌ Ошибка загрузки данных</div>';
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const patternNames = PatternRegistry.getPatternNames();
    populatePatterns(patternNames);
    initControls(loadSignals);

    // Чекбоксы инструментов
    document.querySelectorAll('.instrument-checkboxes input').forEach(cb => {
        cb.addEventListener('change', () => {
            const selected = [];
            document.querySelectorAll('.instrument-checkboxes input:checked').forEach(c => {
                selected.push(c.value);
            });
            loadSignals(currentTimeframe, selected);
        });
    });

    loadSignals('24', ['RTS', 'Si', 'BR', 'GOLD']);
});
