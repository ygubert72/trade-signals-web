// js/signals/generator.js

import { calculateEMA, getLastEMA } from '../indicators/ema.js';
import { calculateRSI } from '../indicators/rsi.js';
import { calculateADX } from '../indicators/adx.js';
import { PatternRegistry } from '../patterns/registry.js';
import { resetFractalCache } from '../patterns/fractal_breakout.js';

const ADX_THRESHOLD = 25;

export function generateSignal(candles) {
    if (!candles || candles.length < 50) {
        return { signal: 'HOLD', description: 'Недостаточно данных' };
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    const ema50 = calculateEMA(closes, 50);
    const ema100 = calculateEMA(closes, 100);
    const rsi = calculateRSI(closes, 14);
    const adx = calculateADX(highs, lows, closes, 14);

    const lastPrice = closes[closes.length - 1];
    const lastEma50 = ema50.length ? ema50[ema50.length - 1] : null;
    const lastEma100 = ema100.length ? ema100[ema100.length - 1] : null;

    if (!adx || adx < ADX_THRESHOLD) {
        return {
            signal: 'HOLD',
            description: `Нет тренда (ADX=${adx?.toFixed(1) || 'Н/Д'})`,
            indicators: { ema50: lastEma50, ema100: lastEma100, rsi, adx }
        };
    }

    if (rsi === null) {
        return {
            signal: 'HOLD',
            description: 'Нет данных RSI',
            indicators: { ema50: lastEma50, ema100: lastEma100, rsi, adx }
        };
    }

    // Восходящий тренд
    if (lastPrice > lastEma100) {
        if (rsi > 40 && rsi < 60) {
            return {
                signal: 'BUY',
                description: `Восходящий тренд, RSI=${rsi.toFixed(1)}, ADX=${adx.toFixed(1)}`,
                indicators: { ema50: lastEma50, ema100: lastEma100, rsi, adx }
            };
        } else if (rsi >= 70) {
            return {
                signal: 'HOLD',
                description: `Перекупленность (RSI=${rsi.toFixed(1)}), ждём отката`,
                indicators: { ema50: lastEma50, ema100: lastEma100, rsi, adx }
            };
        }
        return {
            signal: 'HOLD',
            description: `Тренд восходящий, но RSI=${rsi.toFixed(1)} вне зоны входа`,
            indicators: { ema50: lastEma50, ema100: lastEma100, rsi, adx }
        };
    }

    // Нисходящий тренд
    if (lastPrice < lastEma100) {
        if (rsi > 40 && rsi < 60) {
            return {
                signal: 'SELL',
                description: `Нисходящий тренд, RSI=${rsi.toFixed(1)}, ADX=${adx.toFixed(1)}`,
                indicators: { ema50: lastEma50, ema100: lastEma100, rsi, adx }
            };
        } else if (rsi <= 30) {
            return {
                signal: 'HOLD',
                description: `Перепроданность (RSI=${rsi.toFixed(1)}), ждём отката`,
                indicators: { ema50: lastEma50, ema100: lastEma100, rsi, adx }
            };
        }
        return {
            signal: 'HOLD',
            description: `Тренд нисходящий, но RSI=${rsi.toFixed(1)} вне зоны входа`,
            indicators: { ema50: lastEma50, ema100: lastEma100, rsi, adx }
        };
    }

    return {
        signal: 'HOLD',
        description: 'Цена около EMA100, тренд не определён',
        indicators: { ema50: lastEma50, ema100: lastEma100, rsi, adx }
    };
}

export function analyzeWithPatterns(candles, selectedPatterns) {
    resetFractalCache();
    const signalResult = generateSignal(candles);

    const patternResults = PatternRegistry.analyzeSymbol(candles, selectedPatterns);

    return {
        ...signalResult,
        patterns: patternResults
    };
}
