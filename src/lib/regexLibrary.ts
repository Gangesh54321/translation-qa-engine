/**
 * Regex patterns for standard QA checks
 */
export const QA_PATTERNS = {
    // Multiple spaces (excluding leading/trailing which are handled separately)
    multiple_spaces: /\s{2,}/g,

    // Double punctuation (e.g., .., !!, ??)
    double_punctuation: /[.,!?;:]{2,}/g,

    // Suspicious characters (control chars, non-printable, or common corruption markers)
    suspicious_characters: /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g,

    // Repeated words (case insensitive, consecutive)
    repeated_words: /\b(\w+)\s+\1\b/gi,

    // Standard placeholders formats
    placeholders: {
        icu: /\{[^}]+\}/g,
        printf: /%[0-9.]*[a-z]/gi,
        brackets: /\[[^\]]+\]/g,
        rails: /%\{[^}]+\}/g,
    },

    // Alphanumeric tokens (any word containing at least one digit)
    alphanumeric_tokens: /\b\w*\d\w*\b/g,

    // Localization specific
    units: {
        metric: /\b\d+(?:\.\d+)?\s*(?:km|m|cm|mm|kg|g|l|ml)\b/gi,
        imperial: /\b\d+(?:\.\d+)?\s*(?:mi|ft|in|lb|oz|gal)\b/gi,
    },

    // Language detection heuristics (simplified)
    mixed_language: {
        cjk: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/,
        arabic: /[\u0600-\u06FF]/,
        cyrillic: /[\u0400-\u04FF]/,
        greek: /[\u0370-\u03FF]/,
    }
};

/**
 * Common auto-fix logic
 */
export const AUTO_FIX_MAP = {
    multiple_spaces: (text: string) => text.replace(/\s{2,}/g, ' '),
    double_punctuation: (text: string) => text.replace(/([.,!?;:])\1+/g, '$1'),
    leading_trailing_spaces: (text: string) => text.trim(),
};

/**
 * Validate if two sets of placeholders match
 */
export function comparePlaceholders(source: string, target: string, pattern: RegExp): boolean {
    const sourceMatches = source.match(pattern) || [];
    const targetMatches = target.match(pattern) || [];

    if (sourceMatches.length !== targetMatches.length) return false;

    // Check if all source placeholders exist in target (order might vary)
    const sourceSorted = [...sourceMatches].sort();
    const targetSorted = [...targetMatches].sort();

    return sourceSorted.every((val, index) => val === targetSorted[index]);
}
