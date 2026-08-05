// js/api/moex.js — добавить в конец

/**
 * 🔥 ПОЛУЧЕНИЕ ДАННЫХ ПО АКЦИЯМ (MOEX)
 * @param {string} symbol - Тикер акции (например, 'SBER.ME')
 * @param {string} interval - Интервал ('1d', '1h', '1wk', '1mo')
 * @param {number} limit - Количество свечей
 * @returns {Array} - Массив свечей
 */
export async function fetchStockCandles(symbol, interval, limit = 150) {
    // Убираем .ME для MOEX
    const moexSymbol = symbol.replace('.ME', '');
    
    // Интервалы для акций MOEX (в минутах)
    const intervalMap = {
        '1h': 60,
        '1d': 24,
        '1wk': 7,
        '1mo': 31
    };
    
    const moexInterval = intervalMap[interval] || 24;
    
    // Количество свечей
    const limitMap = {
        '1h': 200,
        '1d': 150,
        '1wk': 100,
        '1mo': 60
    };
    const moexLimit = limitMap[interval] || 150;
    
    try {
        // URL для акций MOEX
        const url = `https://iss.moex.com/iss/engines/stock/markets/shares/boards/tqbr/securities/${moexSymbol}/candles.json`;
        const params = new URLSearchParams({
            interval: moexInterval,
            limit: moexLimit
        });
        
        const response = await fetch(`${url}?${params.toString()}`);
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
        console.error(`Ошибка загрузки акции ${symbol}:`, error);
        return [];
    }
}
