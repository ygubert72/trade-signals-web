// js/ui/render.js

export function renderSignals(results) {
    const container = document.getElementById('results');

    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="loading">
                📭 Сигналов нет
            </div>
        `;
        return;
    }

    const positiveResults = results.filter(r => r.signal === 'BUY' || r.signal === 'SELL');

    let html = `<div style="margin-bottom:12px;font-size:14px;color:#64748b;">
        Найдено сигналов: <strong style="color:#0f172a;">${positiveResults.length}</strong> 
        (BUY/SELL) из ${results.length} инструментов
    </div>`;

    html += '<div class="signals-grid">';

    results.forEach(item => {
        const cls = item.signal.toLowerCase();
        const emoji = item.signal === 'BUY' ? '🟢' :
                     item.signal === 'SELL' ? '🔴' : '🟡';

        const timeframeLabel = {
            '60': '1ч', '24': '1д', '7': '1н', '31': '1м'
        }[item.timeframe] || item.timeframe;

        html += `
            <div class="signal-card ${cls}">
                <div class="card-header">
                    <h2>${item.name}</h2>
                    <span class="badge">${item.type} • ${timeframeLabel}</span>
                </div>
                <div class="price">
                    ${item.price.toFixed(2)}
                    <span>₽</span>
                </div>
                <div class="signal-row">
                    <span class="signal-badge ${cls}">${emoji} ${item.signal}</span>
                    <span class="signal-desc">${item.description}</span>
                </div>
                ${renderIndicators(item.indicators)}
                ${renderPatterns(item.patterns)}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function renderIndicators(ind) {
    if (!ind) return '';
    const items = [];
    if (ind.ema50 !== undefined) items.push({ label: 'EMA50', value: ind.ema50 });
    if (ind.ema100 !== undefined) items.push({ label: 'EMA100', value: ind.ema100 });
    if (ind.rsi !== undefined) items.push({ label: 'RSI', value: ind.rsi });
    if (ind.adx !== undefined) items.push({ label: 'ADX', value: ind.adx });

    if (items.length === 0) return '';

    return `
        <div class="indicators-grid">
            ${items.map(({label, value}) => `
                <div class="ind-item">
                    <span class="label">${label}</span>
                    <span class="value">${value?.toFixed(2) ?? '—'}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderPatterns(patterns) {
    if (!patterns || patterns.length === 0) return '';
    return `
        <ul class="patterns-list">
            ${patterns.map(p => `
                <li>
                    <span class="p-signal ${p.signal.toLowerCase()}">${p.signal}</span>
                    <span class="p-name">${p.pattern}</span>
                    <span class="p-conf ${p.confidence}">${p.confidence}</span>
                </li>
            `).join('')}
        </ul>
    `;
}
