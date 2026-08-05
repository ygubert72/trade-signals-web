# trade-signals-web/patterns/ma_200.py

import pandas as pd
from .base_pattern import BasePattern

class MA200TouchPattern(BasePattern):
    """Касание/пробой 200MA"""
    
    def __init__(self):
        super().__init__("Касание/пробой 200MA", confidence="medium")
    
    def get_min_candles(self) -> int:
        return 200
    
    def detect(self, df: pd.DataFrame) -> dict | None:
        df['sma200'] = df['close'].rolling(window=200).mean()
        
        if len(df) < 2:
            return None
        
        last = df.iloc[-1]
        prev = df.iloc[-2]
        current_price = last['close']
        current_ma200 = last['sma200']
        prev_price = prev['close']
        prev_ma200 = prev['sma200']
        
        if pd.isna(current_ma200) or pd.isna(prev_ma200):
            return None
        
        # Пробой вверх
        if prev_price <= prev_ma200 and current_price > current_ma200:
            return {
                "signal": "BUY",
                "description": "Цена пробила 200MA вверх",
                "confidence": self.confidence
            }
        
        # Касание сверху
        if abs(current_price - current_ma200) / current_ma200 < 0.02:
            if current_price > current_ma200 and current_price > prev_price:
                return {
                    "signal": "BUY",
                    "description": "Цена отскочила от 200MA вверх",
                    "confidence": self.confidence
                }
        
        # Пробой вниз
        if prev_price >= prev_ma200 and current_price < current_ma200:
            return {
                "signal": "SELL",
                "description": "Цена пробила 200MA вниз",
                "confidence": self.confidence
            }
        
        return None
