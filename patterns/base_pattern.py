from abc import ABC, abstractmethod
import pandas as pd

class BasePattern(ABC):
    """Базовый класс для всех паттернов"""
    
    def __init__(self, name: str, confidence: str = "medium"):
        self.name = name
        self.confidence = confidence
    
    @abstractmethod
    def detect(self, df: pd.DataFrame) -> dict | None:
        """
        Детектирование паттерна
        Возвращает: {'signal': 'BUY'/'SELL', 'description': str} или None
        """
        pass
    
    def get_result(self, df: pd.DataFrame) -> dict | None:
        """Обёртка с проверкой данных"""
        if df is None or len(df) < self.get_min_candles():
            return None
        return self.detect(df)
    
    def get_min_candles(self) -> int:
        """Минимальное количество свечей для паттерна"""
        return 30
