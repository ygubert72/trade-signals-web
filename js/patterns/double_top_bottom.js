// js/patterns/double_top_bottom.js

export class DoubleTopPattern {
    name = 'Двойная вершина';
    confidence = 'medium';

    detect(candles) {
        if (candles.length < 40) return null;

        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const closes = candles.map(c => c.close);

        // Находим локальные максимумы
        const peaks = [];
        for (let i = 5; i < highs.length - 5; i++) {
            let isPeak = true;
            for (let j = 1; j <= 5; j++) {
                if (highs[i] <= highs[i - j] || highs[i] <= highs[i + j]) {
                    isPeak = false;
                    break;
                }
            }
            if (isPeak) peaks.push({ index: i, price: highs[i] });
        }

        if (peaks.length < 2) return null;

        // Ищем два последних пика
        for (let i = peaks.length - 1; i > 0; i--) {
            const peak2 = peaks[i];
            const peak1 = peaks[i - 1];

            if (peak2.index - peak1.index < 5) continue;

            const priceDiff = Math.abs(peak2.price - peak1.price);
            const avgPrice = (peak2.price + peak1.price) / 2;
            if (priceDiff / avgPrice > 0.03) continue;

            const betweenLows = lows.slice(peak1.index, peak2.index + 1);
            const minBetween = Math.min(...betweenLows);
            if ((peak1.price - minBetween) / peak1.price < 0.02) continue;

            if (peak2.index + 3 >= closes.length) continue;

            const closesAfter = closes.slice(peak2.index + 1, peak2.index + 4);
            if (closesAfter.length && closesAfter.reduce((a, b) => a + b, 0) / closesAfter.length < peak2.price) {
                return {
                    signal: 'SELL',
                    description: `Двойная вершина на уровнях ${peak1.price.toFixed(2)} и ${peak2.price.toFixed(2)}`,
                    confidence: this.confidence
                };
            }
        }

        return null;
    }
}

export class DoubleBottomPattern {
    name = 'Двойное дно';
    confidence = 'medium';

    detect(candles) {
        if (candles.length < 40) return null;

        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const closes = candles.map(c => c.close);

        const troughs = [];
        for (let i = 5; i < lows.length - 5; i++) {
            let isTrough = true;
            for (let j = 1; j <= 5; j++) {
                if (lows[i] >= lows[i - j] || lows[i] >= lows[i + j]) {
                    isTrough = false;
                    break;
                }
            }
            if (isTrough) troughs.push({ index: i, price: lows[i] });
        }

        if (troughs.length < 2) return null;

        for (let i = troughs.length - 1; i > 0; i--) {
            const trough2 = troughs[i];
            const trough1 = troughs[i - 1];

            if (trough2.index - trough1.index < 5) continue;

            const priceDiff = Math.abs(trough2.price - trough1.price);
            const avgPrice = (trough2.price + trough1.price) / 2;
            if (priceDiff / avgPrice > 0.03) continue;

            const betweenHighs = highs.slice(trough1.index, trough2.index + 1);
            const maxBetween = Math.max(...betweenHighs);
            if ((maxBetween - trough1.price) / trough1.price < 0.02) continue;

            if (trough2.index + 3 >= closes.length) continue;

            const closesAfter = closes.slice(trough2.index + 1, trough2.index + 4);
            if (closesAfter.length && closesAfter.reduce((a, b) => a + b, 0) / closesAfter.length > trough2.price) {
                return {
                    signal: 'BUY',
                    description: `Двойное дно на уровнях ${trough1.price.toFixed(2)} и ${trough2.price.toFixed(2)}`,
                    confidence: this.confidence
                };
            }
        }

        return null;
    }
}
