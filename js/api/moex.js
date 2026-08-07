// js/api/moex.js

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

// ============ АВТОПОИСК ТИКЕРОВ (ИСПРАВЛЕН) ============

export async function getActualFuturesTickers(symbols) {
    console.log('🔄 Запрос актуальных тикеров с MOEX...');
    const result = {};
    
    try {
        // Получаем все фьючерсы
        const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?limit=200`;
        const response = await fetch(url);
        const data = await response.json();
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        
        // Для каждого символа ищем контракт
        for (const [key, code] of Object.entries(symbols)) {
            // Находим все контракты с этим ASSETCODE
            const contracts = securities
                .filter(row => row[assetCodeIdx] === code)
                .map(row => ({
                    secid: row[secidIdx],
                    lastTradeDate: row[lastTradeDateIdx]
                }))
                .filter(c => c.secid && c.lastTradeDate);
            
            if (contracts.length === 0) {
                console.log(`⚠️ ${key} (${code}) → контракты не найдены`);
                // ❌ НЕ ВОЗВРАЩАЕМ code! Пропускаем инструмент
                continue;
            }
            
            // Сортируем по дате экспирации (самые поздние первые)
            contracts.sort((a, b) => new Date(b.lastTradeDate) - new Date(a.lastTradeDate));
            
            // Берем самый поздний контракт
            const best = contracts[0];
            result[key] = best.secid;
            console.log(`✅ ${key} (${code}) → ${best.secid} (${best.lastTradeDate})`);
        }
        
        console.log(`📊 Найдено актуальных тикеров: ${Object.keys(result).length}`);
        return result;
        
    } catch (error) {
        console.error('Ошибка получения тикеров:', error);
        return {};
    }
}
