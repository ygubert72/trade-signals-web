// js/api/moex.js

const MOEX_API = 'https://iss.moex.com/iss';
const CACHE_TTL = 300000; // 5 минут
const cache = new Map();

// ============ КЭШИРОВАНИЕ ============

function getCached(url) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCache(url, data) {
    cache.set(url, { data, timestamp: Date.now() });
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const cached = getCached(url);
            if (cached) return cached;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            setCache(url, data);
            return data;
            
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
    return null;
}

function parseCandles(candlesData) {
    if (!candlesData || !candlesData.length) return [];
    
    return candlesData.map(candle => ({
        date: new Date(candle[6]),
        open: Number(candle[0]),
        high: Number(candle[2]),
        low: Number(candle[3]),
        close: Number(candle[1]),
        volume: Number(candle[5]) || 0
    }));
}

// ============ ФЬЮЧЕРСЫ С FALLBACK ============

export async function fetchCandles(symbol, interval, limit = 150) {
    if (!symbol) return [];
    
    // Маппинг интервалов MOEX
    const intervalMap = {
        '1h': 60,
        '1d': 24,
        '1wk': 7,
        '1mo': 31
    };
    
    // Пробуем разные интервалы, если основной не работает
    const intervalsToTry = [intervalMap[interval] || 24, 60, 10, 5];
    const uniqueIntervals = [...new Set(intervalsToTry)];
    
    for (const moexInterval of uniqueIntervals) {
        try {
            const url = `${MOEX_API}/engines/futures/markets/forts/securities/${symbol}/candles.json`;
            const params = new URLSearchParams({
                interval: moexInterval,
                limit: Math.min(limit, 500)
            });
            
            const data = await fetchWithRetry(`${url}?${params.toString()}`);
            const candlesData = data?.candles?.data || [];
            
            if (candlesData.length > 0) {
                return parseCandles(candlesData);
            }
        } catch (error) {
            // Пробуем следующий интервал
            continue;
        }
    }
    
    // Если ничего не загрузилось, пробуем без интервала (по умолчанию 24)
    try {
        const url = `${MOEX_API}/engines/futures/markets/forts/securities/${symbol}/candles.json`;
        const params = new URLSearchParams({
            limit: Math.min(limit, 500)
        });
        const data = await fetchWithRetry(`${url}?${params.toString()}`);
        const candlesData = data?.candles?.data || [];
        return parseCandles(candlesData);
    } catch (error) {
        console.error(`Ошибка загрузки фьючерса ${symbol}:`, error);
        return [];
    }
}

// ============ АКЦИИ С FALLBACK ============

export async function fetchStockCandles(symbol, interval, limit = 150) {
    if (!symbol) return [];
    
    const moexSymbol = symbol.replace('.ME', '');
    
    const intervalMap = {
        '1h': 60,
        '1d': 24,
        '1wk': 7,
        '1mo': 31
    };
    
    // Пробуем разные интервалы
    const intervalsToTry = [intervalMap[interval] || 24, 60, 10, 5];
    const uniqueIntervals = [...new Set(intervalsToTry)];
    
    for (const moexInterval of uniqueIntervals) {
        try {
            const url = `${MOEX_API}/engines/stock/markets/shares/boards/tqbr/securities/${moexSymbol}/candles.json`;
            const params = new URLSearchParams({
                interval: moexInterval,
                limit: Math.min(limit, 500)
            });
            
            const data = await fetchWithRetry(`${url}?${params.toString()}`);
            const candlesData = data?.candles?.data || [];
            
            if (candlesData.length > 0) {
                return parseCandles(candlesData);
            }
        } catch (error) {
            continue;
        }
    }
    
    // Пробуем без интервала
    try {
        const url = `${MOEX_API}/engines/stock/markets/shares/boards/tqbr/securities/${moexSymbol}/candles.json`;
        const params = new URLSearchParams({
            limit: Math.min(limit, 500)
        });
        const data = await fetchWithRetry(`${url}?${params.toString()}`);
        const candlesData = data?.candles?.data || [];
        return parseCandles(candlesData);
    } catch (error) {
        console.error(`Ошибка загрузки акции ${symbol}:`, error);
        return [];
    }
}

// ============ АВТОПОИСК ТИКЕРОВ ФЬЮЧЕРСОВ ============

export async function getActualFuturesTicker(assetCode) {
    if (!assetCode) return null;
    
    try {
        const url = `${MOEX_API}/engines/futures/markets/forts/securities.json?limit=200`;
        const data = await fetchWithRetry(url);
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        const shortNameIdx = columns.indexOf('SHORTNAME');
        
        const contracts = securities
            .filter(row => row[assetCodeIdx] === assetCode)
            .map(row => ({
                secid: row[secidIdx],
                lastTradeDate: row[lastTradeDateIdx],
                shortName: row[shortNameIdx] || ''
            }))
            .filter(c => c.secid && c.lastTradeDate);
        
        if (contracts.length === 0) return null;
        
        contracts.sort((a, b) => {
            const dateA = new Date(a.lastTradeDate);
            const dateB = new Date(b.lastTradeDate);
            return dateB - dateA;
        });
        
        return contracts[0].secid;
        
    } catch (error) {
        console.error(`Ошибка получения тикера для ${assetCode}:`, error);
        return null;
    }
}

export async function getActualFuturesTickers(symbols) {
    if (!symbols || typeof symbols !== 'object') return {};
    
    const result = {};
    const entries = Object.entries(symbols);
    
    const promises = entries.map(async ([key, assetCode]) => {
        const ticker = await getActualFuturesTicker(assetCode);
        if (ticker) {
            result[key] = ticker;
        }
    });
    
    await Promise.allSettled(promises);
    return result;
}

// ============ ПОЛУЧЕНИЕ ВСЕХ ТИКЕРОВ СРАЗУ ============

export async function getAllFuturesTickers(limit = 200) {
    try {
        const url = `${MOEX_API}/engines/futures/markets/forts/securities.json?limit=${limit}`;
        const data = await fetchWithRetry(url);
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        const shortNameIdx = columns.indexOf('SHORTNAME');
        
        const tickers = {};
        
        securities.forEach(row => {
            const secid = row[secidIdx];
            const assetCode = row[assetCodeIdx];
            const lastTradeDate = row[lastTradeDateIdx];
            
            if (secid && assetCode && lastTradeDate) {
                if (!tickers[assetCode] || new Date(lastTradeDate) > new Date(tickers[assetCode].date)) {
                    tickers[assetCode] = {
                        secid: secid,
                        date: lastTradeDate,
                        shortName: row[shortNameIdx] || ''
                    };
                }
            }
        });
        
        return tickers;
        
    } catch (error) {
        console.error('Ошибка получения всех тикеров:', error);
        return {};
    }
}
