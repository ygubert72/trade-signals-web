// js/patterns/pinbar.js

export class PinBarPattern {
    name = 'Пин-бары на экстремумах';
    confidence = 'high';

    detect(candles) {
        if (candles.length < 3) return null;

        const last = candles[candles.length - 1];
        const prev1 = candles[candles.length - 2];
        const prev2 = candles[candles.length - 3];

        const body = Math.abs(last.close - last.open);
        const upperShadow = last.high - Math.max(last.close, last.open);
        const lowerShadow = Math.min(last.close, last.open) - last.low;

        if (body > (upperShadow + lowerShadow) / 1.5) return null;

        const priceChange = last.close - last.open;

        // Бычий пин-бар
        if (lowerShadow >= upperShadow && priceChange > 0) {
            if (last.low < prev1.low && last.low < prev2.low) {
                return {
                    signal: 'BUY',
                    description: 'BUY сигнал на локальном минимуме',
                    confidence: this.confidence
                };
            }
        }

        // Медвежий пин-бар
        if (upperShadow >= lowerShadow && priceChange < 0) {
            if (last.high > prev1.high && last.high > prev2.high) {
                return {
                    signal: 'SELL',
                    description: 'SELL сигнал на локальном максимуме',
                    confidence: this.confidence
                };
            }
        }

        return null;
    }
}
