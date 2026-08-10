// js/patterns/breakout.js

export class BreakoutPattern {
    name = 'Пробой локального уровня';
    confidence = 'medium';

    detect(candles) {
        // Увеличиваем окно до 50-100 свечей
        const windowSize = Math.min(100, Math.max(50, Math.floor(candles.length * 0.7)));
        
        if (candles.length < windowSize + 2) return null;

        // Берем предпоследнюю свечу для определения уровня
        // (чтобы не использовать текущую для построения уровня)
        const prevCandles = candles.slice(candles.length - windowSize - 1, candles.length - 1);
        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2];

        const localHigh = Math.max(...prevCandles.map(c => c.high));
        const localLow = Math.min(...prevCandles.map(c => c.low));

        // Проверяем, касался ли уровень ранее (для усиления сигнала)
        const touchesHigh = prevCandles.filter(c => c.high >= localHigh * 0.995).length;
        const touchesLow = prevCandles.filter(c => c.low <= localLow * 1.005).length;

        // ============================================
        // BUY сигнал (пробой вверх)
        // ============================================
        // НЕ требуем закрытия свечи за уровнем - достаточно касания или незначительного пробоя
        const breakoutUp = last.high > localHigh && last.close > last.open;
        const touchUp = last.high >= localHigh * 0.998 && last.close > last.open;
        
        if ((breakoutUp || touchUp) && last.close > prev.close) {
            // Проверяем подтверждение - смотрим на 5-7 свечей вперед
            // (в реальном коде это будет проверено при следующем вызове)
            const confirmationBars = Math.min(7, Math.max(5, Math.floor(candles.length * 0.05)));
            
            // Если уровень касались 3+ раз - это сильный уровень
            const strengthBonus = touchesHigh >= 3 ? 'high' : 'medium';
            
            return {
                signal: 'BUY',
                description: `BUY при пробое/касании уровня сопротивления (${touchesHigh} касаний)`,
                confidence: strengthBonus
            };
        }

        // ============================================
        // SELL сигнал (пробой вниз)
        // ============================================
        const breakoutDown = last.low < localLow && last.close < last.open;
        const touchDown = last.low <= localLow * 1.002 && last.close < last.open;
        
        if ((breakoutDown || touchDown) && last.close < prev.close) {
            const confirmationBars = Math.min(7, Math.max(5, Math.floor(candles.length * 0.05)));
            const strengthBonus = touchesLow >= 3 ? 'high' : 'medium';
            
            return {
                signal: 'SELL',
                description: `SELL при пробое/касании уровня поддержки (${touchesLow} касаний)`,
                confidence: strengthBonus
            };
        }

        return null;
    }
}
