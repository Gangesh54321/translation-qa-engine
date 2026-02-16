import { describe, it, expect } from 'vitest';
import { checkUnit, runQA, DEFAULT_CONFIG } from './qaEngine';
import type { TranslationUnit, TranslationFile } from '@/types/translation';

describe('QA Engine', () => {
    it('should detect missing translations', () => {
        const unit: TranslationUnit = {
            id: '1',
            key: 'key1',
            source: 'Source text',
            target: '',
            filePath: 'test.json',
            index: 0
        };
        const issues = checkUnit(unit, [unit], DEFAULT_CONFIG);
        expect(issues.some(i => i.type === 'missing_translation')).toBe(true);
    });

    it('should detect multiple spaces', () => {
        const unit: TranslationUnit = {
            id: '2',
            key: 'key2',
            source: 'Source with one space.',
            target: 'Target with  two  spaces.',
            filePath: 'test.json',
            index: 1
        };
        const issues = checkUnit(unit, [unit], DEFAULT_CONFIG);
        expect(issues.some(i => i.type === 'multiple_spaces')).toBe(true);
        expect(issues.find(i => i.type === 'multiple_spaces')?.autoFix).toBe('Target with two spaces.');
    });

    it('should detect double punctuation', () => {
        const unit: TranslationUnit = {
            id: '3',
            key: 'key3',
            source: 'Wait!',
            target: 'Wait!!',
            filePath: 'test.json',
            index: 2
        };
        const issues = checkUnit(unit, [unit], DEFAULT_CONFIG);
        expect(issues.some(i => i.type === 'double_punctuation')).toBe(true);
        expect(issues.find(i => i.type === 'double_punctuation')?.autoFix).toBe('Wait!');
    });

    it('should detect repeated words', () => {
        const unit: TranslationUnit = {
            id: '4',
            key: 'key4',
            source: 'The the issue.',
            target: 'The the issue.',
            filePath: 'test.json',
            index: 3
        };
        const issues = checkUnit(unit, [unit], DEFAULT_CONFIG);
        expect(issues.some(i => i.type === 'repeated_words')).toBe(true);
    });

    it('should detect mixed language (CJK symbols in English)', () => {
        const unit: TranslationUnit = {
            id: '5',
            key: 'key5',
            source: 'Hello world.',
            target: 'Hello 世界.',
            filePath: 'test.json',
            index: 4
        };
        const issues = checkUnit(unit, [unit], DEFAULT_CONFIG);
        expect(issues.some(i => i.type === 'mixed_language')).toBe(true);
    });

    it('should detect suspicious characters (null byte)', () => {
        const unit: TranslationUnit = {
            id: '6',
            key: 'key6',
            source: 'Clear text',
            target: 'Clear text\x00',
            filePath: 'test.json',
            index: 5
        };
        const issues = checkUnit(unit, [unit], DEFAULT_CONFIG);
        expect(issues.some(i => i.type === 'suspicious_characters')).toBe(true);
    });

    it('should detect inconsistent placeholders', () => {
        const unit: TranslationUnit = {
            id: '7',
            key: 'key7',
            source: 'User {0} logged in.',
            target: 'User {1} logged in.',
            filePath: 'test.json',
            index: 6
        };
        const issues = checkUnit(unit, [unit], DEFAULT_CONFIG);
        expect(issues.some(i => i.type === 'inconsistent_placeholders')).toBe(true);
    });

    it('should detect custom regex rules', () => {
        const unit: TranslationUnit = {
            id: '8',
            key: 'key8',
            source: 'BrandName is good.',
            target: 'BrandName is bad.',
            filePath: 'test.json',
            index: 7
        };
        const customRule = {
            id: 'rule1',
            name: 'Forbidden Word',
            pattern: 'bad',
            type: 'forbidden' as const,
            severity: 'error' as const,
            message: 'Do not use "bad"'
        };
        const issues = checkUnit(unit, [unit], { ...DEFAULT_CONFIG, customRules: [customRule] });
        expect(issues.some(i => i.type === 'custom_regex_match')).toBe(true);
    });

    it('should detect blacklist terms', () => {
        const unit: TranslationUnit = {
            id: '9',
            key: 'key9',
            source: 'This is fine.',
            target: 'This is forbidden.',
            filePath: 'test.json',
            index: 8
        };
        const issues = checkUnit(unit, [unit], { ...DEFAULT_CONFIG, blacklist: ['forbidden'] });
        expect(issues.some(i => i.type === 'blacklist_match')).toBe(true);
    });

    it('should detect alphanumeric mismatch (missing code)', () => {
        const unit: TranslationUnit = {
            id: '11',
            key: 'key11',
            source: 'Click APP123 to start.',
            target: 'Cliquez pour commencer.',
            filePath: 'test.json',
            index: 10
        };
        const issues = checkUnit(unit, [unit], DEFAULT_CONFIG);
        expect(issues.some(i => i.type === 'alphanumeric_mismatch')).toBe(true);
        expect(issues.find(i => i.type === 'alphanumeric_mismatch')?.message).toContain('APP123');
    });

    it('should detect alphanumeric mismatch (count mismatch)', () => {
        const unit: TranslationUnit = {
            id: '13',
            key: 'key13',
            source: 'Copy APP123 and APP123 here.',
            target: 'Copiez APP123 ici.',
            filePath: 'test.json',
            index: 12
        };
        const issues = checkUnit(unit, [unit], DEFAULT_CONFIG);
        expect(issues.some(i => i.type === 'alphanumeric_mismatch')).toBe(true);
        expect(issues.find(i => i.type === 'alphanumeric_mismatch')?.message).toContain('count mismatch');
    });

    it('should ignore standard words in alphanumeric check', () => {
        const unit: TranslationUnit = {
            id: '12',
            key: 'key12',
            source: 'The apple is red.',
            target: 'La pomme est rouge.',
            filePath: 'test.json',
            index: 11
        };
        const issues = checkUnit(unit, [unit], DEFAULT_CONFIG);
        expect(issues.some(i => i.type === 'alphanumeric_mismatch')).toBe(false);
    });

    it('should detect inconsistent target (Same source, different target)', () => {
        const units: TranslationUnit[] = [
            { id: '1', key: 'k1', source: 'Apple', target: 'Pomme', filePath: 'f1', index: 0 },
            { id: '2', key: 'k2', source: 'Apple', target: 'Manzana', filePath: 'f1', index: 1 }
        ];
        const issues = checkUnit(units[0], units, DEFAULT_CONFIG);
        const issue = issues.find(i => i.type === 'inconsistent_target');
        expect(issue).toBeDefined();
        expect(issue?.message).toContain('Also translated as: "Manzana"');
    });

    it('should detect same target for different sources (inconsistent source)', () => {
        const units: TranslationUnit[] = [
            { id: '1', key: 'k1', source: 'Apple', target: 'Pomme', filePath: 'f1', index: 0 },
            { id: '3', key: 'k3', source: 'Banana', target: 'Pomme', filePath: 'f1', index: 2 }
        ];
        const issues = checkUnit(units[0], units, DEFAULT_CONFIG);
        const issue = issues.find(i => i.type === 'inconsistent_source');
        expect(issue).toBeDefined();
        expect(issue?.message).toContain('Also found for: "Banana"');
    });

    it('should detect missing translation in repeated segments', () => {
        const units: TranslationUnit[] = [
            { id: '4', key: 'k4', source: 'Orange', target: '', filePath: 'f1', index: 3 },
            { id: '5', key: 'k5', source: 'Orange', target: 'Orange', filePath: 'f1', index: 4 }
        ];
        const issues = checkUnit(units[0], units, DEFAULT_CONFIG);
        const issue = issues.find(i => i.type === 'inconsistent_target');
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('Missing translation in repeated segment: This source is translated elsewhere.');
    });

    it('should run complete QA on a file', () => {
        const file: TranslationFile = {
            id: 'file1',
            name: 'test.json',
            type: 'json',
            sourceLanguage: 'en',
            targetLanguage: 'fr',
            units: [
                { id: '1', key: 'k1', source: 'Source', target: '', filePath: 'f1', index: 0 },
                { id: '2', key: 'k2', source: 'Text', target: 'Text  with spaces', filePath: 'f1', index: 1 }
            ],
            uploadedAt: new Date(),
            size: 100
        };
        const result = runQA(file, DEFAULT_CONFIG);
        expect(result.issues.length).toBeGreaterThanOrEqual(2);
        expect(result.stats.errors).toBeGreaterThan(0);
    });
});
