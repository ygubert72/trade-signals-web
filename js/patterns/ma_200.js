// js/patterns/ma_200.js

import { calculateEMA } from '../indicators/ema.js';

export class MA200TouchPattern {
    name = 'Касание/пробой 200MA';
    confidence = 'medium';

    detect(candles) {
        if (candles.length < 200) return null;

        const closes = candles.map(c => c.close);
        const ema200 = calculateEMA(closes, 200);

        if (ema200.length < 2) return null;

        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2];
        const currentMA200 = ema200[ema200.length - 1];
        const prevMA200 = ema200[ema200.length - 2];

        // Пробой вверх
        if (prev.close <= prevMA200 && last.close > currentMA200) {
            return {
                signal: 'BUY',
                description: 'Цена пробила 200MA вверх',
                confidence: this.confidence
            };
        }

        // Касание сверху
        if (Math.abs(last.close - currentMA200) / currentMA200 < 0.02) {
            if (last.close > currentMA200 && last.close > prev.close) {
                return {
                    signal: 'BUY',
                    description: 'Цена отскочила от 200MA вверх',
                    confidence: this.confidence
                };
            }
        }

        // Пробой вниз
        if (prev.close >= prevMA200 && last.close < currentMA200) {
            return {
                signal: 'SELL',
                description: 'Цена пробила 200MA вниз',
                confidence: this.confidence
            };
        }

        return null;
    }
}
