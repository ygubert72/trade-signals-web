// js/indicators/rsi.js

export function calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return null;

    let avgGain = 0;
    let avgLoss = 0;

    // Первый период - простое среднее
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) avgGain += diff;
        else avgLoss -= diff;
    }

    avgGain /= period;
    avgLoss /= period;

    if (avgLoss === 0) return 100;
    if (avgGain === 0) return 0;

    // Экспоненциальное сглаживание для остальных значений
    const smoothing = 1 / period;
    let currentGain = avgGain;
    let currentLoss = avgLoss;

    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        
        if (diff >= 0) {
            currentGain = currentGain * (1 - smoothing) + diff * smoothing;
            currentLoss = currentLoss * (1 - smoothing);
        } else {
            currentGain = currentGain * (1 - smoothing);
            currentLoss = currentLoss * (1 - smoothing) + (-diff) * smoothing;
        }
    }

    const rs = currentGain / currentLoss;
    return 100 - (100 / (1 + rs));
}
