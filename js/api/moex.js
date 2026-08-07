// js/api/moex.js

export async function getActualFuturesTicker(assetCode) {
    try {
        // Запрашиваем все фьючерсы
        const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?limit=100`;
        const response = await fetch(url);
        const data = await response.json();
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        const boardIdx = columns.indexOf('BOARDID');
        
        // Фильтруем контракты
        const contracts = securities
            .filter(row => {
                // Проверяем, что это срочный рынок
                const board = row[boardIdx] || '';
                if (!board.includes('FUT')) return false;
                
                // Проверяем соответствие ASSETCODE (не строгое совпадение)
                const code = row[assetCodeIdx] || '';
                const isMatch = code === assetCode || 
                               code.includes(assetCode) || 
                               assetCode.includes(code);
                return isMatch;
            })
            .map(row => ({
                secid: row[secidIdx],
                lastTradeDate: row[lastTradeDateIdx],
                assetCode: row[assetCodeIdx]
            }))
            .filter(c => c.lastTradeDate && c.secid);
        
        if (contracts.length === 0) {
            console.log(`⚠️ Контракты для ${assetCode} не найдены`);
            return null;
        }
        
        // Сортируем по дате экспирации (самые поздние первые)
        contracts.sort((a, b) => new Date(b.lastTradeDate) - new Date(a.lastTradeDate));
        
        // Берем самый актуальный
        const best = contracts[0];
        console.log(`✅ ${assetCode} → ${best.secid} (экспирация: ${best.lastTradeDate})`);
        return best.secid;
        
    } catch (error) {
        console.error(`Ошибка получения тикера для ${assetCode}:`, error);
        return null;
    }
}

// === УЛУЧШЕННЫЙ АВТОПОИСК ===
export async function getActualFuturesTickers(symbols) {
    console.log('🔄 Запрос актуальных тикеров с MOEX...');
    const result = {};
    
    // Получаем ВСЕ фьючерсы за один запрос (оптимизация)
    try {
        const url = `https://iss.moex.com/iss/engines/futures/markets/forts/securities.json?limit=200`;
        const response = await fetch(url);
        const data = await response.json();
        
        const securities = data?.securities?.data || [];
        const columns = data?.securities?.columns || [];
        
        const secidIdx = columns.indexOf('SECID');
        const assetCodeIdx = columns.indexOf('ASSETCODE');
        const lastTradeDateIdx = columns.indexOf('LASTTRADEDATE');
        const boardIdx = columns.indexOf('BOARDID');
        
        // Группируем контракты по базовому активу
        const contractsByAsset = {};
        
        for (const row of securities) {
            const board = row[boardIdx] || '';
            if (!board.includes('FUT')) continue;
            
            const assetCode = row[assetCodeIdx] || '';
            const secid = row[secidIdx];
            const lastTradeDate = row[lastTradeDateIdx];
            
            if (!assetCode || !secid || !lastTradeDate) continue;
            
            if (!contractsByAsset[assetCode]) {
                contractsByAsset[assetCode] = [];
            }
            contractsByAsset[assetCode].push({ secid, lastTradeDate });
        }
        
        // Для каждого символа ищем подходящий контракт
        for (const [key, code] of Object.entries(symbols)) {
            let bestTicker = null;
            let bestDate = null;
            
            // Ищем точное совпадение
            if (contractsByAsset[code]) {
                const contracts = contractsByAsset[code];
                contracts.sort((a, b) => new Date(b.lastTradeDate) - new Date(a.lastTradeDate));
                bestTicker = contracts[0].secid;
                bestDate = contracts[0].lastTradeDate;
            } else {
                // Ищем частичное совпадение (нестрогое)
                for (const [assetCode, contracts] of Object.entries(contractsByAsset)) {
                    if (assetCode.includes(code) || code.includes(assetCode)) {
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
                console.log(`⚠️ ${key} (${code}) → не найден`);
            }
        }
        
        return result;
        
    } catch (error) {
        console.error('Ошибка получения тикеров:', error);
        return {};
    }
}
