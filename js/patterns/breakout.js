// js/patterns/breakout.js

export class BreakoutPattern {
    name = 'Пробой локального уровня';
    confidence = 'medium';

    detect(candles) {
        if (candles.length < 20) return null;

        const last = candles[candles.length - 1];
        const prev = candles.slice(candles.length - 21, -1);

        const localHigh = Math.max(...prev.map(c => c.high));
        const localLow = Math.min(...prev.map(c => c.low));

        if (last.close > localHigh && last.close > last.open) {
            return {
                signal: 'BUY',
                description: 'BUY при пробое уровня сопротивления',
                confidence: this.confidence
            };
        }

        if (last.close < localLow && last.close < last.open) {
            return {
                signal: 'SELL',
                description: 'SELL при пробое уровня поддержки',
                confidence: this.confidence
            };
        }

        return null;
    }
}
