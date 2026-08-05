# trade-signals-web/patterns/double_top_bottom.py

import pandas as pd
import numpy as np
from .base_pattern import BasePattern

class DoubleTopPattern(BasePattern):
    """Двойная вершина - медвежий разворот"""
    
    def __init__(self):
        super().__init__("Двойная вершина", confidence="medium")
    
    def get_min_candles(self) -> int:
        return 40
    
    def detect(self, df: pd.DataFrame) -> dict | None:
        if len(df) < 40:
            return None
        
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        
        # Находим локальные максимумы
        peaks = []
        for i in range(5, len(highs) - 5):
            is_peak = True
            for j in range(1, 6):
                if i - j >= 0 and highs[i] <= highs[i - j]:
                    is_peak = False
                    break
                if i + j < len(highs) and highs[i] <= highs[i + j]:
                    is_peak = False
                    break
            if is_peak:
                peaks.append({'index': i, 'price': highs[i]})
        
        if len(peaks) < 2:
            return None
        
        # Ищем два последних пика
        for i in range(len(peaks) - 1, 0, -1):
            peak2 = peaks[i]
            peak1 = peaks[i - 1]
            
            if peak2['index'] - peak1['index'] < 5:
                continue
            
            # Проверяем, что пики на одном уровне (±3%)
            price_diff = abs(peak2['price'] - peak1['price'])
            avg_price = (peak2['price'] + peak1['price']) / 2
            diff_percent = price_diff / avg_price
            
            if diff_percent > 0.03:
                continue
            
            # Проверяем впадину между пиками
            between_lows = lows[peak1['index']:peak2['index'] + 1]
            min_between = between_lows.min()
            drop_percent = (peak1['price'] - min_between) / peak1['price']
            
            if drop_percent < 0.02:
                continue
            
            # Проверяем падение после второй вершины
            if peak2['index'] + 3 >= len(closes):
                continue
            
            closes_after = closes[peak2['index'] + 1:peak2['index'] + 4]
            if len(closes_after) > 0 and closes_after.mean() < peak2['price']:
                return {
                    "signal": "SELL",
                    "description": f"Двойная вершина на уровнях {peak1['price']:.2f} и {peak2['price']:.2f}",
                    "confidence": self.confidence
                }
        
        return None


class DoubleBottomPattern(BasePattern):
    """Двойное дно - бычий разворот"""
    
    def __init__(self):
        super().__init__("Двойное дно", confidence="medium")
    
    def get_min_candles(self) -> int:
        return 40
    
    def detect(self, df: pd.DataFrame) -> dict | None:
        if len(df) < 40:
            return None
        
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        
        # Находим локальные минимумы
        troughs = []
        for i in range(5, len(lows) - 5):
            is_trough = True
            for j in range(1, 6):
                if i - j >= 0 and lows[i] >= lows[i - j]:
                    is_trough = False
                    break
                if i + j < len(lows) and lows[i] >= lows[i + j]:
                    is_trough = False
                    break
            if is_trough:
                troughs.append({'index': i, 'price': lows[i]})
        
        if len(troughs) < 2:
            return None
        
        # Ищем два последних дна
        for i in range(len(troughs) - 1, 0, -1):
            trough2 = troughs[i]
            trough1 = troughs[i - 1]
            
            if trough2['index'] - trough1['index'] < 5:
                continue
            
            # Проверяем, что дна на одном уровне (±3%)
            price_diff = abs(trough2['price'] - trough1['price'])
            avg_price = (trough2['price'] + trough1['price']) / 2
            diff_percent = price_diff / avg_price
            
            if diff_percent > 0.03:
                continue
            
            # Проверяем горб между днами
            between_highs = highs[trough1['index']:trough2['index'] + 1]
            max_between = between_highs.max()
            rise_percent = (max_between - trough1['price']) / trough1['price']
            
            if rise_percent < 0.02:
                continue
            
            # Проверяем рост после второго дна
            if trough2['index'] + 3 >= len(closes):
                continue
            
            closes_after = closes[trough2['index'] + 1:trough2['index'] + 4]
            if len(closes_after) > 0 and closes_after.mean() > trough2['price']:
                return {
                    "signal": "BUY",
                    "description": f"Двойное дно на уровнях {trough1['price']:.2f} и {trough2['price']:.2f}",
                    "confidence": self.confidence
                }
        
        return None
