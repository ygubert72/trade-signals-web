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
        
        // Расчёт вероятности
        let probability = 50;
        const adx = r.indicators?.adx || 0;
        const rsi = r.indicators?.rsi || 50;
        let explanation = 'Базовое значение 50%';
        
        if (adx > 25) {
            const bonus = Math.min((adx - 25) * 0.8, 30);
            probability += bonus;
            explanation += ` +${bonus.toFixed(0)}% за тренд (ADX=${adx.toFixed(1)})`;
        } else {
            explanation += ` (ADX=${adx.toFixed(1)} < 25 — тренда нет)`;
        }
        
        if (rsi > 40 && rsi < 60) {
            probability += 10;
            explanation += ' +10% за откат внутри тренда';
        }
        
        if (rsi > 70 || rsi < 30) {
            probability -= 10;
            explanation += ' -10% за экстремум RSI';
        }
        
        probability = Math.min(Math.max(Math.round(probability), 20), 90);
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
