# trade-signals-web/patterns/pinbar.py

import pandas as pd
from .base_pattern import BasePattern

class PinBarPattern(BasePattern):
    """Пин-бары на экстремумах"""
    
    def __init__(self):
        super().__init__("Пин-бары на экстремумах", confidence="high")
    
    def detect(self, df: pd.DataFrame) -> dict | None:
        if len(df) < 3:
            return None
        
        last = df.iloc[-1]
        prev1 = df.iloc[-2]
        prev2 = df.iloc[-3]
        
        body = abs(last['close'] - last['open'])
        upper_shadow = last['high'] - max(last['close'], last['open'])
        lower_shadow = min(last['close'], last['open']) - last['low']
        
        if body > (upper_shadow + lower_shadow) / 1.5:
            return None
        
        price_change = last['close'] - last['open']
        
        # Бычий пин-бар
        if lower_shadow >= upper_shadow and price_change > 0:
            if last['low'] < prev1['low'] and last['low'] < prev2['low']:
                return {
                    "signal": "BUY",
                    "description": "BUY сигнал на локальном минимуме",
                    "confidence": self.confidence
                }
        
        # Медвежий пин-бар
        if upper_shadow >= lower_shadow and price_change < 0:
            if last['high'] > prev1['high'] and last['high'] > prev2['high']:
                return {
                    "signal": "SELL",
                    "description": "SELL сигнал на локальном максимуме",
                    "confidence": self.confidence
                }
        
        return None
