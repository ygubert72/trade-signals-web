# trade-signals-web/patterns/fake_breakout.py

import pandas as pd
from .base_pattern import BasePattern

class FakeBreakoutPattern(BasePattern):
    """Ложный пробой уровня"""
    
    def __init__(self):
        super().__init__("Ложный пробой уровня", confidence="medium")
    
    def get_min_candles(self) -> int:
        return 30
    
    def detect(self, df: pd.DataFrame) -> dict | None:
        window = 20
        confirmation_bars = 3
        
        if len(df) < window + confirmation_bars + 5:
            return None
        
        # Находим уровень
        level_high = df['high'].iloc[-window-1:-1].max()
        level_low = df['low'].iloc[-window-1:-1].min()
        
        candles_after_level = df.iloc[-window-1:].reset_index(drop=True)
        
        # Ложный пробой ВВЕРХ (SELL)
        for i in range(len(candles_after_level)):
            candle = candles_after_level.iloc[i]
            
            if candle['high'] > level_high and candle['close'] > level_high:
                if i + confirmation_bars >= len(candles_after_level):
                    break
                
                future_bars = candles_after_level.iloc[i+1:i+confirmation_bars+1]
                
                if future_bars['close'].min() <= level_high:
                    avg_volume = df['volume'].iloc[-window-1:-1].mean()
                    is_high_volume = candle['volume'] > avg_volume * 1.2
                    
                    return {
                        "signal": "SELL",
                        "description": f"Ложный пробой вверх: цена пробила {level_high:.2f} и вернулась обратно",
                        "confidence": "high" if is_high_volume else self.confidence
                    }
                else:
                    break
        
        # Ложный пробой ВНИЗ (BUY)
        for i in range(len(candles_after_level)):
            candle = candles_after_level.iloc[i]
            
            if candle['low'] < level_low and candle['close'] < level_low:
                if i + confirmation_bars >= len(candles_after_level):
                    break
                
                future_bars = candles_after_level.iloc[i+1:i+confirmation_bars+1]
                
                if future_bars['close'].max() >= level_low:
                    avg_volume = df['volume'].iloc[-window-1:-1].mean()
                    is_high_volume = candle['volume'] > avg_volume * 1.2
                    
                    return {
                        "signal": "BUY",
                        "description": f"Ложный пробой вниз: цена пробила {level_low:.2f} и вернулась обратно",
                        "confidence": "high" if is_high_volume else self.confidence
                    }
                else:
                    break
        
        return None
