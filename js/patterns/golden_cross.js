// js/patterns/golden_cross.js

import { calculateEMA } from '../indicators/ema.js';

export class GoldenCrossPattern {
    name = 'Золотой крест (50/200)';
    confidence = 'high';

    detect(candles) {
        if (candles.length < 200) return null;

        const closes = candles.map(c => c.close);
        const ema50 = calculateEMA(closes, 50);
        const ema200 = calculateEMA(closes, 200);

        if (ema50.length < 2 || ema200.length < 2) return null;

        const prev50 = ema50[ema50.length - 2];
        const curr50 = ema50[ema50.length - 1];
        const prev200 = ema200[ema200.length - 2];
        const curr200 = ema200[ema200.length - 1];

        if (prev50 <= prev200 && curr50 > curr200) {
            return {
                signal: 'BUY',
                description: '50MA пересекла 200MA снизу вверх',
                confidence: this.confidence
            };
        }

        return null;
    }
}
