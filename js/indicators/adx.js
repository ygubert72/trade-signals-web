// js/indicators/adx.js

export function calculateADX(highs, lows, closes, period = 14) {
    if (!highs || !lows || !closes || highs.length < period * 2) {
        return null;
    }

    const len = highs.length;
    
    // Шаг 1: True Range, +DM, -DM
    const tr = [];
    const plusDM = [];
    const minusDM = [];
    
    for (let i = 1; i < len; i++) {
        // True Range
        const hl = highs[i] - lows[i];
        const hc = Math.abs(highs[i] - closes[i - 1]);
        const lc = Math.abs(lows[i] - closes[i - 1]);
        tr.push(Math.max(hl, hc, lc));
        
        // Directional Movement
        const upMove = highs[i] - highs[i - 1];
        const downMove = lows[i - 1] - lows[i];
        
        let dmPlus = 0;
        let dmMinus = 0;
        
        if (upMove > downMove && upMove > 0) {
            dmPlus = upMove;
        }
        if (downMove > upMove && downMove > 0) {
            dmMinus = downMove;
        }
        
        plusDM.push(dmPlus);
        minusDM.push(dmMinus);
    }
    
    if (tr.length < period) return null;
    
    // Шаг 2: Сглаживание по Wilders (EMA-подобное)
    let atr = 0;
    let smoothedPlusDM = 0;
    let smoothedMinusDM = 0;
    
    // Начальные значения - простое среднее
    for (let i = 0; i < period; i++) {
        atr += tr[i];
        smoothedPlusDM += plusDM[i];
        smoothedMinusDM += minusDM[i];
    }
    atr /= period;
    smoothedPlusDM /= period;
    smoothedMinusDM /= period;
    
    // Массивы для DI и DX
    const diPlusValues = [];
    const diMinusValues = [];
    const dxValues = [];
    
    // Шаг 3: Расчет DI и DX для каждого периода
    for (let i = period; i < tr.length; i++) {
        // Wilders smoothing
        atr = (atr * (period - 1) + tr[i]) / period;
        smoothedPlusDM = (smoothedPlusDM * (period - 1) + plusDM[i]) / period;
        smoothedMinusDM = (smoothedMinusDM * (period - 1) + minusDM[i]) / period;
        
        // DI
        const diPlus = atr === 0 ? 0 : (smoothedPlusDM / atr) * 100;
        const diMinus = atr === 0 ? 0 : (smoothedMinusDM / atr) * 100;
        
        diPlusValues.push(diPlus);
        diMinusValues.push(diMinus);
        
        // DX
        const diSum = diPlus + diMinus;
        const dx = diSum === 0 ? 0 : (Math.abs(diPlus - diMinus) / diSum) * 100;
        dxValues.push(dx);
    }
    
    if (dxValues.length < period) return null;
    
    // Шаг 4: ADX = EMA от DX
    // Начальное значение - SMA
    let adx = 0;
    for (let i = 0; i < period; i++) {
        adx += dxValues[i];
    }
    adx /= period;
    
    // Остальные - Wilders EMA
    for (let i = period; i < dxValues.length; i++) {
        adx = (adx * (period - 1) + dxValues[i]) / period;
    }
    
    return adx;
}
