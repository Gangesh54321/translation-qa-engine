import { describe, it, expect } from 'vitest';
import { getCategory } from './exportService';
import type { IssueType } from '@/types/translation';

describe('Export Service Categorization', () => {
    it('should categorize seg_untranslated as Basic', () => {
        expect(getCategory('seg_untranslated')).toBe('Basic');
    });

    it('should categorize suspicious_characters as Content', () => {
        expect(getCategory('suspicious_characters')).toBe('Content');
    });

    it('should categorize inconsistent_placeholders as Content', () => {
        expect(getCategory('inconsistent_placeholders')).toBe('Content');
    });

    it('should categorize seg_source_copied as Basic', () => {
        expect(getCategory('seg_source_copied')).toBe('Basic');
    });

    it('should categorize arbitrary Content issues correctly', () => {
        const contentTypes: IssueType[] = ['repeated_words', 'mixed_language', 'double_punctuation'];
        contentTypes.forEach(type => {
            expect(getCategory(type)).toBe('Content');
        });
    });
});
