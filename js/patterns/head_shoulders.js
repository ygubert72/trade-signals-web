// js/patterns/head_shoulders.js

export class HeadShouldersPattern {
    name = 'Голова и плечи';
    confidence = 'medium';

    detect(candles) {
        if (candles.length < 50) return null;

        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const closes = candles.map(c => c.close);
        const volumes = candles.map(c => c.volume);

        const peaks = [];
        for (let i = 3; i < highs.length - 3; i++) {
            let isPeak = true;
            for (let j = 1; j <= 3; j++) {
                if (highs[i] <= highs[i - j] || highs[i] <= highs[i + j]) {
                    isPeak = false;
                    break;
                }
            }
            if (isPeak) peaks.push({ index: i, price: highs[i], volume: volumes[i] || 0 });
        }

        if (peaks.length < 3) return null;

        for (let i = peaks.length - 1; i > 1; i--) {
            const rightShoulder = peaks[i];
            const head = peaks[i - 1];
            const leftShoulder = peaks[i - 2];

            const distLeftHead = head.index - leftShoulder.index;
            const distHeadRight = rightShoulder.index - head.index;

            if (distLeftHead < 5 || distHeadRight < 5) continue;
            if (distLeftHead > 30 || distHeadRight > 30) continue;

            if ((head.price - leftShoulder.price) / leftShoulder.price < 0.02) continue;
            if ((head.price - rightShoulder.price) / rightShoulder.price < 0.02) continue;

            const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price);
            const shoulderAvg = (leftShoulder.price + rightShoulder.price) / 2;
            if (shoulderDiff / shoulderAvg > 0.05) continue;

            const neckline1 = Math.min(...lows.slice(leftShoulder.index, head.index + 1));
            const neckline2 = Math.min(...lows.slice(head.index, rightShoulder.index + 1));
            const neckline = (neckline1 + neckline2) / 2;

            if (rightShoulder.index + 3 >= closes.length) continue;

            const closesAfter = closes.slice(rightShoulder.index + 1, rightShoulder.index + 4);
            if (!closesAfter.length) continue;

            const belowNeckline = closesAfter.filter(c => c < neckline).length;
            if (belowNeckline < 2) continue;

            if (rightShoulder.volume > head.volume * 1.1) continue;

            return {
                signal: 'SELL',
                description: `Голова и плечи: голова ${head.price.toFixed(2)}, шея ${neckline.toFixed(2)}`,
                confidence: this.confidence
            };
        }

        return null;
    }
}
