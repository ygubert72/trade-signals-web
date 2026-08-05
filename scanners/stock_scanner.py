# trade-signals-web/scanners/stock_scanner.py

import yfinance as yf
import time
import pandas as pd
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from .base_scanner import BaseScanner

class StockScanner(BaseScanner):
    """Сканер для акций (Yahoo Finance) и фьючерсов + MOEX для российских акций"""
    
    FUTURES_NAMES = {
        "GC=F": "Золото", "SI=F": "Серебро", "PL=F": "Платина", "HG=F": "Медь",
        "CL=F": "Нефть WTI", "BZ=F": "Нефть Brent", "NG=F": "Природный газ",
        "ZW=F": "Пшеница", "ZS=F": "Соя", "ZC=F": "Кукуруза", "ZO=F": "Овес",
        "ZR=F": "Рис", "KC=F": "Кофе", "CC=F": "Какао", "CT=F": "Хлопок",
        "SB=F": "Сахар", "LB=F": "Пиломатериалы", "OJ=F": "Апельсиновый сок",
        "HE=F": "Свинина", "LE=F": "Крупный рогатый скот"
    }
    
    def __init__(self, symbol: str, timeframe: str, is_russian: bool = False):
        super().__init__(symbol, timeframe)
        self.is_russian = is_russian
    
    def fetch_data(self, period: str = "6mo", retries: int = 3, delay: int = 2) -> pd.DataFrame | None:
        for attempt in range(retries):
            try:
                if self.is_russian:
                    # Для российских акций используем MOEX API
                    data = self._fetch_moex_data()
                    
                    # Если MOEX не дал данные, пробуем Yahoo как запасной вариант
                    if data is None or data.empty:
                        if attempt == 0:
                            print(f"    ⚠️ {self.symbol}: MOEX не дал данные, пробую Yahoo...")
                        data = self._fetch_yahoo_russian_data()
                else:
                    # Для обычных акций и фьючерсов используем Yahoo Finance
                    data = self._fetch_yahoo_data_with_timeout(period)
                
                if data is None or data.empty:
                    print(f"    ⚠️ {self.symbol}: пустой DataFrame, попытка {attempt+1}/{retries}")
                    time.sleep(delay)
                    continue
                
                if len(data) < 30 and attempt < retries - 1:
                    print(f"    ⚠️ {self.symbol}: только {len(data)} свечей, повторная попытка...")
                    time.sleep(delay)
                    continue
                
                self.data = self._prepare_dataframe(data)
                print(f"    📊 {self.symbol}: загружено {len(self.data)} свечей")
                return self.data
                
            except TimeoutError:
                print(f"    ⏰ {self.symbol}: ТАЙМАУТ! попытка {attempt+1}/{retries}")
                time.sleep(delay)
            except Exception as e:
                print(f"    ❌ {self.symbol}: ошибка - {e}, попытка {attempt+1}/{retries}")
                time.sleep(delay)
        
        print(f"    💀 {self.symbol}: не удалось получить данные после {retries} попыток")
        return None
    
    def _fetch_yahoo_data_with_timeout(self, period: str, timeout: int = 10) -> pd.DataFrame | None:
        """Загрузка данных из Yahoo Finance с таймаутом"""
        try:
            ticker = yf.Ticker(self.symbol)
            
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(ticker.history, period=period, interval=self.timeframe)
                
                try:
                    data = future.result(timeout=timeout)
                    return data
                except TimeoutError:
                    future.cancel()
                    raise TimeoutError(f"Yahoo Finance таймаут для {self.symbol}")
                    
        except Exception as e:
            raise e
    
    def _fetch_moex_data(self):
        """Получение данных через MOEX API"""
        # Убираем .ME из символа для MOEX
        moex_symbol = self.symbol.replace('.ME', '')
        
        # Определяем интервал для MOEX (в минутах)
        interval_map = {
            "1d": 24,
            "1wk": 7,
            "1mo": 31,
            "1h": 60
        }
        
        interval = interval_map.get(self.timeframe, 24)
        
        limit_map = {
            "1d": 100,
            "1wk": 100,
            "1mo": 60,
            "1h": 200
        }
        limit = limit_map.get(self.timeframe, 100)
        
        try:
            # MOEX ISS API для получения свечей
            url = f"https://iss.moex.com/iss/engines/stock/markets/shares/boards/tqbr/securities/{moex_symbol}/candles.json"
            params = {
                "interval": interval,
                "limit": limit
            }
            
            print(f"    🔄 {self.symbol}: запрос к MOEX API...")
            
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                candles_data = data.get('candles', {}).get('data', [])
                
                if not candles_data:
                    print(f"    ⚠️ {self.symbol}: MOEX не вернул свечи")
                    return None
                
                candles = []
                for candle in candles_data:
                    try:
                        if len(candle) >= 8:
                            begin_date = candle[6]
                            open_price = float(candle[0])
                        elif len(candle) >= 7:
                            begin_date = candle[6]
                            open_price = float(candle[0])
                        else:
                            continue
                        
                        close_price = float(candle[1])
                        high_price = float(candle[2])
                        low_price = float(candle[3])
                        volume = float(candle[5]) if len(candle) > 5 else 0
                        
                        if isinstance(begin_date, str):
                            date = datetime.strptime(begin_date.split()[0], '%Y-%m-%d')
                        else:
                            date = begin_date
                        
                        candles.append({
                            'date': date,
                            'open': open_price,
                            'high': high_price,
                            'low': low_price,
                            'close': close_price,
                            'volume': volume
                        })
                    except Exception as e:
                        continue
                
                if candles:
                    df = pd.DataFrame(candles)
                    df = df.sort_values('date')
                    print(f"    ✅ {self.symbol}: получено {len(df)} свечей из MOEX")
                    return df
                else:
                    print(f"    ⚠️ {self.symbol}: не удалось распарсить свечи MOEX")
            
            else:
                print(f"    ⚠️ {self.symbol}: MOEX API вернул статус {response.status_code}")
            
        except requests.exceptions.Timeout:
            print(f"    ⏰ {self.symbol}: таймаут MOEX API")
            raise TimeoutError(f"MOEX API таймаут для {self.symbol}")
        except Exception as e:
            print(f"    ⚠️ {self.symbol}: ошибка MOEX API - {e}")
        
        return None
    
    def _fetch_yahoo_russian_data(self):
        """Запасной метод: попытка получить данные через Yahoo Finance"""
        try:
            ticker = yf.Ticker(self.symbol)
            
            periods = ["1mo", "3mo", "6mo", "1y"]
            
            with ThreadPoolExecutor(max_workers=1) as executor:
                for period in periods:
                    try:
                        future = executor.submit(ticker.history, period=period, interval=self.timeframe)
                        data = future.result(timeout=8)
                        
                        if not data.empty and len(data) > 10:
                            print(f"    ✅ {self.symbol}: получено {len(data)} свечей из Yahoo (period={period})")
                            return data
                    except TimeoutError:
                        print(f"    ⏰ {self.symbol}: таймаут Yahoo (period={period})")
                        continue
                    except Exception:
                        continue
            
            return None
        except Exception as e:
            print(f"    ⚠️ {self.symbol}: Yahoo ошибка - {e}")
            return None
    
    def _prepare_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Подготовка DataFrame (нормализация колонок)"""
        df = df.reset_index()
        df.columns = [c.lower() for c in df.columns]
        if 'datetime' in df.columns:
            df.rename(columns={'datetime': 'date'}, inplace=True)
        
        required_cols = ['date', 'open', 'high', 'low', 'close', 'volume']
        for col in required_cols:
            if col not in df.columns:
                df[col] = 0
        
        return df[required_cols]
    
    def get_display_name(self) -> str:
        if self.is_russian:
            return self.symbol.replace('.ME', '')
        return self.FUTURES_NAMES.get(self.symbol, self.symbol)
