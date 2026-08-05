// js/api/moex.js

const MOEX_API = 'https://iss.moex.com/iss/engines/futures/markets/forts/securities';

export async function fetchCandles(symbol, interval, limit = 150) {
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

/**
 * 🔥 ПОЛУЧАЕТ АКТУАЛЬНЫЙ ТИКЕР ДЛЯ ФЬЮЧЕРСА АВТОМАТИЧЕСКИ
 * @param {string} assetCode - Код базового актива (например, 'RTS', 'Si', 'BR')
 * @returns {string|null} - Тикер актуального контракта (например, 'RIU6') или null
 */
export async function getActualFuturesTicker(assetCode) {
    try {
        // 1. Запрашиваем список всех фьючерсов
        const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?limit=100`;
        const response = await fetch(url);
        const data = await response.json();
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        // Находим индексы нужных колонок
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        const shortNameIdx = columns.indexOf('SHORTNAME');
        
        // 2. Фильтруем все контракты по нужному активу
        const contracts = securities
            .filter(row => row[assetCodeIdx] === assetCode)
            .map(row => ({
                secid: row[secidIdx],
                lastTradeDate: row[lastTradeDateIdx],
                shortName: row[shortNameIdx]
            }))
            .filter(c => c.lastTradeDate); // Убираем контракты без даты
        
        if (contracts.length === 0) {
            console.warn(`⚠️ Нет контрактов для актива ${assetCode}`);
            return null;
        }
        
        // 3. Сортируем по дате экспирации (самый дальний — первый)
        contracts.sort((a, b) => new Date(b.lastTradeDate) - new Date(a.lastTradeDate));
        
        // 4. Берём самый дальний контракт (обычно это основной)
        const actualContract = contracts[0];
        console.log(`✅ Найден тикер для ${assetCode}: ${actualContract.secid} (экспирация ${actualContract.lastTradeDate})`);
        return actualContract.secid;
        
    } catch (error) {
        console.error(`❌ Ошибка получения тикера для ${assetCode}:`, error);
        return null;
    }
}

/**
 * 🔥 ПОЛУЧАЕТ АКТУАЛЬНЫЕ ТИКЕРЫ ДЛЯ ВСЕХ ФЬЮЧЕРСОВ
 * @param {Object} symbols - Объект вида { 'RTS': 'RTS', 'Si': 'Si' }
 * @returns {Object} - Объект с актуальными тикерами
 */
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
