// js/indicators/adx.js

export function calculateADX(highs, lows, closes, period = 14) {
    if (highs.length < period * 2) return null;

    const tr = [];
    const plusDM = [];
    const minusDM = [];

    for (let i = 1; i < highs.length; i++) {
        const highDiff = highs[i] - highs[i - 1];
        const lowDiff = lows[i - 1] - lows[i];

        const trValue = Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        );
        tr.push(trValue);

        plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
        minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
    }

    // ATR
    let atr = 0;
    for (let i = 0; i < period && i < tr.length; i++) atr += tr[i];
    atr /= Math.min(period, tr.length);

    let adxSum = 0;
    let count = 0;
    for (let i = period; i < tr.length; i++) {
        const diPlus = (plusDM[i] / atr) * 100;
        const diMinus = (minusDM[i] / atr) * 100;
        if (diPlus + diMinus === 0) continue;
        const dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;
        adxSum += dx;
        count++;
    }

    return count > 0 ? adxSum / count : null;
}
