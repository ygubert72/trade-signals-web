// js/config.js

// Топ-30 фьючерсов MOEX (только реально торгуемые)
export const FUTURES_LIST = {
    'RTS': 'Индекс РТС',
    'Si': 'Доллар-рубль',
    'BR': 'Нефть Brent',
    'GOLD': 'Золото',
    'SILV': 'Серебро',
    'COPPER': 'Медь',
    'ALUM': 'Алюминий',
    'SUGR': 'Сахар',
    'ROS': 'Роснефть',
    'GAZ': 'Газпром',
    'LKOH': 'Лукойл',
    'SBER': 'Сбербанк',
    'VTBR': 'ВТБ',
    'TATN': 'Татнефть',
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

// ========== ЭКСПОРТ ИНДИКАТОРОВ ==========
export const INDICATORS = {
    'ema': 'EMA (50/100)',
    'rsi': 'RSI (14)',
    'adx': 'ADX (14)'
};

// ========== ЭКСПОРТ ПАТТЕРНОВ ==========
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

// ⚠️ СТАРЫЙ ОБЪЕКТ — ОСТАВЛЯЕМ ДЛЯ СОВМЕСТИМОСТИ
export const FUTURES_TICKERS = {
    'RTS': 'RIM7',
    'Si': 'SiZ7',
    'BR': 'BRH7',
    'GOLD': 'GDM7',
    'SILV': 'SVM7',
    'COPPER': 'CEZ7',
    'ALUM': 'ANZ7',
    'SUGR': 'SAV7',
    'ROS': 'RNM7',
    'GAZ': 'GZM7',
    'LKOH': 'LKM7',
    'SBER': 'SRM7',
    'VTBR': 'VBH7',
    'TATN': 'TTH7',
    'GMKN': 'GKH7'
};
