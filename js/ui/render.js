// js/ui/render.js

export function renderSignals(results) {
    const container = document.getElementById('results');

    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="loading" style="padding:60px 20px; text-align:center; color:#94a3b8;">
                📭 Сигналов нет
            </div>
        `;
        return;
    }

    let html = '<div class="signals-grid">';

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
                    <h2>${item.display_name}</h2>
                    <span class="badge">${timeframeLabel}</span>
                </div>
                <div class="price">
                    ${item.current_price.toFixed(2)}
                    <span>₽</span>
                </div>
                <div class="signal-row">
                    <span class="signal-badge ${cls}">${emoji} ${item.signal}</span>
                    <span class="signal-desc">${item.signal_description}</span>
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
    const items = [
        { label: 'EMA50', value: ind.ema50 },
        { label: 'EMA100', value: ind.ema100 },
        { label: 'RSI', value: ind.rsi },
        { label: 'ADX', value: ind.adx }
    ];
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
