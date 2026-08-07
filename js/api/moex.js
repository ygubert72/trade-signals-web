// js/api/moex.js

// Базовый URL для API MOEX
const MOEX_API = 'https://iss.moex.com/iss/engines/futures/markets/forts/securities';

// ============ ФЬЮЧЕРСЫ ============

export async function fetchCandles(symbol, interval, limit = 250) {
    const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities/${symbol}/candles.json`;
    const params = new URLSearchParams({
        interval: interval,
        limit: limit
    });

    try {
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
        console.error(`Ошибка загрузки данных для ${symbol}:`, error);
        return [];
    }
}

export async function fetchAllSymbols(symbols, interval, limit = 250) {
    const results = {};
    for (const [key, symbol] of Object.entries(symbols)) {
        const candles = await fetchCandles(symbol, interval, limit);
        if (candles.length) {
            results[key] = candles;
        }
    }
    return results;
}

// ============ АКЦИИ ============

export async function fetchStockCandles(symbol, interval, limit = 250) {
    const moexSymbol = symbol.replace('.ME', '');
    
    const intervalMap = { '1h': 60, '1d': 24, '1wk': 7, '1mo': 31 };
    const moexInterval = intervalMap[interval] || 24;
    
    // Увеличенные лимиты для каждого таймфрейма
    const limitMap = { '1h': 250, '1d': 250, '1wk': 200, '1mo': 120 };
    const moexLimit = limitMap[interval] || 250;
    
    try {
        const url = `https://iss.moex.com/iss/engines/stock/markets/shares/boards/tqbr/securities/${moexSymbol}/candles.json`;
        const params = new URLSearchParams({ interval: moexInterval, limit: moexLimit });
        
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

// ============ АВТОПОИСК ТИКЕРОВ ============

export async function getActualFuturesTicker(assetCode) {
    try {
        const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?limit=100`;
        const response = await fetch(url);
        const data = await response.json();
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        
        const contracts = securities
            .filter(row => row[assetCodeIdx] === assetCode)
            .map(row => ({
                secid: row[secidIdx],
                lastTradeDate: row[lastTradeDateIdx]
            }))
            .filter(c => c.lastTradeDate);
        
        if (contracts.length === 0) return null;
        
        contracts.sort((a, b) => new Date(b.lastTradeDate) - new Date(a.lastTradeDate));
        return contracts[0].secid;
        
    } catch (error) {
        console.error(`Ошибка получения тикера для ${assetCode}:`, error);
        return null;
    }
}

export async function getActualFuturesTickers(symbols) {
    const result = {};
    for (const [key, assetCode] of Object.entries(symbols)) {
        const ticker = await getActualFuturesTicker(assetCode);
        if (ticker) {
            result[key] = ticker;
        }
    }
    return result;
}
