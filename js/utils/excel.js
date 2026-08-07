// js/utils/excel.js

export function exportToExcel(results) {
    const positiveResults = results.filter(r => r.signal === 'BUY' || r.signal === 'SELL');

    if (positiveResults.length === 0) {
        alert('Нет положительных сигналов для экспорта');
        return;
    }

    // Формируем CSV с колонкой "Тикер" и "Расшифровка вероятности"
    let csv = '\uFEFF'; // BOM для Excel
    csv += 'Дата;Тикер;Инструмент;Тип;Сигнал;Цена;Рекомендация;Описание;Вероятность;Расшифровка вероятности\n';
    const now = new Date().toLocaleString();

    positiveResults.forEach(r => {
        const recommendation = r.signal === 'BUY' ? 'LONG' : 'SHORT';
        
        // Улучшенный расчет вероятности
        let probability = 50;
        const adx = r.indicators?.adx || 0;
        const rsi = r.indicators?.rsi || 50;
        const ema50 = r.indicators?.ema50 || 0;
        const ema100 = r.indicators?.ema100 || 0;
        
        let explanation = 'Базовое значение 50%';
        
        // 1. Трендовый фактор (ADX)
        if (adx > 25) {
            // ADX 25-40: умеренный тренд, 40-60: сильный, >60: очень сильный
            let trendBonus = 0;
            if (adx > 60) trendBonus = 25;
            else if (adx > 40) trendBonus = 15 + (adx - 40) * 0.5;
            else if (adx > 25) trendBonus = (adx - 25) * 0.8;
            
            probability += trendBonus;
            explanation += ` +${trendBonus.toFixed(0)}% за тренд (ADX=${adx.toFixed(1)})`;
        } else {
            explanation += ` (ADX=${adx.toFixed(1)} < 25 — тренда нет)`;
        }
        
        // 2. RSI фактор (подтверждение направления)
        if (r.signal === 'BUY' && rsi < 40) {
            const bonus = Math.min((40 - rsi) * 0.5, 15);
            probability += bonus;
            explanation += ` +${bonus.toFixed(0)}% за перепроданность (RSI=${rsi.toFixed(1)})`;
        } else if (r.signal === 'SELL' && rsi > 60) {
            const bonus = Math.min((rsi - 60) * 0.5, 15);
            probability += bonus;
            explanation += ` +${bonus.toFixed(0)}% за перекупленность (RSI=${rsi.toFixed(1)})`;
        } else {
            explanation += ` (RSI=${rsi.toFixed(1)} в нейтральной зоне)`;
        }
        
        // 3. EMA фактор (уровень цены относительно MA)
        if (ema50 > 0 && ema100 > 0) {
            const priceToEma50 = (r.price - ema50) / ema50 * 100;
            const priceToEma100 = (r.price - ema100) / ema100 * 100;
            
            if (r.signal === 'BUY' && priceToEma50 < 0) {
                const bonus = Math.min(Math.abs(priceToEma50) * 0.3, 10);
                probability += bonus;
                explanation += ` +${bonus.toFixed(0)}% за откат к EMA50 (${priceToEma50.toFixed(1)}%)`;
            } else if (r.signal === 'SELL' && priceToEma50 > 0) {
                const bonus = Math.min(priceToEma50 * 0.3, 10);
                probability += bonus;
                explanation += ` +${bonus.toFixed(0)}% за откат к EMA50 (${priceToEma50.toFixed(1)}%)`;
            }
        }
        
        // 4. Паттерны подтверждают сигнал?
        if (r.patterns && r.patterns.length > 0) {
            const matchingPatterns = r.patterns.filter(p => p.signal === r.signal);
            if (matchingPatterns.length > 0) {
                const bonus = Math.min(matchingPatterns.length * 5, 15);
                probability += bonus;
                explanation += ` +${bonus.toFixed(0)}% за подтверждение паттернами (${matchingPatterns.length} шт)`;
            }
        }
        
        // Ограничиваем вероятность
        probability = Math.min(Math.max(Math.round(probability), 15), 95);
        explanation += ` = ${probability}%`;

        const desc = `${r.description} | ADX=${adx?.toFixed(1) || 'Н/Д'}, RSI=${rsi?.toFixed(1) || 'Н/Д'}`;

        csv += `${now};${r.ticker};${r.name};${r.type};${r.signal};${r.price.toFixed(2)};${recommendation};${desc};${probability}%;${explanation}\n`;
    });

    // Скачиваем
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `signals_${new Date().toISOString().slice(0,10)}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
}
