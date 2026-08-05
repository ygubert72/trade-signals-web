# trade-signals-web/patterns/cup_handle.py

import pandas as pd
import numpy as np
from .base_pattern import BasePattern

class CupHandlePattern(BasePattern):
    """Чашка с ручкой"""
    
    def __init__(self):
        super().__init__("Чашка с ручкой", confidence="high")
    
    def get_min_candles(self) -> int:
        return 40
    
    def detect(self, df: pd.DataFrame) -> dict | None:
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        
        # Поиск впадин (дна чашки)
        troughs = []
        for i in range(10, len(lows)-10):
            if (lows[i] < lows[i-1] and lows[i] < lows[i-2] and 
                lows[i] < lows[i-5] and lows[i] < lows[i-10] and 
                lows[i] < lows[i+1] and lows[i] < lows[i+2] and 
                lows[i] < lows[i+5] and lows[i] < lows[i+10]):
                troughs.append((i, lows[i]))
        
        if len(troughs) < 1:
            return None
        
        cup_bottom_idx, cup_bottom = troughs[-1]
        
        # Определяем края чашки
        left_start = max(0, cup_bottom_idx - 25)
        right_end = min(len(highs), cup_bottom_idx + 25)
        
        left_rim = max(highs[left_start:cup_bottom_idx])
        right_rim = max(highs[cup_bottom_idx:right_end])
        
        # Края должны быть примерно на одном уровне
        rim_ratio = abs(left_rim - right_rim) / left_rim
        if rim_ratio > 0.03:
            return None
        
        # Глубина чашки
        cup_depth = (left_rim - cup_bottom) / left_rim
        if cup_depth < 0.05:
            return None
        
        # Поиск ручки (небольшая коррекция после чашки)
        handle_start = right_end - 1
        handle_end = min(len(closes), handle_start + 10)
        
        if handle_end >= len(closes):
            return None
        
        handle_high = max(highs[handle_start:handle_end])
        
        # Ручка не должна подниматься выше края чашки
        if handle_high > right_rim * 0.97:
            return None
        
        # Пробой вверх
        if closes[-1] > right_rim:
            return {
                "signal": "BUY",
                "description": "Чашка с ручкой (бычий разворот)",
                "confidence": self.confidence
            }
        
        return None
