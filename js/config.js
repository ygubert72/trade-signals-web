// js/config.js

// Топ-30 фьючерсов MOEX (отображаемые имена)
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
    'OIL': 'Нефть WTI',
    'GAS': 'Природный газ',
    'MX': 'Индекс МосБиржи',
    'RVI': 'Индекс волатильности',
    'ROS': 'Роснефть',
    'GAZ': 'Газпром',
    'LKOH': 'Лукойл',
    'SBER': 'Сбербанк',
    'VTBR': 'ВТБ',
    'TATN': 'Татнефть',
    'NVTK': 'НОВАТЭК',
    'PLZL': 'Полюс',
    'GMKN': 'Норникель'
};

// Топ-30 российских акций (MOEX)
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

// ⚠️ СТАРЫЙ ОБЪЕКТ С ТИКЕРАМИ — ПОКА ОСТАВЛЯЕМ ДЛЯ СОВМЕСТИМОСТИ,
// НО В ОСНОВНОЙ ЛОГИКЕ МЫ БУДЕМ ИСПОЛЬЗОВАТЬ АВТОПОИСК
export const FUTURES_TICKERS = {
    'RTS': 'RIU6',
    'Si': 'SiU6',
    'BR': 'BRU6',
    'GOLD': 'GDU6',
    'SILV': 'SVU6',
    'PLAT': 'PTU6',
    'PALL': 'PDU6',
    'COPPER': 'CEU6',
    'ALUM': 'ANU6',
    'NICK': 'NCU6',
    'WHT': 'W4U6',
    'CORN': 'CORN',
    'SOYB': 'SOYB',
    'SUGR': 'SAV6',
    'COFF': 'KCU6',
    'CACA': 'CCU6',
    'COTN': 'CT=F',
    'OIL': 'WTU6',
    'GAS': 'NGU6',
    'MX': 'MXU6',
    'RVI': 'VIU6',
    'ROS': 'RNU6',
    'GAZ': 'GZU6',
    'LKOH': 'LKU6',
    'SBER': 'SRU6',
    'VTBR': 'VBU6',
    'TATN': 'TTU6',
    'NVTK': 'NVU6',
    'PLZL': 'PXU6',
    'GMKN': 'GKU6'
};

export const INDICATORS = {
    'ema': 'EMA (50/100)',
    'rsi': 'RSI (14)',
    'adx': 'ADX (14)'
};

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
