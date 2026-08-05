# trade-signals-web/patterns/fractal_breakout.py

import pandas as pd
from .base_pattern import BasePattern

# Глобальный кэш для фрактальных сигналов
_fractal_signal_cache = {}

def reset_fractal_cache():
    """Сброс кэша фрактальных сигналов перед каждым сканом"""
    global _fractal_signal_cache
    _fractal_signal_cache = {}

class FractalBreakoutPattern(BasePattern):
    """Пробой фрактальной линии"""
    
    def __init__(self):
        super().__init__("Пробой фрактальной линии (19)", confidence="medium")
    
    def get_min_candles(self) -> int:
        return 40
    
    def find_fractals(self, df, left=9, right=9):
        """Поиск фракталов"""
        highs = df['high'].values
        lows = df['low'].values
        upper_fractals = []
        lower_fractals = []
        
        for i in range(left, len(df) - right):
            # Верхний фрактал
            is_upper = True
            for j in range(1, left + 1):
                if i - j >= 0 and highs[i] <= highs[i - j]:
                    is_upper = False
                    break
            for j in range(1, right + 1):
                if i + j < len(highs) and highs[i] <= highs[i + j]:
                    is_upper = False
                    break
            if is_upper:
                upper_fractals.append((i, highs[i]))
            
            # Нижний фрактал
            is_lower = True
            for j in range(1, left + 1):
                if i - j >= 0 and lows[i] >= lows[i - j]:
                    is_lower = False
                    break
            for j in range(1, right + 1):
                if i + j < len(lows) and lows[i] >= lows[i + j]:
                    is_lower = False
                    break
            if is_lower:
                lower_fractals.append((i, lows[i]))
        
        return upper_fractals, lower_fractals
    
    def detect(self, df: pd.DataFrame) -> dict | None:
        global _fractal_signal_cache
        
        upper_fractals, lower_fractals = self.find_fractals(df, left=9, right=9)
        last_idx = len(df) - 1
        last_close = df['close'].iloc[-1]
        
        # Сигнал на покупку (BUY) - пробой верхней линии вверх
        if len(upper_fractals) >= 2:
            p1_idx, p1_price = upper_fractals[-2]
            p2_idx, p2_price = upper_fractals[-1]
            
            delta_idx = p2_idx - p1_idx
            if delta_idx != 0:
                slope = (p2_price - p1_price) / delta_idx
                
                # Игнорируем горизонтальные линии
                if abs(slope) < 1e-6:
                    return None
                
                prev_line = p1_price + slope * (last_idx - 1 - p1_idx)
                curr_line = p1_price + slope * (last_idx - p1_idx)
                
                pair_key = f"BUY_{p1_idx}_{p2_idx}"
                
                if pair_key not in _fractal_signal_cache:
                    if len(df) > 1:
                        prev_close = df['close'].iloc[-2]
                        if prev_close <= prev_line and last_close > curr_line:
                            _fractal_signal_cache[pair_key] = True
                            return {
                                "signal": "BUY",
                                "description": "BUY при пробое трендовой линии по фракталам (19)",
                                "confidence": self.confidence
                            }
        
        # Сигнал на продажу (SELL) - пробой нижней линии вниз
        if len(lower_fractals) >= 2:
            p1_idx, p1_price = lower_fractals[-2]
            p2_idx, p2_price = lower_fractals[-1]
            
            delta_idx = p2_idx - p1_idx
            if delta_idx != 0:
                slope = (p2_price - p1_price) / delta_idx
                
                if abs(slope) < 1e-6:
                    return None
                
                prev_line = p1_price + slope * (last_idx - 1 - p1_idx)
                curr_line = p1_price + slope * (last_idx - p1_idx)
                
                pair_key = f"SELL_{p1_idx}_{p2_idx}"
                
                if pair_key not in _fractal_signal_cache:
                    if len(df) > 1:
                        prev_close = df['close'].iloc[-2]
                        if prev_close >= prev_line and last_close < curr_line:
                            _fractal_signal_cache[pair_key] = True
                            return {
                                "signal": "SELL",
                                "description": "SELL при пробое трендовой линии по фракталам (19)",
                                "confidence": self.confidence
                            }
        
        return None
