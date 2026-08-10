// js/patterns/pinbar.js

export class PinBarPattern {
    name = 'Пин-бары на экстремумах';
    confidence = 'high';

    detect(candles) {
        if (candles.length < 10) return null;

        const last = candles[candles.length - 1];
        
        // ============================================
        // ШАГ 1: Проверяем, что свеча - пин-бар по геометрии
        // ============================================
        const body = Math.abs(last.close - last.open);
        const upperShadow = last.high - Math.max(last.close, last.open);
        const lowerShadow = Math.min(last.close, last.open) - last.low;
        
        // Пин-бар должен иметь маленькое тело и длинную тень
        if (body > (upperShadow + lowerShadow) / 1.5) return null;
        
        const priceChange = last.close - last.open;

        // ============================================
        // ШАГ 2: Поиск БЫЧЬЕГО пин-бара (с приоритетом на свежие экстремумы)
        // ============================================
        if (lowerShadow >= upperShadow && priceChange > 0) {
            // Проверяем, является ли свеча экстремумом
            const lookback = findExtremeWindow(candles, 'low', last.low);
            
            if (lookback !== null) {
                // Определяем важность экстремума
                const importance = determineImportance(candles, lookback, 'low', last.low);
                
                return {
                    signal: 'BUY',
                    description: `BUY сигнал на локальном минимуме (${lookback} свечей назад)`,
                    confidence: importance === 'high' ? 'high' : 'medium'
                };
            }
        }

        // ============================================
        // ШАГ 3: Поиск МЕДВЕЖЬЕГО пин-бара
        // ============================================
        if (upperShadow >= lowerShadow && priceChange < 0) {
            const lookback = findExtremeWindow(candles, 'high', last.high);
            
            if (lookback !== null) {
                const importance = determineImportance(candles, lookback, 'high', last.high);
                
                return {
                    signal: 'SELL',
                    description: `SELL сигнал на локальном максимуме (${lookback} свечей назад)`,
                    confidence: importance === 'high' ? 'high' : 'medium'
                };
            }
        }

        return null;
    }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Находит, насколько далеко текущий экстремум является локальным
 * Возвращает: количество свечей назад или null
 */
function findExtremeWindow(candles, type, currentValue) {
    // Проверяем в расширяющемся окне: сначала 2 свечи, потом 5, потом 10
    const windows = [2, 5, 10];
    
    for (const windowSize of windows) {
        if (candles.length < windowSize + 1) continue;
        
        const previousValues = candles
            .slice(candles.length - windowSize - 1, candles.length - 1)
            .map(c => c[type]);
        
        const isExtreme = type === 'low' 
            ? currentValue < Math.min(...previousValues)
            : currentValue > Math.max(...previousValues);
        
        if (isExtreme) {
            return windowSize;
        }
    }
    
    return null;
}

/**
 * Определяет важность экстремума на основе:
 * 1. Насколько он свежий (2 свечи = высокая важность)
 * 2. Объем торгов (если есть)
 * 3. Соотношение с предыдущими экстремумами
 */
function determineImportance(candles, lookback, type, currentValue) {
    // Фактор 1: Свежесть
    if (lookback <= 2) return 'high';
    if (lookback <= 5) return 'medium';
    
    // Фактор 2: Объем (если доступен)
    const lastVolume = candles[candles.length - 1].volume || 0;
    const avgVolume = candles
        .slice(candles.length - 10, candles.length - 1)
        .reduce((sum, c) => sum + (c.volume || 0), 0) / 10;
    
    if (lastVolume > avgVolume * 1.5) return 'high';
    if (lastVolume > avgVolume * 1.2) return 'medium';
    
    // Фактор 3: Насколько сильный экстремум
    const prevValues = candles
        .slice(candles.length - 15, candles.length - 1)
        .map(c => c[type]);
    
    const minPrev = Math.min(...prevValues);
    const maxPrev = Math.max(...prevValues);
    
    if (type === 'low') {
        const diff = (minPrev - currentValue) / minPrev;
        if (diff > 0.03) return 'high';  // Пробили минимум на 3%+
        if (diff > 0.01) return 'medium';
    } else {
        const diff = (currentValue - maxPrev) / maxPrev;
        if (diff > 0.03) return 'high';
        if (diff > 0.01) return 'medium';
    }
    
    return 'low';
}
