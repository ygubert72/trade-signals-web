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

// ============ ЗАГРУЗКА ДАННЫХ ДЛЯ ОДНОГО КОНТРАКТА ============

async function fetchSingleContractCandles(symbol, limit = 500) {
    if (!symbol) return [];
    
    const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities/${symbol}/candles.json`;
    
    try {
        const params = new URLSearchParams({
            interval: 60,
            limit: Math.min(limit, 2000)
        });
        
        const response = await fetch(`${url}?${params.toString()}`);
        const data = await response.json();
        const candlesData = data?.candles?.data || [];
        
        if (!candlesData || candlesData.length === 0) {
            return [];
        }
        
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

// ============ ПОЛУЧЕНИЕ ВСЕХ КОНТРАКТОВ ДЛЯ АКТИВА ============

export async function getAllContractsForAsset(assetCode) {
    try {
        const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?limit=500`;
        const response = await fetch(url);
        const data = await response.json();
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Находим ВСЕ контракты для актива
        const contracts = securities
            .filter(row => row[assetCodeIdx] === assetCode)
            .map(row => ({
                secid: row[secidIdx],
                lastTradeDate: new Date(row[lastTradeDateIdx])
            }))
            .filter(c => c.secid && c.lastTradeDate && !isNaN(c.lastTradeDate))
            .sort((a, b) => a.lastTradeDate - b.lastTradeDate);
        
        return contracts;
    } catch (error) {
        console.error(`Ошибка получения контрактов для ${assetCode}:`, error);
        return [];
    }
}

// ============ НЕПРЕРЫВНЫЙ КОНТРАКТ (СКЛЕЙКА) ============

export async function fetchContinuousCandles(assetCode, interval, limit = 150) {
    if (!assetCode) return [];
    
    // 1. Получаем все контракты для актива
    const contracts = await getAllContractsForAsset(assetCode);
    
    if (contracts.length === 0) {
        console.warn(`Нет контрактов для ${assetCode}`);
        return [];
    }
    
    // 2. Загружаем данные для КАЖДОГО контракта
    let allCandles = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Берем последние 5 контрактов (достаточно для истории)
    const recentContracts = contracts.slice(-10);
    
    for (const contract of recentContracts) {
        const candles = await fetchSingleContractCandles(contract.secid, 1000);
        if (candles.length > 0) {
            allCandles = allCandles.concat(candles);
        }
    }
    
    if (allCandles.length === 0) {
        return [];
    }
    
    // 3. Сортируем по дате
    allCandles.sort((a, b) => a.date - b.date);
    
    // 4. Убираем дубликаты (по дате)
    const unique = [];
    const seen = new Set();
    for (const candle of allCandles) {
        const key = candle.date.toISOString().split('T')[0];
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(candle);
        }
    }
    
    // 5. Агрегируем до нужного таймфрейма
    const aggregated = aggregateCandles(unique, interval);
    
    // 6. Возвращаем последние N свечей
    return aggregated.slice(-limit);
}

// ============ ОСНОВНАЯ ФУНКЦИЯ ДЛЯ ФЬЮЧЕРСОВ ============

export async function fetchCandles(symbol, interval, limit = 150) {
    // Если symbol выглядит как код актива (не тикер с суффиксом),
    // используем непрерывный контракт
    const isAssetCode = !symbol.match(/[0-9]/);
    
    if (isAssetCode) {
        // Пробуем получить непрерывный контракт
        const continuous = await fetchContinuousCandles(symbol, interval, limit);
        if (continuous.length > 0) {
            return continuous;
        }
    }
    
    // Если не получилось или это конкретный тикер — загружаем как обычно
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
        const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?limit=500`;
        const response = await fetch(url);
        const data = await response.json();
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const contracts = securities
            .filter(row => row[assetCodeIdx] === assetCode)
            .map(row => ({
                secid: row[secidIdx],
                lastTradeDate: row[lastTradeDateIdx]
            }))
            .filter(c => c.secid && c.lastTradeDate);
        
        if (contracts.length === 0) return null;
        
        contracts.sort((a, b) => new Date(a.lastTradeDate) - new Date(b.lastTradeDate));
        
        const futureContracts = contracts.filter(c => new Date(c.lastTradeDate) > today);
        
        if (futureContracts.length === 0) {
            return contracts[contracts.length - 1].secid;
        }
        
        return futureContracts[0].secid;
        
    } catch (error) {
        console.error(`Ошибка получения тикера для ${assetCode}:`, error);
        return null;
    }
}

export async function getActualFuturesTickers(symbols) {
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

// ============ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ ============

export async function fetchAllSymbols(symbols, interval, limit = 150) {
    const results = {};
    for (const [key, symbol] of Object.entries(symbols)) {
        const candles = await fetchCandles(symbol, interval, limit);
        if (candles.length) {
            results[key] = candles;
        }
    }
    return results;
}
