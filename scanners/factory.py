# trade-signals-web/scanners/factory.py

from .stock_scanner import StockScanner
from .crypto_scanner import CryptoScanner

class ScannerFactory:
    """Фабрика для создания сканеров в зависимости от типа рынка"""
    
    @staticmethod
    def create_scanner(symbol: str, timeframe: str, market_type: str):
        """
        Создание сканера
        market_type: 'crypto', 'russian', 'us', 'futures'
        """
        if market_type == 'crypto':
            return CryptoScanner(symbol, timeframe)
        else:
            is_russian = (market_type == 'russian')
            return StockScanner(symbol, timeframe, is_russian=is_russian)
