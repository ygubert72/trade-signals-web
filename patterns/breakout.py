# trade-signals-web/patterns/breakout.py

import pandas as pd
from .base_pattern import BasePattern

class BreakoutPattern(BasePattern):
    """Пробой локального уровня"""
    
    def __init__(self):
        super().__init__("Пробой локального уровня", confidence="medium")
    
    def get_min_candles(self) -> int:
        return 20
    
    def detect(self, df: pd.DataFrame) -> dict | None:
        last = df.iloc[-1]
        prev = df.iloc[-20:-1]
        local_high = prev['high'].max()
        local_low = prev['low'].min()
        
        if last['close'] > local_high and last['close'] > last['open']:
            return {
                "signal": "BUY",
                "description": "BUY при пробое уровня сопротивления",
                "confidence": self.confidence
            }
        
        if last['close'] < local_low and last['close'] < last['open']:
            return {
                "signal": "SELL",
                "description": "SELL при пробое уровня поддержки",
                "confidence": self.confidence
            }
        
        return None
