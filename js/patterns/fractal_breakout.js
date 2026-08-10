// js/patterns/fractal_breakout.js

// Кэш с временем жизни
const signalCache = new Map();
const CACHE_TTL = {
    '1h': 4 * 60 * 60 * 1000,     // 4 часа
    '1d': 3 * 24 * 60 * 60 * 1000, // 3 дня
    '1wk': 14 * 24 * 60 * 60 * 1000, // 2 недели
    '1mo': 30 * 24 * 60 * 60 * 1000  // 30 дней
};

function cleanExpiredCache() {
    const now = Date.now();
    for (const [key, data] of signalCache.entries()) {
        if (now - data.timestamp > data.ttl) {
            signalCache.delete(key);
        }
    }
}

export function clearFractalCache() {
    signalCache.clear();
}

export class FractalBreakoutPattern {
    name = 'Пробой фрактальной линии (19)';
    confidence = 'medium';

    findFractals(candles, left = 9, right = 9) {
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const upperFractals = [];
        const lowerFractals = [];

        for (let i = left; i < candles.length - right; i++) {
            let isUpper = true;
            for (let j = 1; j <= left; j++) {
                if (highs[i] <= highs[i - j]) { isUpper = false; break; }
            }
            for (let j = 1; j <= right; j++) {
                if (highs[i] <= highs[i + j]) { isUpper = false; break; }
            }
            if (isUpper) upperFractals.push({ index: i, price: highs[i] });

            let isLower = true;
            for (let j = 1; j <= left; j++) {
                if (lows[i] >= lows[i - j]) { isLower = false; break; }
            }
            for (let j = 1; j <= right; j++) {
                if (lows[i] >= lows[i + j]) { isLower = false; break; }
            }
            if (isLower) lowerFractals.push({ index: i, price: lows[i] });
        }

        return { upperFractals, lowerFractals };
    }

    detect(candles, timeframe = '1d') {
        if (candles.length < 40) return null;

        cleanExpiredCache();

        const { upperFractals, lowerFractals } = this.findFractals(candles);
        const lastIdx = candles.length - 1;
        const lastClose = candles[lastIdx].close;

        const ttl = CACHE_TTL[timeframe] || CACHE_TTL['1d'];

        // BUY сигнал
        if (upperFractals.length >= 2) {
            const p1 = upperFractals[upperFractals.length - 2];
            const p2 = upperFractals[upperFractals.length - 1];

            const deltaIdx = p2.index - p1.index;
            if (deltaIdx !== 0) {
                const slope = (p2.price - p1.price) / deltaIdx;
                if (Math.abs(slope) < 1e-6) return null;

                const prevLine = p1.price + slope * (lastIdx - 1 - p1.index);
                const currLine = p1.price + slope * (lastIdx - p1.index);

                const key = `BUY_${p1.index}_${p2.index}`;
                
                const cached = signalCache.get(key);
                const now = Date.now();
                
                if (!cached || (now - cached.timestamp > cached.ttl)) {
                    const prevClose = candles[lastIdx - 1].close;
                    if (prevClose <= prevLine && lastClose > currLine) {
                        signalCache.set(key, {
                            timestamp: now,
                            ttl: ttl,
                            signal: 'BUY'
                        });
                        return {
                            signal: 'BUY',
                            description: 'BUY при пробое трендовой линии по фракталам (19)',
                            confidence: this.confidence
                        };
                    }
                }
            }
        }

        // SELL сигнал
        if (lowerFractals.length >= 2) {
            const p1 = lowerFractals[lowerFractals.length - 2];
            const p2 = lowerFractals[lowerFractals.length - 1];

            const deltaIdx = p2.index - p1.index;
            if (deltaIdx !== 0) {
                const slope = (p2.price - p1.price) / deltaIdx;
                if (Math.abs(slope) < 1e-6) return null;

                const prevLine = p1.price + slope * (lastIdx - 1 - p1.index);
                const currLine = p1.price + slope * (lastIdx - p1.index);

                const key = `SELL_${p1.index}_${p2.index}`;
                
                const cached = signalCache.get(key);
                const now = Date.now();
                
                if (!cached || (now - cached.timestamp > cached.ttl)) {
                    const prevClose = candles[lastIdx - 1].close;
                    if (prevClose >= prevLine && lastClose < currLine) {
                        signalCache.set(key, {
                            timestamp: now,
                            ttl: ttl,
                            signal: 'SELL'
                        });
                        return {
                            signal: 'SELL',
                            description: 'SELL при пробое трендовой линии по фракталам (19)',
                            confidence: this.confidence
                        };
                    }
                }
            }
        }

        return null;
    }
}
