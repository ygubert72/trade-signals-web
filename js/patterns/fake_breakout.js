// js/patterns/fake_breakout.js

export class FakeBreakoutPattern {
    name = 'Ложный пробой уровня';
    confidence = 'medium';

    detect(candles) {
        // Увеличиваем окно до 50-100 свечей
        const windowSize = Math.min(100, Math.max(50, Math.floor(candles.length * 0.7)));
        // Расширяем окно подтверждения до 5-7 свечей
        const confirmationBars = Math.min(7, Math.max(5, Math.floor(candles.length * 0.05)));

        if (candles.length < windowSize + confirmationBars + 2) return null;

        // Берем предпоследнюю свечу для определения уровня
        const prevCandles = candles.slice(candles.length - windowSize - 1, candles.length - 1);
        const last = candles[candles.length - 1];

        const levelHigh = Math.max(...prevCandles.map(c => c.high));
        const levelLow = Math.min(...prevCandles.map(c => c.low));

        // Проверяем, сколько раз касались уровня
        const touchesHigh = prevCandles.filter(c => c.high >= levelHigh * 0.995).length;
        const touchesLow = prevCandles.filter(c => c.low <= levelLow * 1.005).length;

        // Берем свечи после текущей для проверки возврата
        const afterCurrent = candles.slice(candles.length - confirmationBars);

        // ============================================
        // ЛОЖНЫЙ ПРОБОЙ ВВЕРХ (SELL сигнал)
        // ============================================
        // НЕ требуем закрытия свечи за уровнем - достаточно касания или незначительного пробоя
        const fakeUp = last.high > levelHigh || last.high >= levelHigh * 0.998;
        const closeAbove = last.close > levelHigh;

        if (fakeUp && last.close > last.open) {
            // Проверяем, вернулась ли цена обратно в течение 5-7 свечей
            let returned = false;
            let returnDepth = 0;
            
            for (let i = 0; i < afterCurrent.length; i++) {
                const bar = afterCurrent[i];
                // Проверяем возврат ниже уровня (для ложного пробоя вверх)
                if (bar.close < levelHigh) {
                    returned = true;
                    // Вычисляем глубину возврата
                    returnDepth = (levelHigh - bar.close) / levelHigh;
                    break;
                }
            }

            if (returned) {
                // Проверяем объем на свече пробоя и на возврате
                const avgVolume = prevCandles.slice(-20).reduce((s, c) => s + (c.volume || 0), 0) / 20;
                const breakoutVolume = last.volume || 0;
                const returnVolume = afterCurrent.find(b => b.close < levelHigh)?.volume || 0;
                
                let confidence = this.confidence;
                if (breakoutVolume > avgVolume * 1.5 && returnVolume > avgVolume * 1.2) {
                    confidence = 'high';
                } else if (breakoutVolume > avgVolume * 1.2 || returnVolume > avgVolume * 1.2) {
                    confidence = 'medium';
                }

                // Уровень с 3+ касаниями дает более сильный сигнал
                if (touchesHigh >= 3) {
                    confidence = confidence === 'high' ? 'high' : 'medium';
                }

                const returnPercent = (returnDepth * 100).toFixed(1);
                return {
                    signal: 'SELL',
                    description: `Ложный пробой вверх: цена коснулась ${levelHigh.toFixed(2)} и вернулась на ${returnPercent}%`,
                    confidence: confidence
                };
            }
        }

        // ============================================
        // ЛОЖНЫЙ ПРОБОЙ ВНИЗ (BUY сигнал)
        // ============================================
        const fakeDown = last.low < levelLow || last.low <= levelLow * 1.002;
        const closeBelow = last.close < levelLow;

        if (fakeDown && last.close < last.open) {
            let returned = false;
            let returnDepth = 0;
            
            for (let i = 0; i < afterCurrent.length; i++) {
                const bar = afterCurrent[i];
                // Проверяем возврат выше уровня (для ложного пробоя вниз)
                if (bar.close > levelLow) {
                    returned = true;
                    returnDepth = (bar.close - levelLow) / levelLow;
                    break;
                }
            }

            if (returned) {
                const avgVolume = prevCandles.slice(-20).reduce((s, c) => s + (c.volume || 0), 0) / 20;
                const breakoutVolume = last.volume || 0;
                const returnVolume = afterCurrent.find(b => b.close > levelLow)?.volume || 0;
                
                let confidence = this.confidence;
                if (breakoutVolume > avgVolume * 1.5 && returnVolume > avgVolume * 1.2) {
                    confidence = 'high';
                } else if (breakoutVolume > avgVolume * 1.2 || returnVolume > avgVolume * 1.2) {
                    confidence = 'medium';
                }

                if (touchesLow >= 3) {
                    confidence = confidence === 'high' ? 'high' : 'medium';
                }

                const returnPercent = (returnDepth * 100).toFixed(1);
                return {
                    signal: 'BUY',
                    description: `Ложный пробой вниз: цена коснулась ${levelLow.toFixed(2)} и вернулась на ${returnPercent}%`,
                    confidence: confidence
                };
            }
        }

        return null;
    }
}
