// js/api/moex.js

// Базовый URL для API MOEX
const MOEX_API = 'https://iss.moex.com/iss/engines/futures/markets/forts/securities';

// ============ АГРЕГАЦИЯ ДАННЫХ ============

function aggregateCandles(hourlyCandles, targetInterval) {
    if (!hourlyCandles || hourlyCandles.length === 0) return [];
    
    if (targetInterval === '1h') {
        return hourlyCandles;
    }
    
    const grouped = {};
    
    hourlyCandles.forEach(candle => {
        const date = new Date(candle.date);
        let key;
        
        if (targetInterval === '1d') {
            key = date.toISOString().split('T')[0];
        } else if (targetInterval === '1wk') {
            const year = date.getFullYear();
            const week = getWeekNumber(date);
            key = `${year}-W${week}`;
        } else if (targetInterval === '1mo') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
            return hourlyCandles;
        }
        
        if (!grouped[key]) {
            grouped[key] = {
                date: new Date(date),
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume || 0,
                count: 1
            };
        } else {
            const g = grouped[key];
            g.high = Math.max(g.high, candle.high);
            g.low = Math.min(g.low, candle.low);
            g.close = candle.close;
            g.volume = (g.volume || 0) + (candle.volume || 0);
            g.count++;
        }
    });
    
    return Object.values(grouped)
        .map(g => ({
            date: g.date,
            open: g.open,
            high: g.high,
            low: g.low,
            close: g.close,
            volume: g.volume || 0
        }))
        .sort((a, b) => a.date - b.date);
}

function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// ============ ФЬЮЧЕРСЫ ============

export async function fetchCandles(symbol, interval, limit = 150) {
    const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities/${symbol}/candles.json`;
    const hourlyLimit = Math.min(limit * 24, 2000);
    
    try {
        const params = new URLSearchParams({
            interval: 60,
            limit: hourlyLimit
        });
        
        const response = await fetch(`${url}?${params.toString()}`);
        const data = await response.json();
        const candlesData = data?.candles?.data || [];
        
        if (!candlesData || candlesData.length === 0) {
            return [];
        }
        
        const hourly = candlesData.map(candle => ({
            date: new Date(candle[6]),
            open: +candle[0],
            high: +candle[2],
            low: +candle[3],
            close: +candle[1],
            volume: +candle[5] || 0
        }));
        
        const aggregated = aggregateCandles(hourly, interval);
        return aggregated.slice(-limit);
        
    } catch (error) {
        console.error(`Ошибка загрузки данных для ${symbol}:`, error);
        return [];
    }
}

// ============ АКЦИИ ============

export async function fetchStockCandles(symbol, interval, limit = 150) {
    const moexSymbol = symbol.replace('.ME', '');
    
    const intervalMap = { '1h': 60, '1d': 24, '1wk': 7, '1mo': 31 };
    const moexInterval = intervalMap[interval] || 24;
    
    const limitMap = { '1h': 200, '1d': 150, '1wk': 100, '1mo': 60 };
    const moexLimit = limitMap[interval] || 150;
    
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
        const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?limit=200`;
        const response = await fetch(url);
        const data = await response.json();
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Находим ВСЕ контракты
        const contracts = securities
            .filter(row => row[assetCodeIdx] === assetCode)
            .map(row => ({
                secid: row[secidIdx],
                lastTradeDate: row[lastTradeDateIdx]
            }))
            .filter(c => c.secid && c.lastTradeDate);
        
        if (contracts.length === 0) return null;
        
        // 🔥 СОРТИРУЕМ ПО ВОЗРАСТАНИЮ (от самой ранней к самой поздней)
        contracts.sort((a, b) => new Date(a.lastTradeDate) - new Date(b.lastTradeDate));
        
        // Ищем ближайший контракт с датой экспирации > сегодня
        const futureContracts = contracts.filter(c => new Date(c.lastTradeDate) > today);
        
        if (futureContracts.length === 0) {
            // Если нет будущих контрактов, берем самый поздний из доступных
            return contracts[contracts.length - 1].secid;
        }
        
        // Возвращаем самый ближайший (самый ранний) контракт
        return futureContracts[0].secid;
        
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
