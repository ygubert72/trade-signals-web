# trade-signals-web/scanners/crypto_scanner.py

import requests
import pandas as pd
from datetime import datetime
from .base_scanner import BaseScanner

class CryptoSymbol:
    """Символ криптовалюты с поддержкой USDT"""
    
    def __init__(self, symbol: str):
        self.symbol = symbol
        self.is_usdt = symbol.endswith("USDT")
    
    def get_api_symbol(self) -> str:
        """Формат для Bybit API"""
        return self.symbol if self.is_usdt else f"{self.symbol}USDT"

class CryptoScanner(BaseScanner):
    """Сканер для криптовалют (Bybit)"""
    
    INTERVAL_MAP = {"1mo": "M", "1wk": "W", "1d": "D", "1h": "60"}
    
    def fetch_data(self, limit: int = 200) -> pd.DataFrame | None:
        interval = self.INTERVAL_MAP.get(self.timeframe)
        if not interval:
            return None
        
        api_symbol = CryptoSymbol(self.symbol).get_api_symbol()
        
        try:
            r = requests.get(
                "https://api.bybit.com/v5/market/kline",
                params={"category": "spot", "symbol": api_symbol, 
                       "interval": interval, "limit": limit},
                timeout=15
            )
            data = r.json()
            
            if data.get("retCode") == 0 and data.get("result", {}).get("list"):
                candles = []
                for c in data["result"]["list"]:
                    candles.append({
                        "date": datetime.fromtimestamp(int(c[0])/1000),
                        "open": float(c[1]),
                        "high": float(c[2]),
                        "low": float(c[3]),
                        "close": float(c[4]),
                        "volume": float(c[5])
                    })
                self.data = pd.DataFrame(candles)
                return self.data.sort_values("date") if not self.data.empty else None
            
        except Exception as e:
            print(f"  ⚠️ Крипто {self.symbol}: ошибка API - {e}")
        
        return None
    
    def get_display_name(self) -> str:
        return self.symbol
