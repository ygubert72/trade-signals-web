// js/config.js

// КОДЫ АКТИВОВ ДЛЯ АВТОПОИСКА (ПРАВИЛЬНЫЕ)
export const ASSET_CODES = {
    // Индексы и валюты
    'RTS': 'RTS',
    'Si': 'Si',
    'BR': 'BR',
    'GOLD': 'GOLD',
    'SILV': 'SILV',
    'COPPER': 'COPPER',
    'RVI': 'RVI',
    'Eu': 'EUR/RUB',
    'CNY': 'CNY/RUB',
    
    // Фьючерсы на акции (правильные коды MOEX)
    'ROSN': 'ROSN',
    'GAZR': 'GAZR',
    'LKOH': 'LKOH',
    'SBRF': 'SBRF',
    'VTBR': 'VTBR',
    'TATN': 'TATN',
    'GMKN': 'GMKN'
};

// ФЬЮЧЕРСЫ - ТОЛЬКО РЕАЛЬНО СУЩЕСТВУЮЩИЕ
export const FUTURES_LIST = {
    // Индексы
    'RTS': 'Индекс РТС',
    'RVI': 'Индекс волатильности',
    
    // Валюты
    'Si': 'Доллар-рубль',
    'Eu': 'Евро-рубль',
    'CNY': 'Юань-рубль',
    
    // Сырье
    'BR': 'Нефть Brent',
    'GOLD': 'Золото',
    'SILV': 'Серебро',
    'COPPER': 'Медь',
    
    // Фьючерсы на акции
    'ROSN': 'Роснефть',
    'GAZR': 'Газпром',
    'LKOH': 'Лукойл',
    'SBRF': 'Сбербанк',
    'VTBR': 'ВТБ',
    'TATN': 'Татнефть',
    'GMKN': 'Норникель'
};

// АКЦИИ
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

// ЗАПАСНЫЕ ТИКЕРЫ (на случай, если автопоиск не сработает)
export const FALLBACK_TICKERS = {
    'RTS': 'RTS-6.25',
    'Si': 'Si-6.25',
    'BR': 'BR-6.25',
    'GOLD': 'AU-6.25',
    'SILV': 'AG-6.25',
    'COPPER': 'CU-6.25',
    'RVI': 'RVI-6.25',
    'ROSN': 'ROSN-6.25',
    'GAZR': 'GAZR-6.25',
    'LKOH': 'LKOH-6.25',
    'SBRF': 'SBRF-6.25',
    'VTBR': 'VTBR-6.25',
    'TATN': 'TATN-6.25',
    'GMKN': 'GMKN-6.25'
};
