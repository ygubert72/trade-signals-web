// js/indicators/ema.js

export function calculateEMA(data, period) {
    if (data.length < period) return [];

    const ema = [];
    const multiplier = 2 / (period + 1);

    // Первое значение = SMA
    let sum = 0;
    for (let i = 0; i < period; i++) sum += data[i];
    ema[period - 1] = sum / period;

    for (let i = period; i < data.length; i++) {
        ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }

    return ema;
}

export function getLastEMA(data, period) {
    const ema = calculateEMA(data, period);
    return ema.length ? ema[ema.length - 1] : null;
}
