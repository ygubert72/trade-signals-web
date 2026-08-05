// js/utils/excel.js

export function exportToExcel(results) {
    const positiveResults = results.filter(r => r.signal === 'BUY' || r.signal === 'SELL');

    if (positiveResults.length === 0) {
        alert('Нет положительных сигналов для экспорта');
        return;
    }

    // Формируем CSV
    let csv = 'Дата;Инструмент;Тип;Сигнал;Цена;Рекомендация;Описание;Вероятность\n';
    const now = new Date().toLocaleString();

    positiveResults.forEach(r => {
        const recommendation = r.signal === 'BUY' ? 'LONG' : 'SHORT';
        const probability = r.indicators?.adx 
            ? Math.min(Math.round(r.indicators.adx * 2 + 20), 95) 
            : 50;

        csv += `${now};${r.name};${r.type};${r.signal};${r.price.toFixed(2)};${recommendation};${r.description};${probability}%\n`;
    });

    // Скачиваем
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `signals_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}
