# trade-signals-web/scanners/base_scanner.py

from abc import ABC, abstractmethod
import pandas as pd

class BaseScanner(ABC):
    """Базовый класс для всех сканеров данных"""
    
    def __init__(self, symbol: str, timeframe: str):
        self.symbol = symbol
        self.timeframe = timeframe
        self.data = None
        self._indicators_cached = False
    
    @abstractmethod
    def fetch_data(self) -> pd.DataFrame | None:
        """Получение данных с биржи/API"""
        pass
    
    @abstractmethod
    def get_display_name(self) -> str:
        """Отображаемое имя инструмента"""
        pass
    
    def get_current_price(self) -> float:
        """Текущая цена"""
        if self.data is not None and not self.data.empty:
            return self.data['close'].iloc[-1]
        return 0.0
    
    def has_enough_data(self, min_candles: int = 30) -> bool:
        """Проверка достаточности данных"""
        return self.data is not None and len(self.data) >= min_candles
    
    def get_data_with_indicators(self) -> pd.DataFrame | None:
        """
        Возвращает DataFrame с рассчитанными индикаторами
        Индикаторы рассчитываются один раз и кэшируются
        """
        if self.data is None or self.data.empty:
            return None
        
        # Если индикаторы уже рассчитаны, возвращаем кэш
        if self._indicators_cached:
            return self.data
        
        # Рассчитываем все индикаторы один раз
        df = self.data.copy()
        
        # Скользящие средние (для GoldenCross и MA200)
        if len(df) >= 200:
            df['sma50'] = df['close'].rolling(window=50).mean()
            df['sma200'] = df['close'].rolling(window=200).mean()
        elif len(df) >= 50:
            df['sma50'] = df['close'].rolling(window=50).mean()
            df['sma200'] = None
        else:
            df['sma50'] = None
            df['sma200'] = None
        
        # EMA для торговой стратегии
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
        
        # Сохраняем обратно и помечаем как кэшированное
        self.data = df
        self._indicators_cached = True
        
        return self.data
