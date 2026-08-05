// js/indicators/adx.js

export function calculateADX(highs, lows, closes, period = 14) {
    if (highs.length < period * 2) return null;

    const tr = [];
    const plusDM = [];
    const minusDM = [];

    for (let i = 1; i < highs.length; i++) {
        const highDiff = highs[i] - highs[i - 1];
        const lowDiff = lows[i - 1] - lows[i];

        // True Range
        const trValue = Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        );
        tr.push(trValue);

        // Directional Movement
        const dmPlus = (highDiff > lowDiff && highDiff > 0) ? highDiff : 0;
        const dmMinus = (lowDiff > highDiff && lowDiff > 0) ? lowDiff : 0;
        plusDM.push(dmPlus);
        minusDM.push(dmMinus);
    }

    // Если данных太少
    if (tr.length < period) return null;

    // Первые значения — SMA
    let atr = 0;
    let plusDI = 0;
    let minusDI = 0;
    for (let i = 0; i < period; i++) {
        atr += tr[i];
        plusDI += plusDM[i];
        minusDI += minusDM[i];
    }
    atr /= period;
    plusDI /= period;
    minusDI /= period;

    // Сглаживаем (EMA)
    const smoothing = 1 / period;
    const diPlusValues = [];
    const diMinusValues = [];
    const dxValues = [];

    for (let i = period; i < tr.length; i++) {
        atr = atr * (1 - smoothing) + tr[i] * smoothing;
        plusDI = plusDI * (1 - smoothing) + plusDM[i] * smoothing;
        minusDI = minusDI * (1 - smoothing) + minusDM[i] * smoothing;

        const diPlus = plusDI / atr * 100;
        const diMinus = minusDI / atr * 100;
        diPlusValues.push(diPlus);
        diMinusValues.push(diMinus);

        const dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;
        dxValues.push(dx);
    }

    if (dxValues.length < period) return null;

    // ADX = EMA от DX
    let adx = 0;
    for (let i = 0; i < period; i++) adx += dxValues[i];
    adx /= period;

    for (let i = period; i < dxValues.length; i++) {
        adx = adx * (1 - smoothing) + dxValues[i] * smoothing;
    }

    return adx;
}
