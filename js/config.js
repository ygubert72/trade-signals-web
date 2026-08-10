// js/config.js

// КОДЫ АКТИВОВ ДЛЯ ПОИСКА НА MOEX
// Это коды, которые используются в поле ASSETCODE на MOEX
export const ASSET_CODES = {
    // Индексы
    'RTS': 'RTS',           // Индекс РТС
    'MX': 'MIX',            // Индекс МосБиржи
    'RVI': 'RVI',           // Индекс волатильности
    
    // Валюты
    'Si': 'USD/RUB',        // Доллар-рубль
    'Eu': 'EUR/RUB',        // Евро-рубль
    'CNY': 'CNY/RUB',       // Юань-рубль
    
    // Сырье
    'BR': 'BR',             // Нефть Brent
    'WTI': 'WT',            // Нефть WTI
    'GOLD': 'AU',           // Золото
    'SILV': 'AG',           // Серебро
    'PLAT': 'PT',           // Платина
    'PALL': 'PD',           // Палладий
    'COPPER': 'CU',         // Медь
    'ALUM': 'AL',           // Алюминий
    'NICK': 'NI',           // Никель
    
    // Сельское хозяйство
    'WHT': 'WH',            // Пшеница
    'CORN': 'CR',           // Кукуруза
    'SOYB': 'SB',           // Соя
    'SUGR': 'SR',           // Сахар
    'COFF': 'CF',           // Кофе
    'COCOA': 'CC',          // Какао
    'COTN': 'CT',           // Хлопок
    
    // Акции (фьючерсы)
    'SBER': 'SBER',         // Сбербанк
    'VTBR': 'VTBR',         // ВТБ
    'GAZP': 'GAZP',         // Газпром
    'ROSN': 'ROSN',         // Роснефть
    'LKOH': 'LKOH',         // Лукойл
    'NVTK': 'NVTK',         // НОВАТЭК
    'TATN': 'TATN',         // Татнефть
    'GMKN': 'GMKN',         // Норникель
    'PLZL': 'PLZL',         // Полюс
    'MGNT': 'MGNT',         // Магнит
    'ALRS': 'ALRS',         // Алроса
    'AFLT': 'AFLT'          // Аэрофлот
};

// Топ-30 фьючерсов MOEX (отображаемые имена)
export const FUTURES_LIST = {
    'RTS': 'Индекс РТС',
    'MX': 'Индекс МосБиржи',
    'RVI': 'Индекс волатильности',
    'Si': 'Доллар-рубль',
    'Eu': 'Евро-рубль',
    'CNY': 'Юань-рубль',
    'BR': 'Нефть Brent',
    'WTI': 'Нефть WTI',
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
    'COCOA': 'Какао',
    'COTN': 'Хлопок',
    'SBER': 'Сбербанк (фьюч)',
    'VTBR': 'ВТБ (фьюч)',
    'GAZP': 'Газпром (фьюч)',
    'ROSN': 'Роснефть (фьюч)',
    'LKOH': 'Лукойл (фьюч)',
    'NVTK': 'НОВАТЭК (фьюч)',
    'TATN': 'Татнефть (фьюч)',
    'GMKN': 'Норникель (фьюч)'
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

// ⚠️ УСТАРЕВШИЕ ТИКЕРЫ - ОСТАВЛЯЕМ ТОЛЬКО ДЛЯ СОВМЕСТИМОСТИ
// НЕ ИСПОЛЬЗУЙТЕ ЭТОТ ОБЪЕКТ - ИСПОЛЬЗУЙТЕ ASSET_CODES И АВТОПОИСК
export const FUTURES_TICKERS = {
    'RTS': 'RTS-6.25',
    'Si': 'Si-6.25',
    'BR': 'BR-6.25',
    'GOLD': 'AU-6.25',
    'SILV': 'AG-6.25',
    'PLAT': 'PT-6.25',
    'PALL': 'PD-6.25',
    'COPPER': 'CU-6.25',
    'ALUM': 'AL-6.25',
    'NICK': 'NI-6.25',
    'WHT': 'WH-6.25',
    'CORN': 'CR-6.25',
    'SOYB': 'SB-6.25',
    'SUGR': 'SR-6.25',
    'COFF': 'CF-6.25',
    'COCOA': 'CC-6.25',
    'COTN': 'CT-6.25',
    'WTI': 'WT-6.25',
    'MX': 'MIX-6.25',
    'RVI': 'RVI-6.25',
    'SBER': 'SBRF-6.25',
    'VTBR': 'VTBR-6.25',
    'GAZP': 'GAZR-6.25',
    'ROSN': 'ROSN-6.25',
    'LKOH': 'LKOH-6.25',
    'NVTK': 'NVTK-6.25',
    'TATN': 'TATN-6.25',
    'GMKN': 'GMKN-6.25',
    'PLZL': 'PLZL-6.25',
    'MGNT': 'MGNT-6.25'
};
