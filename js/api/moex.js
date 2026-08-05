// js/api/moex.js

export async function fetchCandles(symbol, interval, limit = 150) {
    const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities/${symbol}/candles.json`;

    try {
        const response = await fetch(`${url}?interval=${interval}&limit=${limit}`);
        const data = await response.json();

        const candlesData = data?.candles?.data || [];
        if (!candlesData.length) return [];

        return candlesData.map(candle => ({
            date: new Date(candle[6]),
            open: +candle[0],
            high: +candle[2],
            low: +candle[3],
            close: +candle[1],
            volume: +candle[5] || 0
        }));
    } catch (error) {
        console.error(`Ошибка загрузки ${symbol}:`, error);
        return [];
    }
}
