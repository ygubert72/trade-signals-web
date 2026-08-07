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

// ============ АВТОПОИСК ТИКЕРОВ ============

// Функция для поиска конкретного тикера
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
        const boardIdx = columns.indexOf('BOARDID');
        
        const contracts = securities
            .filter(row => {
                const board = row[boardIdx] || '';
                return board.includes('FUT');
            })
            .filter(row => row[assetCodeIdx] === assetCode)
            .map(row => ({
                secid: row[secidIdx],
                lastTradeDate: row[lastTradeDateIdx]
            }))
            .filter(c => c.lastTradeDate && c.secid);
        
        if (contracts.length === 0) return null;
        
        contracts.sort((a, b) => new Date(b.lastTradeDate) - new Date(a.lastTradeDate));
        return contracts[0].secid;
        
    } catch (error) {
        console.error(`Ошибка получения тикера для ${assetCode}:`, error);
        return null;
    }
}

// Улучшенная версия с оптимизацией (один запрос)
export async function getActualFuturesTickers(symbols) {
    console.log('🔄 Запрос актуальных тикеров с MOEX...');
    const result = {};
    
    try {
        // Получаем все фьючерсы за один запрос
        const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?limit=200`;
        const response = await fetch(url);
        const data = await response.json();
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        const boardIdx = columns.indexOf('BOARDID');
        const shortNameIdx = columns.indexOf('SHORTNAME');
        
        // Группируем контракты по базовому активу
        const contractsByAsset = {};
        
        for (const row of securities) {
            const board = row[boardIdx] || '';
            if (!board.includes('FUT')) continue;
            
            const assetCode = row[assetCodeIdx] || '';
            const secid = row[secidIdx];
            const lastTradeDate = row[lastTradeDateIdx];
            const shortName = row[shortNameIdx] || '';
            
            if (!assetCode || !secid || !lastTradeDate) continue;
            
            if (!contractsByAsset[assetCode]) {
                contractsByAsset[assetCode] = [];
            }
            contractsByAsset[assetCode].push({ 
                secid, 
                lastTradeDate,
                shortName,
                assetCode
            });
        }
        
        console.log(`📊 Найдено ${Object.keys(contractsByAsset).length} базовых активов`);
        
        // Для каждого символа ищем подходящий контракт
        for (const [key, code] of Object.entries(symbols)) {
            let bestTicker = null;
            let bestDate = null;
            
            // 1. Точное совпадение по ASSETCODE
            if (contractsByAsset[code]) {
                const contracts = contractsByAsset[code];
                contracts.sort((a, b) => new Date(b.lastTradeDate) - new Date(a.lastTradeDate));
                bestTicker = contracts[0].secid;
                bestDate = contracts[0].lastTradeDate;
            } 
            // 2. Поиск по SHORTNAME (частичное совпадение)
            else {
                for (const [assetCode, contracts] of Object.entries(contractsByAsset)) {
                    // Проверяем частичное совпадение
                    const match = contracts.some(c => 
                        c.shortName.includes(code) || 
                        code.includes(c.shortName) ||
                        c.assetCode.includes(code)
                    );
                    
                    if (match) {
                        contracts.sort((a, b) => new Date(b.lastTradeDate) - new Date(a.lastTradeDate));
                        bestTicker = contracts[0].secid;
                        bestDate = contracts[0].lastTradeDate;
                        break;
                    }
                }
            }
            
            if (bestTicker) {
                result[key] = bestTicker;
                console.log(`✅ ${key} (${code}) → ${bestTicker} (${bestDate})`);
            } else {
                console.log(`⚠️ ${key} (${code}) → не найден, используем код как есть`);
                // Если не нашли — используем сам код как тикер
                result[key] = code;
            }
        }
        
        return result;
        
    } catch (error) {
        console.error('Ошибка получения тикеров:', error);
        // В случае ошибки возвращаем исходные коды
        return symbols;
    }
}

// ============ ДЛЯ СОВМЕСТИМОСТИ ============
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
