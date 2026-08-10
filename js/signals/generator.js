// js/signals/generator.js

import { calculateEMA } from '../indicators/ema.js';
import { calculateRSI } from '../indicators/rsi.js';
import { calculateADX } from '../indicators/adx.js';
import { PatternRegistry } from '../patterns/registry.js';
import { clearFractalCache } from '../patterns/fractal_breakout.js';

const ADX_THRESHOLD = 25;

const PATTERN_NAME_MAP = {
    'pinbar': 'Пин-бары на экстремумах',
    'golden_cross': 'Золотой крест (50/200)',
    'ma_200': 'Касание/пробой 200MA',
    'breakout': 'Пробой локального уровня',
    'double_top': 'Двойная вершина',
    'double_bottom': 'Двойное дно',
    'head_shoulders': 'Голова и плечи',
    'cup_handle': 'Чашка с ручкой',
    'fractal': 'Пробой фрактальной линии (19)',
    'fake_breakout': 'Ложный пробой уровня'
};

// Маппинг числовых таймфреймов в строковые для кэша
const TIMEFRAME_MAP = {
    '60': '1h',
    '24': '1d',
    '7': '1wk',
    '31': '1mo'
};

export function generateSignal(candles, options = {}) {
    const { indicators = [], patterns = [], timeframe = '24' } = options;

    if (!candles || candles.length < 50) {
        return { signal: 'HOLD', description: 'Недостаточно данных' };
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    let ema50 = null, ema100 = null, rsi = null, adx = null;

    if (indicators.includes('ema')) {
        const ema50arr = calculateEMA(closes, 50);
        const ema100arr = calculateEMA(closes, 100);
        ema50 = ema50arr.length ? ema50arr[ema50arr.length - 1] : null;
        ema100 = ema100arr.length ? ema100arr[ema100arr.length - 1] : null;
    }

    if (indicators.includes('rsi')) {
        rsi = calculateRSI(closes, 14);
    }

    if (indicators.includes('adx')) {
        adx = calculateADX(highs, lows, closes, 14);
    }

    const lastPrice = closes[closes.length - 1];
    let signal = 'HOLD';
    let description = '';
    let indicatorDescription = '';

    // --- ИНДИКАТОРЫ (если выбраны) ---
    if (indicators.length > 0) {
        if (indicators.includes('adx') && adx !== null && adx < ADX_THRESHOLD) {
            indicatorDescription = `Нет тренда (ADX=${adx.toFixed(1)})`;
        } else if (indicators.includes('ema') && indicators.includes('rsi')) {
            if (ema100 !== null && rsi !== null) {
                if (lastPrice > ema100 && rsi > 40 && rsi < 60) {
                    signal = 'BUY';
                    indicatorDescription = `Восходящий тренд, RSI=${rsi.toFixed(1)}, ADX=${adx?.toFixed(1) || 'Н/Д'}`;
                } else if (lastPrice < ema100 && rsi > 40 && rsi < 60) {
                    signal = 'SELL';
                    indicatorDescription = `Нисходящий тренд, RSI=${rsi.toFixed(1)}, ADX=${adx?.toFixed(1) || 'Н/Д'}`;
                } else if (rsi >= 70) {
                    indicatorDescription = `Перекупленность (RSI=${rsi.toFixed(1)}), ждём отката`;
                } else if (rsi <= 30) {
                    indicatorDescription = `Перепроданность (RSI=${rsi.toFixed(1)}), ждём отката`;
                } else {
                    indicatorDescription = `Тренд есть, но RSI=${rsi.toFixed(1)} вне зоны входа`;
                }
            } else {
                indicatorDescription = 'Недостаточно данных для EMA/RSI';
            }
        } else if (indicators.includes('rsi') && rsi !== null) {
            if (rsi > 70) {
                signal = 'SELL';
                indicatorDescription = `Перекупленность (RSI=${rsi.toFixed(1)})`;
            } else if (rsi < 30) {
                signal = 'BUY';
                indicatorDescription = `Перепроданность (RSI=${rsi.toFixed(1)})`;
            } else {
                indicatorDescription = `RSI=${rsi.toFixed(1)} в нейтральной зоне`;
            }
        } else if (indicators.includes('ema') && ema100 !== null) {
            if (lastPrice > ema100) {
                signal = 'BUY';
                indicatorDescription = `Цена выше EMA100 (${ema100.toFixed(2)})`;
            } else {
                signal = 'SELL';
                indicatorDescription = `Цена ниже EMA100 (${ema100.toFixed(2)})`;
            }
        } else if (indicators.includes('adx') && adx !== null) {
            if (adx > ADX_THRESHOLD) {
                indicatorDescription = `Сильный тренд (ADX=${adx.toFixed(1)})`;
            } else {
                indicatorDescription = `Слабый тренд (ADX=${adx.toFixed(1)})`;
            }
        }
    }

    // --- ПАТТЕРНЫ (всегда, если выбраны) ---
    let patternResults = [];
    if (patterns.length > 0) {
        // Очищаем кэш фракталов при каждом новом сканировании
        clearFractalCache();
        
        // Преобразуем строковые паттерны в имена для регистра
        const patternNames = patterns.map(p => PATTERN_NAME_MAP[p] || p);
        
        // Получаем строковый таймфрейм для кэша
        const tfString = TIMEFRAME_MAP[timeframe] || '1d';
        
        // Анализируем с передачей таймфрейма
        patternResults = PatternRegistry.analyzeSymbol(candles, patternNames, tfString);

        if (patternResults.length > 0) {
            const p = patternResults[0];
            signal = p.signal;
            description = p.description;
        } else {
            description = 'Паттерны не найдены';
        }
    }

    // Формируем финальный результат
    if (patterns.length === 0 && indicators.length > 0) {
        description = indicatorDescription;
    } else if (patterns.length > 0 && patternResults.length === 0) {
        // Паттерны выбраны, но не найдены
    } else if (patterns.length > 0 && patternResults.length > 0) {
        // Паттерны найдены
    } else if (indicators.length === 0 && patterns.length === 0) {
        description = 'Выберите индикаторы или паттерны';
    }

    return {
        signal,
        description,
        indicators: { ema50, ema100, rsi, adx },
        patterns: patternResults
    };
}
