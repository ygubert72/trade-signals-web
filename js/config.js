// js/config.js

// Топ-30 фьючерсов MOEX
export const FUTURES_LIST = {
    'RTS': 'Индекс РТС',
    'Si': 'Доллар-рубль',
    'BR': 'Нефть Brent',
    'GOLD': 'Золото',
    'SILV': 'Серебро',
    'PLAT': 'Платина',
    'PALL': 'Палладий',
    'COPPER': 'Медь',
    'ALUM': 'Алюминий',
    'NICK': 'Никель',
    'WHT': 'Пшеница',
    'CORN': 'Кукуруза',
    'SOYB': 'Соя',
    'SUGR': 'Сахар',
    'COFF': 'Кофе',
    'CACA': 'Какао',
    'COTN': 'Хлопок',
    'OIL': 'Нефть Urals',
    'GAS': 'Природный газ',
    'MX': 'Индекс МосБиржи',
    'RVI': 'Индекс волатильности',
    'ROS': 'Роснефть фьюч',
    'GAZ': 'Газпром фьюч',
    'LKOH': 'Лукойл фьюч',
    'SBER': 'Сбербанк фьюч',
    'VTBR': 'ВТБ фьюч',
    'TATN': 'Татнефть фьюч',
    'NVTK': 'НОВАТЭК фьюч',
    'PLZL': 'Полюс фьюч',
    'GMKN': 'Норникель фьюч'
};

// Топ-30 российских акций
export const STOCKS_LIST = {
    'SBER.ME': 'Сбербанк',
    'VTBR.ME': 'ВТБ',
    'MOEX.ME': 'Мосбиржа',
    'T.ME': 'МТС',
    'LKOH.ME': 'Лукойл',
    'GAZP.ME': 'Газпром',
    'ROSN.ME': 'Роснефть',
    'NVTK.ME': 'НОВАТЭК',
    'TATN.ME': 'Татнефть',
    'SNGS.ME': 'Сургутнефтегаз',
    'GMKN.ME': 'Норникель',
    'PLZL.ME': 'Полюс',
    'YDEX.ME': 'Яндекс',
    'OZON.ME': 'Ozon',
    'X5.ME': 'X5 Group',
    'POLY.ME': 'Полиметалл',
    'MAGN.ME': 'Магнит',
    'MVID.ME': 'М.Видео',
    'ALRS.ME': 'Алроса',
    'AFLT.ME': 'Аэрофлот',
    'RTKM.ME': 'Ростелеком',
    'NLMK.ME': 'НЛМК',
    'CHMF.ME': 'Северсталь',
    'MTSS.ME': 'МТС-банк',
    'PIKK.ME': 'ПИК',
    'IRAO.ME': 'Интер РАО',
    'FEES.ME': 'ФСК ЕЭС',
    'RUAL.ME': 'РУСАЛ',
    'HYDR.ME': 'РусГидро',
    'VSMO.ME': 'ВСМПО-АВИСМА'
};

// Тикеры для MOEX API (фьючерсы)
export const FUTURES_TICKERS = {
    'RTS': 'RTS-9.26',
    'Si': 'Si-9.26',
    'BR': 'BR-9.26',
    'GOLD': 'GOLD-9.26',
    'SILV': 'SILV-9.26',
    'PLAT': 'PLAT-9.26',
    'PALL': 'PALL-9.26',
    'COPPER': 'COPPER-9.26',
    'ALUM': 'ALUM-9.26',
    'NICK': 'NICK-9.26',
    'WHT': 'WHT-9.26',
    'CORN': 'CORN-9.26',
    'SOYB': 'SOYB-9.26',
    'SUGR': 'SUGR-9.26',
    'COFF': 'COFF-9.26',
    'CACA': 'CACA-9.26',
    'COTN': 'COTN-9.26',
    'OIL': 'OIL-9.26',
    'GAS': 'GAS-9.26',
    'MX': 'MX-9.26',
    'RVI': 'RVI-9.26',
    'ROS': 'ROS-9.26',
    'GAZ': 'GAZ-9.26',
    'LKOH': 'LKOH-9.26',
    'SBER': 'SBER-9.26',
    'VTBR': 'VTBR-9.26',
    'TATN': 'TATN-9.26',
    'NVTK': 'NVTK-9.26',
    'PLZL': 'PLZL-9.26',
    'GMKN': 'GMKN-9.26'
};

// Индикаторы (все выключены по умолчанию)
export const INDICATORS = {
    'ema': 'EMA (50/100)',
    'rsi': 'RSI (14)',
    'adx': 'ADX (14)'
};

// Паттерны (все выключены по умолчанию)
export const PATTERNS = {
    'pinbar': 'Пин-бары на экстремумах',
    'golden_cross': 'Золотой крест (50/200)',
    'ma_200': 'Касание/пробой 200MA',
    'breakout': 'Пробой локального уровня',
    'double_top': 'Двойная вершина',
    'double_bottom': 'Двойное дно',
    'head_shoulders': 'Голова и плечи',
    'cup_handle': 'Чашка с ручкой',
    'fractal': 'Пробой фрактальной линии (19)',
    'fake_breakout': 'Ложный пробой уровня'
};
