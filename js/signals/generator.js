import { calculateEMA } from '../indicators/ema.js';
import { calculateRSI } from '../indicators/rsi.js';
import { calculateADX } from '../indicators/adx.js';
import { PatternRegistry } from '../patterns/registry.js';
// ❌ УДАЛЕНА СТРОКА: import { resetFractalCache } from '../patterns/fractal_breakout.js';

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

export function generateSignal(candles, options = {}) {
    const { indicators = [], patterns = [] } = options;

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
    
    // === НОВАЯ ЛОГИКА: комбинированный сигнал ===
    let signal = 'HOLD';
    let description = '';
    let reasons = [];
    let indicatorSignal = null;
    let indicatorDescription = '';
    let patternSignals = [];

    // --- 1. Индикаторная часть ---
    if (indicators.length > 0) {
        if (indicators.includes('adx') && adx !== null && adx < ADX_THRESHOLD) {
            indicatorDescription = `Нет тренда (ADX=${adx.toFixed(1)})`;
            indicatorSignal = 'HOLD';
        } else if (indicators.includes('ema') && indicators.includes('rsi')) {
            if (ema100 !== null && rsi !== null) {
                if (lastPrice > ema100 && rsi > 40 && rsi < 60) {
                    indicatorSignal = 'BUY';
                    indicatorDescription = `Восходящий тренд, RSI=${rsi.toFixed(1)}`;
                } else if (lastPrice < ema100 && rsi > 40 && rsi < 60) {
                    indicatorSignal = 'SELL';
                    indicatorDescription = `Нисходящий тренд, RSI=${rsi.toFixed(1)}`;
                } else if (rsi >= 70) {
                    indicatorSignal = 'SELL';
                    indicatorDescription = `Перекупленность (RSI=${rsi.toFixed(1)})`;
                } else if (rsi <= 30) {
                    indicatorSignal = 'BUY';
                    indicatorDescription = `Перепроданность (RSI=${rsi.toFixed(1)})`;
                } else {
                    indicatorDescription = `RSI=${rsi.toFixed(1)} вне зоны входа`;
                }
            }
        } else if (indicators.includes('rsi') && rsi !== null) {
            if (rsi > 70) {
                indicatorSignal = 'SELL';
                indicatorDescription = `Перекупленность (RSI=${rsi.toFixed(1)})`;
            } else if (rsi < 30) {
                indicatorSignal = 'BUY';
                indicatorDescription = `Перепроданность (RSI=${rsi.toFixed(1)})`;
            } else {
                indicatorDescription = `RSI=${rsi.toFixed(1)} в нейтральной зоне`;
            }
        } else if (indicators.includes('ema') && ema100 !== null) {
            if (lastPrice > ema100) {
                indicatorSignal = 'BUY';
                indicatorDescription = `Цена выше EMA100 (${ema100.toFixed(2)})`;
            } else {
                indicatorSignal = 'SELL';
                indicatorDescription = `Цена ниже EMA100 (${ema100.toFixed(2)})`;
            }
        } else if (indicators.includes('adx') && adx !== null) {
            if (adx > ADX_THRESHOLD) {
                indicatorDescription = `Сильный тренд (ADX=${adx.toFixed(1)})`;
                // ADX сам по себе не дает направления
            } else {
                indicatorDescription = `Слабый тренд (ADX=${adx.toFixed(1)})`;
            }
        }
    }

    // --- 2. Паттерны ---
    let patternResults = [];
    if (patterns.length > 0) {
        // ❌ УДАЛЕН ВЫЗОВ: resetFractalCache();
        const patternNames = patterns.map(p => PATTERN_NAME_MAP[p] || p);
        patternResults = PatternRegistry.analyzeSymbol(candles, patternNames);
        
        // Собираем все сигналы от паттернов
        for (const p of patternResults) {
            patternSignals.push({
                signal: p.signal,
                description: p.description,
                confidence: p.confidence || 'medium'
            });
        }
    }

    // --- 3. Комбинируем результаты ---
    
    // Если нет индикаторов и нет паттернов
    if (indicators.length === 0 && patterns.length === 0) {
        return { signal: 'HOLD', description: 'Выберите индикаторы или паттерны', indicators: { ema50, ema100, rsi, adx }, patterns: [] };
    }

    // Если есть паттерны с high confidence — они имеют приоритет
    const highConfidencePatterns = patternSignals.filter(p => p.confidence === 'high');
    
    if (highConfidencePatterns.length > 0) {
        // Берем первый high confidence паттерн
        const primary = highConfidencePatterns[0];
        signal = primary.signal;
        description = primary.description;
        
        // Добавляем подтверждение от индикаторов, если совпадают
        if (indicatorSignal === signal) {
            description += ` (подтверждено индикаторами: ${indicatorDescription})`;
        } else if (indicatorSignal && indicatorSignal !== 'HOLD') {
            description += ` (⚠️ индикаторы показывают ${indicatorSignal}: ${indicatorDescription})`;
        }
        
        // Добавляем остальные паттерны как дополнительную информацию
        const otherPatterns = patternSignals.filter(p => p.confidence !== 'high' || p !== primary);
        if (otherPatterns.length > 0) {
            description += ` | Доп. паттерны: ${otherPatterns.map(p => p.description).join('; ')}`;
        }
    } 
    // Если есть индикаторный сигнал и нет high confidence паттернов
    else if (indicatorSignal && indicatorSignal !== 'HOLD') {
        signal = indicatorSignal;
        description = indicatorDescription;
        
        // Добавляем паттерны как дополнительную информацию
        if (patternSignals.length > 0) {
            const patternDescs = patternSignals.map(p => `${p.signal} (${p.confidence}): ${p.description}`).join('; ');
            description += ` | Паттерны: ${patternDescs}`;
            
            // Проверяем, совпадают ли паттерны с индикаторным сигналом
            const matchingPatterns = patternSignals.filter(p => p.signal === signal);
            if (matchingPatterns.length > 0) {
                description += ` (✅ подтверждено паттернами)`;
            }
        }
    }
    // Если есть только паттерны (без индикаторов)
    else if (patternSignals.length > 0) {
        // Берем паттерн с наивысшим приоритетом (high > medium > low)
        const priority = ['high', 'medium', 'low'];
        patternSignals.sort((a, b) => priority.indexOf(a.confidence) - priority.indexOf(b.confidence));
        
        const primary = patternSignals[0];
        signal = primary.signal;
        description = primary.description;
        
        if (patternSignals.length > 1) {
            const others = patternSignals.slice(1).map(p => `${p.signal} (${p.confidence})`).join('; ');
            description += ` | Другие паттерны: ${others}`;
        }
    }
    // Если только индикаторы
    else if (indicatorSignal) {
        signal = indicatorSignal;
        description = indicatorDescription;
    }
    // Ничего не найдено
    else {
        signal = 'HOLD';
        description = patterns.length > 0 ? 'Паттерны не найдены' : 'Сигналов нет';
    }

    return {
        signal,
        description,
        indicators: { ema50, ema100, rsi, adx },
        patterns: patternResults
    };
}
