# trade-signals-web/app.py

from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import pandas as pd
from datetime import datetime, timedelta
import logging
from functools import lru_cache

from config import TIMEFRAMES, FUTURES_SYMBOLS, FUTURES_NAMES, ADX_THRESHOLD
from patterns.registry import PatternRegistry
from patterns.fractal_breakout import reset_fractal_cache
from scanners.factory import ScannerFactory

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Кэш для данных (5 минут)
cache_data = {}
cache_time = {}

def get_cached_or_fetch(key, fetch_func, ttl_minutes=5):
    """Получение данных из кэша или загрузка"""
    if key in cache_time:
        if datetime.now() - cache_time[key] < timedelta(minutes=ttl_minutes):
            return cache_data[key]
    
    result = fetch_func()
    cache_data[key] = result
    cache_time[key] = datetime.now()
    return result

def calculate_indicators(df):
    """Расчет EMA, ADX, RSI"""
    if df is None or len(df) < 30:
        return None
    
    # EMA
    df['ema50'] = df['close'].ewm(span=50, adjust=False).mean()
    df['ema100'] = df['close'].ewm(span=100, adjust=False).mean()
    
    # RSI
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))
    
    # ADX (упрощенный расчет)
    df['tr'] = df[['high', 'low', 'close']].apply(
        lambda x: max(
            x['high'] - x['low'],
            abs(x['high'] - x['close'].shift()),
            abs(x['low'] - x['close'].shift())
        ), axis=1
    )
    df['atr'] = df['tr'].rolling(window=14).mean()
    df['adx'] = df['atr'].pct_change().rolling(window=14).mean() * 100
    
    return {
        "ema50": float(df['ema50'].iloc[-1]) if not pd.isna(df['ema50'].iloc[-1]) else None,
        "ema100": float(df['ema100'].iloc[-1]) if not pd.isna(df['ema100'].iloc[-1]) else None,
        "rsi": float(df['rsi'].iloc[-1]) if not pd.isna(df['rsi'].iloc[-1]) else None,
        "adx": float(df['adx'].iloc[-1]) if not pd.isna(df['adx'].iloc[-1]) else None,
        "price": float(df['close'].iloc[-1])
    }

def generate_signal(indicators):
    """
    Генерация сигнала на основе EMA, ADX, RSI
    Возвращает: {'signal': 'BUY'/'SELL'/'HOLD', 'description': str}
    """
    if indicators is None:
        return {"signal": "HOLD", "description": "Недостаточно данных"}
    
    price = indicators['price']
    ema50 = indicators['ema50']
    ema100 = indicators['ema100']
    rsi = indicators['rsi']
    adx = indicators['adx']
    
    # Проверяем наличие тренда (ADX > 25)
    if adx is None or adx < ADX_THRESHOLD:
        return {"signal": "HOLD", "description": f"Нет тренда (ADX={adx:.1f})"}
    
    # Проверяем наличие уровней RSI
    if rsi is None:
        return {"signal": "HOLD", "description": "Нет данных RSI"}
    
    # Восходящий тренд (цена выше EMA100)
    if ema100 is not None and price > ema100:
        if 40 < rsi < 60:
            return {
                "signal": "BUY",
                "description": f"Восходящий тренд, RSI={rsi:.1f}, ADX={adx:.1f}"
            }
        elif rsi >= 70:
            return {
                "signal": "HOLD",
                "description": f"Перекупленность (RSI={rsi:.1f}), ждём отката"
            }
        else:
            return {
                "signal": "HOLD",
                "description": f"Тренд восходящий, но RSI={rsi:.1f} вне зоны входа"
            }
    
    # Нисходящий тренд (цена ниже EMA100)
    elif ema100 is not None and price < ema100:
        if 40 < rsi < 60:
            return {
                "signal": "SELL",
                "description": f"Нисходящий тренд, RSI={rsi:.1f}, ADX={adx:.1f}"
            }
        elif rsi <= 30:
            return {
                "signal": "HOLD",
                "description": f"Перепроданность (RSI={rsi:.1f}), ждём отката"
            }
        else:
            return {
                "signal": "HOLD",
                "description": f"Тренд нисходящий, но RSI={rsi:.1f} вне зоны входа"
            }
    
    else:
        return {"signal": "HOLD", "description": "Цена около EMA100, тренд не определён"}

def analyze_symbol(symbol, timeframe_key, selected_patterns=None):
    """Анализ одного символа"""
    try:
        timeframe = TIMEFRAMES.get(timeframe_key, "1d")
        
        # Создаём сканер для фьючерса
        scanner = ScannerFactory.create_scanner(symbol, timeframe, "futures")
        df = scanner.fetch_data(period="6mo")
        
        if not scanner.has_enough_data(min_candles=50):
            logger.warning(f"{symbol}: недостаточно данных")
            return None
        
        # Получаем данные с индикаторами
        df_with_indicators = scanner.get_data_with_indicators()
        if df_with_indicators is None:
            logger.warning(f"{symbol}: ошибка расчёта индикаторов")
            return None
        
        # Рассчитываем индикаторы
        indicators = calculate_indicators(df_with_indicators)
        if indicators is None:
            logger.warning(f"{symbol}: не удалось рассчитать индикаторы")
            return None
        
        # Генерируем сигнал по индикаторам
        signal_result = generate_signal(indicators)
        
        # Анализ паттернов (если выбраны)
        pattern_signals = []
        if selected_patterns:
            # Сброс кэша фракталов
            reset_fractal_cache()
            
            # Анализируем паттерны
            pattern_results = PatternRegistry.analyze_symbol(df_with_indicators, selected_patterns)
            for pr in pattern_results:
                pattern_signals.append({
                    "pattern": pr["pattern"],
                    "signal": pr["signal"],
                    "description": pr["description"],
                    "confidence": pr["confidence"]
                })
        
        return {
            "symbol": symbol,
            "display_name": FUTURES_NAMES.get(symbol, symbol),
            "timeframe": timeframe_key,
            "current_price": indicators['price'],
            "signal": signal_result["signal"],
            "signal_description": signal_result["description"],
            "indicators": {
                "ema50": indicators['ema50'],
                "ema100": indicators['ema100'],
                "rsi": indicators['rsi'],
                "adx": indicators['adx']
            },
            "patterns": pattern_signals
        }
        
    except Exception as e:
        logger.error(f"Ошибка анализа {symbol}: {e}")
        return None

@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')

@app.route('/api/signals')
def get_signals():
    """API получения сигналов"""
    timeframe = request.args.get('timeframe', 'День')
    patterns_str = request.args.get('patterns', '')
    
    # Парсим выбранные паттерны
    selected_patterns = [p.strip() for p in patterns_str.split(',') if p.strip()] if patterns_str else None
    
    # Если паттерны не выбраны, используем все
    if not selected_patterns:
        selected_patterns = PatternRegistry.get_pattern_names()
    
    # Ключ кэша
    cache_key = f"signals_{timeframe}_{','.join(sorted(selected_patterns))}"
    
    def fetch_signals():
        results = []
        for symbol in FUTURES_SYMBOLS.keys():
            result = analyze_symbol(symbol, timeframe, selected_patterns)
            if result:
                results.append(result)
        return results
    
    # Получаем данные (с кэшированием на 5 минут)
    try:
        results = get_cached_or_fetch(cache_key, fetch_signals, ttl_minutes=5)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Ошибка получения сигналов: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/patterns')
def get_patterns():
    """API получения списка паттернов"""
    return jsonify(PatternRegistry.get_pattern_names())

@app.route('/api/timeframes')
def get_timeframes():
    """API получения списка таймфреймов"""
    return jsonify(list(TIMEFRAMES.keys()))

if __name__ == '__main__':
    logger.info("🚀 Запуск торгового сигнального сервера...")
    app.run(debug=True, host='0.0.0.0', port=5000)
