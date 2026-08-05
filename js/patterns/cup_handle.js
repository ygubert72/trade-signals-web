// js/patterns/cup_handle.js

export class CupHandlePattern {
    name = 'Чашка с ручкой';
    confidence = 'high';

    detect(candles) {
        if (candles.length < 40) return null;

        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const closes = candles.map(c => c.close);

        const troughs = [];
        for (let i = 10; i < lows.length - 10; i++) {
            if (lows[i] < lows[i-1] && lows[i] < lows[i-2] &&
                lows[i] < lows[i-5] && lows[i] < lows[i-10] &&
                lows[i] < lows[i+1] && lows[i] < lows[i+2] &&
                lows[i] < lows[i+5] && lows[i] < lows[i+10]) {
                troughs.push({ index: i, price: lows[i] });
            }
        }

        if (troughs.length < 1) return null;

        const cupBottom = troughs[troughs.length - 1];

        const leftStart = Math.max(0, cupBottom.index - 25);
        const rightEnd = Math.min(highs.length, cupBottom.index + 25);

        const leftRim = Math.max(...highs.slice(leftStart, cupBottom.index));
        const rightRim = Math.max(...highs.slice(cupBottom.index, rightEnd));

        if (Math.abs(leftRim - rightRim) / leftRim > 0.03) return null;

        if ((leftRim - cupBottom.price) / leftRim < 0.05) return null;

        const handleStart = rightEnd - 1;
        const handleEnd = Math.min(closes.length, handleStart + 10);

        if (handleEnd >= closes.length) return null;

        const handleHigh = Math.max(...highs.slice(handleStart, handleEnd));

        if (handleHigh > rightRim * 0.97) return null;

        if (closes[closes.length - 1] > rightRim) {
            return {
                signal: 'BUY',
                description: 'Чашка с ручкой (бычий разворот)',
                confidence: this.confidence
            };
        }

        return null;
    }
}
