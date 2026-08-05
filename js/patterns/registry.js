// js/patterns/registry.js

import { PinBarPattern } from './pinbar.js';
import { GoldenCrossPattern } from './golden_cross.js';
import { MA200TouchPattern } from './ma_200.js';
import { BreakoutPattern } from './breakout.js';
import { DoubleTopPattern, DoubleBottomPattern } from './double_top_bottom.js';
import { HeadShouldersPattern } from './head_shoulders.js';
import { CupHandlePattern } from './cup_handle.js';
import { FractalBreakoutPattern } from './fractal_breakout.js';
import { FakeBreakoutPattern } from './fake_breakout.js';

export class PatternRegistry {
    static #patterns = {};

    static register(patternClass, name = null) {
        const instance = new patternClass();
        const patternName = name || instance.name;
        this.#patterns[patternName] = instance;
        return patternClass;
    }

    static getPatternNames() {
        return Object.keys(this.#patterns);
    }

    static analyzeSymbol(candles, selectedPatterns) {
        const results = [];

        for (const patternName of selectedPatterns) {
            const pattern = this.#patterns[patternName];
            if (pattern) {
                const result = pattern.detect(candles);
                if (result) {
                    results.push({
                        pattern: patternName,
                        signal: result.signal,
                        description: result.description,
                        confidence: result.confidence || 'medium'
                    });
                }
            }
        }

        return results;
    }
}

// Автоматическая регистрация
PatternRegistry.register(PinBarPattern);
PatternRegistry.register(GoldenCrossPattern);
PatternRegistry.register(MA200TouchPattern);
PatternRegistry.register(BreakoutPattern);
PatternRegistry.register(DoubleTopPattern);
PatternRegistry.register(DoubleBottomPattern);
PatternRegistry.register(HeadShouldersPattern);
PatternRegistry.register(CupHandlePattern);
PatternRegistry.register(FractalBreakoutPattern);
PatternRegistry.register(FakeBreakoutPattern);
