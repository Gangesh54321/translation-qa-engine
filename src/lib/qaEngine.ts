import type {
  TranslationUnit,
  QAIssue,
  QAResult,
  IssueType,
  QAConfig,
  TranslationFile,
  GlossaryTerm
} from '@/types/translation';



const DEFAULT_CONFIG: QAConfig = {
  rules: {
    missing_translation: true,
    empty_translation: true,
    leading_trailing_spaces: true,
    inconsistent_brackets: true,
    inconsistent_placeholders: true,
    inconsistent_punctuation: true,
    inconsistent_case: false,
    inconsistent_numbers: true,
    inconsistent_urls: true,
    inconsistent_emails: true,
    too_long_translation: true,
    potentially_incorrect_translation: false,
    duplicate_translation: true,
    invalid_html_tags: true,
    invalid_xml_tags: true,
    special_characters_mismatch: true,
    formatting_issues: true,
    untranslated_text: true,
    target_same_as_source: true,
    key_term_mismatch: true,
    alphanumeric_mismatch: true,
    inconsistent_source: true,
    inconsistent_target: true,
  },


  maxLengthRatio: 1.5,
  ignorePatterns: [],
  customPlaceholders: [],
  checkHtmlTags: true,
  checkXmlTags: true,
  checkPlaceholders: true,
  caseSensitive: false,
};

function generateIssueId(): string {
  return `issue_${Math.random().toString(36).substring(2, 11)}`;
}

// Check for missing translation
function checkMissingTranslation(unit: TranslationUnit): QAIssue | null {
  if (!unit.target || unit.target.trim() === '') {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'missing_translation',
      severity: 'error',
      message: 'Translation is missing',
      source: unit.source,
      target: unit.target,
      key: unit.key,
      suggestion: unit.source,
    };
  }
  return null;
}

// Check for empty translation (whitespace only)
function checkEmptyTranslation(unit: TranslationUnit): QAIssue | null {
  if (unit.target && unit.target.trim() === '' && unit.target.length > 0) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'empty_translation',
      severity: 'error',
      message: 'Translation contains only whitespace',
      source: unit.source,
      target: unit.target,
      key: unit.key,
      suggestion: unit.source,
    };
  }
  return null;
}

// Check for leading/trailing spaces
function checkLeadingTrailingSpaces(unit: TranslationUnit): QAIssue | null {
  const sourceHasLeading = /^\s/.test(unit.source);
  const sourceHasTrailing = /\s$/.test(unit.source);
  const targetHasLeading = /^\s/.test(unit.target);
  const targetHasTrailing = /\s$/.test(unit.target);

  if (sourceHasLeading !== targetHasLeading || sourceHasTrailing !== targetHasTrailing) {
    const issues: string[] = [];
    if (sourceHasLeading !== targetHasLeading) issues.push('leading spaces');
    if (sourceHasTrailing !== targetHasTrailing) issues.push('trailing spaces');

    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'leading_trailing_spaces',
      severity: 'warning',
      message: `Inconsistent ${issues.join(' and ')}`,
      source: unit.source,
      target: unit.target,
      key: unit.key,
      suggestion: (sourceHasLeading && !targetHasLeading ? ' ' : '') +
        unit.target.trim() +
        (sourceHasTrailing && !targetHasTrailing ? ' ' : ''),
    };
  }
  return null;
}

// Check for inconsistent brackets
function checkInconsistentBrackets(unit: TranslationUnit): QAIssue | null {
  const brackets: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
    '<': '>',
  };

  for (const [open, close] of Object.entries(brackets)) {
    const sourceOpen = (unit.source.match(new RegExp(`\\${open}`, 'g')) || []).length;
    const sourceClose = (unit.source.match(new RegExp(`\\${close}`, 'g')) || []).length;
    const targetOpen = (unit.target.match(new RegExp(`\\${open}`, 'g')) || []).length;
    const targetClose = (unit.target.match(new RegExp(`\\${close}`, 'g')) || []).length;

    if (sourceOpen !== targetOpen || sourceClose !== targetClose) {
      return {
        id: generateIssueId(),
        unitId: unit.id,
        type: 'inconsistent_brackets',
        severity: 'error',
        message: `Inconsistent ${open}${close} brackets`,
        source: unit.source,
        target: unit.target,
        key: unit.key,
      };
    }
  }
  return null;
}

// Check for inconsistent placeholders
function checkInconsistentPlaceholders(unit: TranslationUnit): QAIssue | null {
  // Common placeholder patterns
  const placeholderPatterns = [
    /%\d*\$?[sdif]/g,  // printf style: %s, %d, %1$s, etc.
    /\{\{?\s*\w+\s*\}?\}/g,  // Mustache/Handlebars: {{var}}, {var}
    /\$\{\w+\}/g,  // Shell style: ${var}
    /:\w+/g,  // Rails/Symbol style: :symbol
    /%\(\w+\)s/g,  // Python style: %(name)s
    /\{\w+\}/g,  // Simple brace: {var}
  ];

  for (const pattern of placeholderPatterns) {
    const sourcePlaceholders = unit.source.match(pattern) || [];
    const targetPlaceholders = unit.target.match(pattern) || [];

    if (sourcePlaceholders.length !== targetPlaceholders.length) {
      return {
        id: generateIssueId(),
        unitId: unit.id,
        type: 'inconsistent_placeholders',
        severity: 'error',
        message: `Placeholder count mismatch: expected ${sourcePlaceholders.length}, found ${targetPlaceholders.length}`,
        source: unit.source,
        target: unit.target,
        key: unit.key,
        suggestion: `Ensure all placeholders (${sourcePlaceholders.join(', ')}) are preserved`,
      };
    }
  }
  return null;
}

// Check for inconsistent punctuation
function checkInconsistentPunctuation(unit: TranslationUnit): QAIssue | null {
  const punctuationMarks = ['.', '!', '?', ':', ';', ','];
  const sourceEnd = unit.source.slice(-1);
  const targetEnd = unit.target.slice(-1);

  if (punctuationMarks.includes(sourceEnd) && sourceEnd !== targetEnd) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'inconsistent_punctuation',
      severity: 'warning',
      message: `Inconsistent ending punctuation: source ends with "${sourceEnd}"`,
      source: unit.source,
      target: unit.target,
      key: unit.key,
      suggestion: unit.target + sourceEnd,
    };
  }
  return null;
}

// Check for inconsistent numbers
function checkInconsistentNumbers(unit: TranslationUnit): QAIssue | null {
  const sourceNumbers = unit.source.match(/\d+/g) || [];
  const targetNumbers = unit.target.match(/\d+/g) || [];

  if (sourceNumbers.length !== targetNumbers.length) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'inconsistent_numbers',
      severity: 'warning',
      message: `Number count mismatch: expected ${sourceNumbers.length}, found ${targetNumbers.length}`,
      source: unit.source,
      target: unit.target,
      key: unit.key,
    };
  }
  return null;
}

// Check for inconsistent URLs
function checkInconsistentURLs(unit: TranslationUnit): QAIssue | null {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const sourceUrls = unit.source.match(urlPattern) || [];
  const targetUrls = unit.target.match(urlPattern) || [];

  if (sourceUrls.length !== targetUrls.length) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'inconsistent_urls',
      severity: 'warning',
      message: `URL count mismatch: expected ${sourceUrls.length}, found ${targetUrls.length}`,
      source: unit.source,
      target: unit.target,
      key: unit.key,
      suggestion: sourceUrls.join(', '),
    };
  }
  return null;
}

// Check for inconsistent emails
function checkInconsistentEmails(unit: TranslationUnit): QAIssue | null {
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
  const sourceEmails = unit.source.match(emailPattern) || [];
  const targetEmails = unit.target.match(emailPattern) || [];

  if (sourceEmails.length !== targetEmails.length) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'inconsistent_emails',
      severity: 'warning',
      message: `Email count mismatch: expected ${sourceEmails.length}, found ${targetEmails.length}`,
      source: unit.source,
      target: unit.target,
      key: unit.key,
    };
  }
  return null;
}

// Check for too long translation
function checkTooLongTranslation(unit: TranslationUnit, maxRatio = 1.5): QAIssue | null {
  if (unit.source.length > 0) {
    const ratio = unit.target.length / unit.source.length;
    if (ratio > maxRatio) {
      return {
        id: generateIssueId(),
        unitId: unit.id,
        type: 'too_long_translation',
        severity: 'warning',
        message: `Translation is ${(ratio * 100).toFixed(0)}% longer than source (max ${(maxRatio * 100).toFixed(0)}%)`,
        source: unit.source,
        target: unit.target,
        key: unit.key,
      };
    }
  }
  return null;
}

// Check for duplicate translations
function checkDuplicateTranslation(unit: TranslationUnit, allUnits: TranslationUnit[]): QAIssue | null {
  const duplicates = allUnits.filter(u =>
    u.id !== unit.id &&
    u.source === unit.source &&
    u.target === unit.target &&
    u.target !== ''
  );

  if (duplicates.length > 0) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'duplicate_translation',
      severity: 'info',
      message: `Duplicate translation found (${duplicates.length} instance${duplicates.length > 1 ? 's' : ''})`,
      source: unit.source,
      target: unit.target,
      key: unit.key,
    };
  }
  return null;
}

// Check for invalid HTML tags
function checkInvalidHtmlTags(unit: TranslationUnit): QAIssue | null {
  const htmlTagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  const sourceTags: string[] = [];
  const targetTags: string[] = [];

  let match;
  while ((match = htmlTagPattern.exec(unit.source)) !== null) {
    sourceTags.push(match[1].toLowerCase());
  }
  while ((match = htmlTagPattern.exec(unit.target)) !== null) {
    targetTags.push(match[1].toLowerCase());
  }

  // Check for unclosed tags in target
  const openTags: string[] = [];
  const targetMatches = unit.target.match(/<\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/g) || [];

  for (const tag of targetMatches) {
    if (tag.startsWith('</')) {
      const tagName = tag.replace(/<\//, '').replace(/>/, '').toLowerCase();
      if (openTags.length === 0 || openTags[openTags.length - 1] !== tagName) {
        return {
          id: generateIssueId(),
          unitId: unit.id,
          type: 'invalid_html_tags',
          severity: 'error',
          message: `Unmatched closing tag: ${tag}`,
          source: unit.source,
          target: unit.target,
          key: unit.key,
        };
      }
      openTags.pop();
    } else if (!tag.endsWith('/>')) {
      const tagName = tag.replace(/</, '').replace(/>/, '').split(' ')[0].toLowerCase();
      if (!['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName)) {
        openTags.push(tagName);
      }
    }
  }

  if (openTags.length > 0) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'invalid_html_tags',
      severity: 'error',
      message: `Unclosed HTML tags: ${openTags.join(', ')}`,
      source: unit.source,
      target: unit.target,
      key: unit.key,
    };
  }

  return null;
}

// Check for invalid XML tags
function checkInvalidXmlTags(unit: TranslationUnit): QAIssue | null {
  // Check for basic XML well-formedness
  const xmlTagPattern = /<([a-zA-Z_][a-zA-Z0-9_]*)([^>]*)>/g;

  const sourceTags = new Set<string>();
  const targetTags = new Set<string>();

  let match;
  while ((match = xmlTagPattern.exec(unit.source)) !== null) {
    sourceTags.add(match[1]);
  }
  while ((match = xmlTagPattern.exec(unit.target)) !== null) {
    targetTags.add(match[1]);
  }

  // Check for tags in target that don't exist in source
  for (const tag of targetTags) {
    if (!sourceTags.has(tag)) {
      return {
        id: generateIssueId(),
        unitId: unit.id,
        type: 'invalid_xml_tags',
        severity: 'warning',
        message: `XML tag "${tag}" not found in source`,
        source: unit.source,
        target: unit.target,
        key: unit.key,
      };
    }
  }

  return null;
}

// Check for special characters mismatch
function checkSpecialCharactersMismatch(unit: TranslationUnit): QAIssue | null {
  const specialChars = ['\n', '\t', '\\', '"', "'"];

  for (const char of specialChars) {
    const sourceCount = (unit.source.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const targetCount = (unit.target.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

    if (sourceCount !== targetCount) {
      return {
        id: generateIssueId(),
        unitId: unit.id,
        type: 'special_characters_mismatch',
        severity: 'warning',
        message: `Special character "${char.replace(/\n/, '\\n').replace(/\t/, '\\t')}" count mismatch`,
        source: unit.source,
        target: unit.target,
        key: unit.key,
      };
    }
  }

  return null;
}

// Check for formatting issues
function checkFormattingIssues(unit: TranslationUnit): QAIssue | null {
  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(unit.target) && !/\s{2,}/.test(unit.source)) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'formatting_issues',
      severity: 'info',
      message: 'Multiple consecutive spaces in translation',
      source: unit.source,
      target: unit.target,
      key: unit.key,
      suggestion: unit.target.replace(/\s{2,}/g, ' '),
    };
  }

  // Check for mixed line endings
  if (/\r\n/.test(unit.target) && !/\r\n/.test(unit.source)) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'formatting_issues',
      severity: 'info',
      message: 'Inconsistent line endings (CRLF vs LF)',
      source: unit.source,
      target: unit.target,
      key: unit.key,
    };
  }

  return null;
}

// Check for untranslated text (source appears in target)
function checkUntranslatedText(unit: TranslationUnit): QAIssue | null {
  // Skip short or numeric-only strings
  if (unit.source.length < 5 || /^\d+$/.test(unit.source)) {
    return null;
  }

  // Check if significant portion of source appears in target
  const words = unit.source.split(/\s+/).filter(w => w.length > 3);
  let untranslatedWords = 0;

  for (const word of words) {
    if (unit.target.toLowerCase().includes(word.toLowerCase())) {
      untranslatedWords++;
    }
  }

  if (words.length > 0 && untranslatedWords / words.length > 0.5) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'untranslated_text',
      severity: 'warning',
      message: 'Translation appears to contain untranslated text',
      source: unit.source,
      target: unit.target,
      key: unit.key,
    };
  }

  return null;
}

// Check if target is same as source
function checkTargetSameAsSource(unit: TranslationUnit): QAIssue | null {
  // Skip short strings, numbers, or technical terms
  if (unit.source.length < 3 || /^[\d\s\W]+$/.test(unit.source)) {
    return null;
  }

  if (unit.source.toLowerCase().trim() === unit.target.toLowerCase().trim()) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'target_same_as_source',
      severity: 'info',
      message: 'Translation is identical to source text',
      source: unit.source,
      target: unit.target,
      key: unit.key,
    };
  }

  return null;
}

// Check for key term mismatch (glossary enforcement)
function checkKeyTermMismatch(unit: TranslationUnit, glossary: GlossaryTerm[]): QAIssue | null {
  if (!glossary || glossary.length === 0) return null;

  const foundTerms: GlossaryTerm[] = [];

  for (const term of glossary) {
    if (!term.source || !term.target) continue;

    // Basic word boundaries check
    const escapedSource = term.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedSource}\\b`, 'i');

    if (regex.test(unit.source)) {
      // Source contains the term, check if target contains the glossary translation
      const escapedTarget = term.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const targetRegex = new RegExp(`\\b${escapedTarget}\\b`, 'i');

      if (!targetRegex.test(unit.target)) {
        foundTerms.push(term);
      }
    }
  }

  if (foundTerms.length > 0) {
    const termList = foundTerms.map(t => `"${t.source}" → "${t.target}"`).join(', ');
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'key_term_mismatch',
      severity: 'warning',
      message: `Glossary term mismatch. Expected translations: ${termList}`,
      source: unit.source,
      target: unit.target,
      key: unit.key,
      suggestion: foundTerms.map(t => t.target).join(', '),
    };
  }

  return null;
}

// Check for alphanumeric mismatches
function checkAlphanumericMismatch(unit: TranslationUnit): QAIssue | null {
  const sourceAlphas = unit.source.match(/[a-zA-Z0-9]+/g) || [];
  const targetAlphas = unit.target.match(/[a-zA-Z0-9]+/g) || [];

  const sourceMap: Record<string, number> = {};
  sourceAlphas.forEach(a => sourceMap[a] = (sourceMap[a] || 0) + 1);

  const targetMap: Record<string, number> = {};
  targetAlphas.forEach(a => targetMap[a] = (targetMap[a] || 0) + 1);

  const missingInTarget = sourceAlphas.filter(a => !targetMap[a]);
  const extraInTarget = targetAlphas.filter(a => !sourceMap[a]);

  if (missingInTarget.length > 0 || extraInTarget.length > 0) {
    let msg = 'Alphanumeric mismatch.';
    if (missingInTarget.length > 0) msg += ` Missing in target: ${Array.from(new Set(missingInTarget)).join(', ')}.`;
    if (extraInTarget.length > 0) msg += ` Extra in target: ${Array.from(new Set(extraInTarget)).join(', ')}.`;

    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'alphanumeric_mismatch',
      severity: 'warning',
      message: msg,
      source: unit.source,
      target: unit.target,
      key: unit.key,
    };
  }
  return null;
}

// Check for inconsistent source
function checkInconsistentSource(unit: TranslationUnit, allUnits: TranslationUnit[]): QAIssue | null {
  const duplicates = allUnits.filter(u => u.id !== unit.id && u.target === unit.target && u.source !== unit.source);
  if (duplicates.length > 0) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'inconsistent_source',
      severity: 'warning',
      message: 'Inconsistent source: the same translation is used for different source texts.',
      source: unit.source,
      target: unit.target,
      key: unit.key,
    };
  }
  return null;
}

// Check for inconsistent target
function checkInconsistentTarget(unit: TranslationUnit, allUnits: TranslationUnit[]): QAIssue | null {
  const duplicates = allUnits.filter(u => u.id !== unit.id && u.source === unit.source && u.target !== unit.target);
  if (duplicates.length > 0) {
    return {
      id: generateIssueId(),
      unitId: unit.id,
      type: 'inconsistent_target',
      severity: 'warning',
      message: 'Inconsistent target: the same source text has multiple different translations.',
      source: unit.source,
      target: unit.target,
      key: unit.key,
    };
  }
  return null;
}

// Main QA check function
export function checkUnit(unit: TranslationUnit, allUnits: TranslationUnit[], config: QAConfig = DEFAULT_CONFIG): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = { ...DEFAULT_CONFIG.rules, ...config.rules };

  const checks: { check: () => QAIssue | null; rule: IssueType }[] = [
    { check: () => checkMissingTranslation(unit), rule: 'missing_translation' },
    { check: () => checkEmptyTranslation(unit), rule: 'empty_translation' },
    { check: () => checkLeadingTrailingSpaces(unit), rule: 'leading_trailing_spaces' },
    { check: () => checkInconsistentBrackets(unit), rule: 'inconsistent_brackets' },
    { check: () => checkInconsistentPlaceholders(unit), rule: 'inconsistent_placeholders' },
    { check: () => checkInconsistentPunctuation(unit), rule: 'inconsistent_punctuation' },
    { check: () => checkInconsistentNumbers(unit), rule: 'inconsistent_numbers' },
    { check: () => checkInconsistentURLs(unit), rule: 'inconsistent_urls' },
    { check: () => checkInconsistentEmails(unit), rule: 'inconsistent_emails' },
    { check: () => checkTooLongTranslation(unit, config.maxLengthRatio), rule: 'too_long_translation' },
    { check: () => checkDuplicateTranslation(unit, allUnits), rule: 'duplicate_translation' },
    { check: () => checkInvalidHtmlTags(unit), rule: 'invalid_html_tags' },
    { check: () => checkInvalidXmlTags(unit), rule: 'invalid_xml_tags' },
    { check: () => checkSpecialCharactersMismatch(unit), rule: 'special_characters_mismatch' },
    { check: () => checkFormattingIssues(unit), rule: 'formatting_issues' },
    { check: () => checkUntranslatedText(unit), rule: 'untranslated_text' },
    { check: () => checkTargetSameAsSource(unit), rule: 'target_same_as_source' },
    { check: () => checkKeyTermMismatch(unit, config.glossary || []), rule: 'key_term_mismatch' },
    { check: () => checkAlphanumericMismatch(unit), rule: 'alphanumeric_mismatch' },
    { check: () => checkInconsistentSource(unit, allUnits), rule: 'inconsistent_source' },
    { check: () => checkInconsistentTarget(unit, allUnits), rule: 'inconsistent_target' },
  ];



  for (const { check, rule } of checks) {
    if (rules[rule]) {
      const issue = check();
      if (issue) {
        issue.index = unit.index;
        issues.push(issue);
      }
    }
  }


  return issues;
}

// Run full QA on a file
export function runQA(file: TranslationFile, config: QAConfig = DEFAULT_CONFIG): QAResult {
  const allIssues: QAIssue[] = [];

  for (const unit of file.units) {
    const issues = checkUnit(unit, file.units, config);
    allIssues.push(...issues);
  }

  const stats = {
    total: allIssues.length,
    errors: allIssues.filter(i => i.severity === 'error').length,
    warnings: allIssues.filter(i => i.severity === 'warning').length,
    info: allIssues.filter(i => i.severity === 'info').length,
    byType: {} as Record<IssueType, number>,
  };

  // Count by type
  for (const issue of allIssues) {
    stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;
  }

  return {
    fileId: file.id,
    fileName: file.name,
    totalUnits: file.units.length,
    issues: allIssues,
    stats,
    completedAt: new Date(),
  };
}

// Get enabled rules
export function getEnabledRules(config: QAConfig = DEFAULT_CONFIG): IssueType[] {
  const rules = { ...DEFAULT_CONFIG.rules, ...config.rules };
  return Object.entries(rules)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type as IssueType);
}

// Export default config
export { DEFAULT_CONFIG };
