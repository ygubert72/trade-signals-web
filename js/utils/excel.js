// js/utils/excel.js

export function exportToExcel(results) {
    const positiveResults = results.filter(r => r.signal === 'BUY' || r.signal === 'SELL');

    if (positiveResults.length === 0) {
        alert('Нет положительных сигналов для экспорта');
        return;
    }

    // Формируем CSV с колонкой "Тикер"
    let csv = '\uFEFF'; // BOM для Excel
    csv += 'Дата;Тикер;Инструмент;Тип;Сигнал;Цена;Рекомендация;Описание;Вероятность\n';
    const now = new Date().toLocaleString();

    positiveResults.forEach(r => {
        const recommendation = r.signal === 'BUY' ? 'LONG' : 'SHORT';
        
        // Расчёт вероятности
        let probability = 50;
        const adx = r.indicators?.adx || 0;
        const rsi = r.indicators?.rsi || 50;
        
        if (adx > 25) {
            probability += Math.min((adx - 25) * 0.8, 30);
        }
        if (rsi > 40 && rsi < 60) {
            probability += 10;
        }
        if (rsi > 70 || rsi < 30) {
            probability -= 10;
        }
        probability = Math.min(Math.max(Math.round(probability), 20), 90);

        const desc = `${r.description} | ADX=${adx?.toFixed(1) || 'Н/Д'}, RSI=${rsi?.toFixed(1) || 'Н/Д'}`;

        csv += `${now};${r.ticker};${r.name};${r.type};${r.signal};${r.price.toFixed(2)};${recommendation};${desc};${probability}%\n`;
    });

    // Скачиваем
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `signals_${new Date().toISOString().slice(0,10)}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
}
