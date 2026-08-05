# trade-signals-web/config.py

# Таймфреймы для анализа
TIMEFRAMES = {
    "Час": "1h",
    "День": "1d",
    "Неделя": "1wk",
    "Месяц": "1mo"
}

# 🔥 Фьючерсы на Московской бирже (для торговли)
# Формат: тикер для Yahoo Finance (пока используем, потом перейдём на MOEX)
FUTURES_SYMBOLS = {
    "RTS": "RTSF",      # Фьючерс на индекс РТС (через Yahoo)
    "Si": "SIF"         # Фьючерс на доллар-рубль (через Yahoo)
}

# Отображаемые имена для фьючерсов
FUTURES_NAMES = {
    "RTS": "Индекс РТС",
    "Si": "Доллар-рубль"
}

# Настройки API
MOEX_API_URL = "https://iss.moex.com/iss/engines/futures/markets/forts/securities"
YFINANCE_RETRIES = 3
YFINANCE_DELAY = 2

# Минимальное количество свечей для анализа
MIN_CANDLES = 50

# Пороги для индикаторов
ADX_THRESHOLD = 25      # Минимальное значение ADX для наличия тренда
RSI_OVERBOUGHT = 70     # Перекупленность
RSI_OVERSOLD = 30       # Перепроданность
