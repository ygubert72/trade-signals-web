# trade-signals-web/patterns/head_shoulders.py

import pandas as pd
import numpy as np
from .base_pattern import BasePattern

class HeadShouldersPattern(BasePattern):
    """Голова и плечи - медвежий разворот"""
    
    def __init__(self):
        super().__init__("Голова и плечи", confidence="medium")
    
    def get_min_candles(self) -> int:
        return 50
    
    def detect(self, df: pd.DataFrame) -> dict | None:
        if len(df) < 50:
            return None
        
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        volumes = df['volume'].values
        
        # Находим все локальные максимумы
        peaks = []
        for i in range(3, len(highs) - 3):
            is_peak = True
            for j in range(1, 4):
                if i - j >= 0 and highs[i] <= highs[i - j]:
                    is_peak = False
                    break
                if i + j < len(highs) and highs[i] <= highs[i + j]:
                    is_peak = False
                    break
            if is_peak:
                peaks.append({
                    'index': i,
                    'price': highs[i],
                    'volume': volumes[i] if i < len(volumes) else 0
                })
        
        if len(peaks) < 3:
            return None
        
        # Ищем фигуру среди последних пиков
        for i in range(len(peaks) - 1, 1, -1):
            right_shoulder = peaks[i]
            head = peaks[i - 1]
            left_shoulder = peaks[i - 2]
            
            # Проверяем расстояния между пиками
            dist_left_head = head['index'] - left_shoulder['index']
            dist_head_right = right_shoulder['index'] - head['index']
            
            if dist_left_head < 5 or dist_head_right < 5:
                continue
            if dist_left_head > 30 or dist_head_right > 30:
                continue
            
            # Проверяем, что голова ВЫШЕ плеч
            head_vs_left = (head['price'] - left_shoulder['price']) / left_shoulder['price']
            head_vs_right = (head['price'] - right_shoulder['price']) / right_shoulder['price']
            
            if head_vs_left < 0.02 or head_vs_right < 0.02:
                continue
            
            # Проверяем, что плечи на одном уровне
            shoulder_diff = abs(left_shoulder['price'] - right_shoulder['price'])
            shoulder_avg = (left_shoulder['price'] + right_shoulder['price']) / 2
            shoulder_diff_percent = shoulder_diff / shoulder_avg
            
            if shoulder_diff_percent > 0.05:
                continue
            
            # Линия шеи
            neckline1 = min(lows[left_shoulder['index']:head['index'] + 1])
            neckline2 = min(lows[head['index']:right_shoulder['index'] + 1])
            neckline = (neckline1 + neckline2) / 2
            
            # Проверяем пробой линии шеи вниз
            if right_shoulder['index'] + 3 >= len(closes):
                continue
            
            closes_after = closes[right_shoulder['index'] + 1:right_shoulder['index'] + 4]
            if len(closes_after) == 0:
                continue
            
            below_neckline_count = sum(1 for c in closes_after if c < neckline)
            if below_neckline_count < 2:
                continue
            
            # Проверяем объем
            if right_shoulder['volume'] > head['volume'] * 1.1:
                continue
            
            return {
                "signal": "SELL",
                "description": f"Голова и плечи: голова {head['price']:.2f}, шея {neckline:.2f}",
                "confidence": self.confidence
            }
        
        return None
