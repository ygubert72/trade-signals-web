// js/ui/render.js

export function renderSignals(results) {
    const container = document.getElementById('results');

    if (!results || results.length === 0) {
        container.innerHTML = `<div class="empty">📭 Сигналов нет</div>`;
        return;
    }

    const positive = results.filter(r => r.signal === 'BUY' || r.signal === 'SELL');
    let html = `<div style="margin-bottom:10px;font-size:14px;color:#64748b;">
        Найдено сигналов: <strong style="color:#0f172a;">${positive.length}</strong> из ${results.length}
    </div><div class="signals-grid">`;

    results.forEach(r => {
        const cls = r.signal.toLowerCase();
        const emoji = r.signal === 'BUY' ? '🟢' : r.signal === 'SELL' ? '🔴' : '🟡';
        const tf = { '60':'1ч','24':'1д','7':'1н','31':'1м' }[r.timeframe] || r.timeframe;

        html += `
            <div class="signal-card ${cls}">
                <div class="top">
                    <h3>${r.name}</h3>
                    <span class="tag">${r.type} • ${tf}</span>
                </div>
                <div class="price">${r.price.toFixed(2)} <small>₽</small></div>
                <div class="row">
                    <span class="badge ${cls}">${emoji} ${r.signal}</span>
                    <span class="desc">${r.description}</span>
                </div>
                ${renderIndicators(r.indicators)}
                ${renderPatterns(r.patterns)}
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
    if (!items.length) return '';

    return `<div class="inds">${items.map(({label, value}) =>
        `<div class="it"><span class="lbl">${label}</span><span class="val">${value?.toFixed(2) ?? '—'}</span></div>`
    ).join('')}</div>`;
}

function renderPatterns(patterns) {
    if (!patterns || !patterns.length) return '';
    return `<ul class="pats">${patterns.map(p =>
        `<li><span class="ps ${p.signal.toLowerCase()}">${p.signal}</span><span class="pn">${p.pattern}</span><span class="pc ${p.confidence}">${p.confidence}</span></li>`
    ).join('')}</ul>`;
}
