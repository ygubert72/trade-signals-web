// js/indicators/rsi.js

export function calculateRSI(closes, period = 14) {
    if (!closes || closes.length < period + 1) return null;

    let avgGain = 0;
    let avgLoss = 0;

    // Первый период - простое среднее
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) {
            avgGain += diff;
        } else {
            avgLoss -= diff;
        }
    }

    avgGain /= period;
    avgLoss /= period;

    // Если нет изменений
    if (avgLoss === 0) return 100;
    if (avgGain === 0) return 0;

    // Сглаживание по Wilders (EMA-подобное)
    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        
        // Обновляем средние с использованием Wilders smoothing
        avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    }

    // Финальный расчет RSI
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    // Ограничиваем значения от 0 до 100
    return Math.min(Math.max(rsi, 0), 100);
}
