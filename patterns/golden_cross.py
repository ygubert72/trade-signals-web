# trade-signals-web/patterns/golden_cross.py

import pandas as pd
from .base_pattern import BasePattern

class GoldenCrossPattern(BasePattern):
    """Золотой крест (50/200 MA)"""
    
    def __init__(self):
        super().__init__("Золотой крест (50/200)", confidence="high")
    
    def get_min_candles(self) -> int:
        return 200
    
    def detect(self, df: pd.DataFrame) -> dict | None:
        df['sma50'] = df['close'].rolling(window=50).mean()
        df['sma200'] = df['close'].rolling(window=200).mean()
        
        if len(df) < 2:
            return None
        
        prev = df.iloc[-2]
        curr = df.iloc[-1]
        
        if (pd.notna(prev['sma50']) and pd.notna(prev['sma200']) and 
            pd.notna(curr['sma50']) and pd.notna(curr['sma200'])):
            if prev['sma50'] <= prev['sma200'] and curr['sma50'] > curr['sma200']:
                return {
                    "signal": "BUY",
                    "description": "50MA пересекла 200MA снизу вверх",
                    "confidence": self.confidence
                }
        
        return None
