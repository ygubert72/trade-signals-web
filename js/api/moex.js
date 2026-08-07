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

// ============ АВТОПОИСК ТИКЕРОВ (ПОЛНОСТЬЮ ПЕРЕРАБОТАН) ============

export async function getActualFuturesTickers(symbols) {
    console.log('🔄 Запрос актуальных тикеров с MOEX...');
    const result = {};
    
    try {
        // 1. Получаем все фьючерсы
        const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?limit=200`;
        const response = await fetch(url);
        const data = await response.json();
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        const boardIdx = columns.indexOf('BOARDID');
        
        // Текущая дата
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        console.log(`📊 Всего фьючерсов в ответе: ${securities.length}`);
        
        // 2. Группируем контракты по ASSETCODE
        const contractsByAsset = {};
        
        for (const row of securities) {
            const board = row[boardIdx] || '';
            // Только фьючерсы
            if (!board.includes('FUT')) continue;
            
            const assetCode = row[assetCodeIdx] || '';
            const secid = row[secidIdx];
            const lastTradeDate = row[lastTradeDateIdx];
            
            if (!assetCode || !secid || !lastTradeDate) continue;
            
            const tradeDate = new Date(lastTradeDate);
            
            // 🔥 Берем ТОЛЬКО контракты с датой в будущем или сегодня
            if (tradeDate < now) continue;
            
            if (!contractsByAsset[assetCode]) {
                contractsByAsset[assetCode] = [];
            }
            contractsByAsset[assetCode].push({
                secid: secid,
                lastTradeDate: lastTradeDate,
                tradeDate: tradeDate
            });
        }
        
        console.log(`📊 Актуальных контрактов (с датой >= сегодня): ${Object.keys(contractsByAsset).length} активов`);
        
        // 3. Для каждого символа ищем подходящий контракт
        for (const [key, code] of Object.entries(symbols)) {
            const contracts = contractsByAsset[code] || [];
            
            if (contracts.length === 0) {
                console.log(`⚠️ ${key} (${code}) → нет актуальных контрактов`);
                continue;
            }
            
            // Сортируем по дате (самые ближайшие первые)
            contracts.sort((a, b) => a.tradeDate - b.tradeDate);
            
            // Берем САМЫЙ БЛИЖАЙШИЙ контракт
            const best = contracts[0];
            result[key] = best.secid;
            console.log(`✅ ${key} (${code}) → ${best.secid} (${best.lastTradeDate})`);
            
            // Если есть еще контракты, показываем их для информации
            if (contracts.length > 1) {
                const others = contracts.slice(1, 4).map(c => `${c.secid} (${c.lastTradeDate})`).join(', ');
                console.log(`   📌 Еще: ${others}${contracts.length > 4 ? ` и еще ${contracts.length - 4}` : ''}`);
            }
        }
        
        console.log(`📊 ИТОГ: найдено ${Object.keys(result).length} актуальных тикеров из ${Object.keys(symbols).length}`);
        return result;
        
    } catch (error) {
        console.error('❌ Ошибка получения тикеров:', error);
        return {};
    }
}
