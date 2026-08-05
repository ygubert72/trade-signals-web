from .pinbar import PinBarPattern
from .golden_cross import GoldenCrossPattern
from .ma_200 import MA200TouchPattern
from .breakout import BreakoutPattern
from .double_top_bottom import DoubleTopPattern, DoubleBottomPattern
from .head_shoulders import HeadShouldersPattern
from .cup_handle import CupHandlePattern
from .fractal_breakout import FractalBreakoutPattern
from .fake_breakout import FakeBreakoutPattern

class PatternRegistry:
    """Реестр всех паттернов"""
    
    _patterns = {}
    
    @classmethod
    def register(cls, pattern_class, name: str = None):
        """Регистрация паттерна"""
        instance = pattern_class()
        pattern_name = name or instance.name
        cls._patterns[pattern_name] = instance
        return pattern_class
    
    @classmethod
    def get_all_patterns(cls) -> dict:
        """Получение всех паттернов"""
        return cls._patterns
    
    @classmethod
    def get_pattern_names(cls) -> list:
        """Список имён паттернов"""
        return list(cls._patterns.keys())
    
    @classmethod
    def analyze_symbol(cls, df, selected_patterns: list) -> list:
        """Анализ символа по выбранным паттернам"""
        results = []
        
        for pattern_name in selected_patterns:
            pattern = cls._patterns.get(pattern_name)
            if pattern:
                result = pattern.get_result(df)
                if result:
                    results.append({
                        "pattern": pattern_name,
                        "signal": result.get("signal"),
                        "description": result.get("description", ""),
                        "confidence": result.get("confidence", "medium")
                    })
        
        return results


# Автоматическая регистрация всех паттернов
PatternRegistry.register(PinBarPattern)
PatternRegistry.register(GoldenCrossPattern)
PatternRegistry.register(MA200TouchPattern)
PatternRegistry.register(BreakoutPattern)
PatternRegistry.register(DoubleTopPattern)
PatternRegistry.register(DoubleBottomPattern)
PatternRegistry.register(HeadShouldersPattern)
PatternRegistry.register(CupHandlePattern)
PatternRegistry.register(FractalBreakoutPattern)
PatternRegistry.register(FakeBreakoutPattern)
