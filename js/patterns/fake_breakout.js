// js/patterns/fake_breakout.js

export class FakeBreakoutPattern {
    name = 'Ложный пробой уровня';
    confidence = 'medium';

    detect(candles) {
        const window = 20;
        const confirmationBars = 3;

        if (candles.length < window + confirmationBars + 5) return null;

        const levelHigh = Math.max(...candles.slice(-window - 1, -1).map(c => c.high));
        const levelLow = Math.min(...candles.slice(-window - 1, -1).map(c => c.low));

        const afterLevel = candles.slice(-window - 1);

        // Ложный пробой вверх (SELL)
        for (let i = 0; i < afterLevel.length; i++) {
            const candle = afterLevel[i];

            if (candle.high > levelHigh && candle.close > levelHigh) {
                if (i + confirmationBars >= afterLevel.length) break;

                const futureBars = afterLevel.slice(i + 1, i + confirmationBars + 1);
                if (Math.min(...futureBars.map(c => c.close)) <= levelHigh) {
                    const avgVolume = candles.slice(-window - 1, -1).reduce((s, c) => s + c.volume, 0) / window;
                    const isHighVolume = candle.volume > avgVolume * 1.2;

                    return {
                        signal: 'SELL',
                        description: `Ложный пробой вверх: цена пробила ${levelHigh.toFixed(2)} и вернулась обратно`,
                        confidence: isHighVolume ? 'high' : this.confidence
                    };
                } else break;
            }

            // Ложный пробой вниз (BUY)
            if (candle.low < levelLow && candle.close < levelLow) {
                if (i + confirmationBars >= afterLevel.length) break;

                const futureBars = afterLevel.slice(i + 1, i + confirmationBars + 1);
                if (Math.max(...futureBars.map(c => c.close)) >= levelLow) {
                    const avgVolume = candles.slice(-window - 1, -1).reduce((s, c) => s + c.volume, 0) / window;
                    const isHighVolume = candle.volume > avgVolume * 1.2;

                    return {
                        signal: 'BUY',
                        description: `Ложный пробой вниз: цена пробила ${levelLow.toFixed(2)} и вернулась обратно`,
                        confidence: isHighVolume ? 'high' : this.confidence
                    };
                } else break;
            }
        }

        return null;
    }
}
