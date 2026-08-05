// js/ui/render.js

export function renderSignals(results, loading = false) {
    const container = document.getElementById('signals-container');

    if (loading) {
        container.innerHTML = '<div class="loading">⏳ Загрузка сигналов...</div>';
        return;
    }

    if (!results || results.length === 0) {
        container.innerHTML = '<div class="no-signals">📭 Сигналов нет</div>';
        return;
    }

    let html = '<div class="signals-grid">';

    results.forEach(item => {
        const signalClass = item.signal.toLowerCase();
        const signalEmoji = item.signal === 'BUY' ? '🟢' :
                           item.signal === 'SELL' ? '🔴' : '🟡';

        html += `
            <div class="signal-card ${signalClass}">
                <div class="signal-header">
                    <h2>${item.display_name}</h2>
                    <span class="symbol">${item.symbol}</span>
                    <span class="timeframe-badge">${item.timeframe}</span>
                </div>
                <div class="signal-price">
                    Цена: <strong>${item.current_price.toFixed(2)}</strong>
                </div>
                <div class="signal-main">
                    <div class="signal-status ${signalClass}">
                        ${signalEmoji} ${item.signal}
                    </div>
                    <div class="signal-desc">${item.signal_description}</div>
                </div>
                ${renderIndicators(item.indicators)}
                ${renderPatterns(item.patterns)}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function renderIndicators(indicators) {
    if (!indicators) return '';

    const items = [
        { label: 'EMA50', value: indicators.ema50 },
        { label: 'EMA100', value: indicators.ema100 },
        { label: 'RSI', value: indicators.rsi },
        { label: 'ADX', value: indicators.adx }
    ];

    return `
        <details class="indicators-details">
            <summary>📈 Индикаторы</summary>
            <div class="indicators-grid">
                ${items.map(({label, value}) => `
                    <div class="indicator-item">
                        <span class="indicator-label">${label}</span>
                        <span class="indicator-value">${value?.toFixed(2) ?? 'Н/Д'}</span>
                    </div>
                `).join('')}
            </div>
        </details>
    `;
}

function renderPatterns(patterns) {
    if (!patterns || patterns.length === 0) return '';

    return `
        <details class="patterns-details">
            <summary>🔍 Паттерны (${patterns.length})</summary>
            <ul class="patterns-list">
                ${patterns.map(p => `
                    <li class="pattern-item">
                        <span class="pattern-signal ${p.signal.toLowerCase()}">${p.signal}</span>
                        <span class="pattern-name">${p.pattern}</span>
                        <span class="pattern-confidence ${p.confidence}">${p.confidence}</span>
                    </li>
                `).join('')}
            </ul>
        </details>
    `;
}
