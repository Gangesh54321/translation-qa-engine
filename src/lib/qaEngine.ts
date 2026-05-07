import type { TranslationUnit, QAIssue, QAResult, IssueType, QAConfig, TranslationFile } from '@/types/translation';

function generateIssueId(): string {
  return `issue_${Math.random().toString(36).substring(2, 11)}`;
}

// ==========================================
// 1. TERMINOLOGY CHECKS
// ==========================================
function checkTerminology(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;
  if (config.glossary && config.glossary.length > 0) {
    for (const term of config.glossary) {
      if (!term.source || !term.target) continue;

      const sourceRegex = new RegExp(`\\b${term.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (sourceRegex.test(unit.source)) {
        const targetRegex = new RegExp(`\\b${term.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        
        if (!targetRegex.test(unit.target)) {
          if (rules.term_missing) {
            issues.push({
              id: generateIssueId(), unitId: unit.id, type: 'term_missing', severity: 'warning',
              message: `Termbase term missing: Expected "${term.target}" for "${term.source}"`,
              source: unit.source, target: unit.target, key: unit.key, suggestion: term.target
            });
          }
        }
      }
    }
  }

  if (rules.term_forbidden_used && config.blacklist && config.blacklist.length > 0) {
     for (const forbidden of config.blacklist) {
       const regex = new RegExp(`\\b${forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
       if (regex.test(unit.target)) {
         issues.push({
            id: generateIssueId(), unitId: unit.id, type: 'term_forbidden_used', severity: 'error',
            message: `Forbidden term used: "${forbidden}"`,
            source: unit.source, target: unit.target, key: unit.key
          });
       }
     }
  }

  return issues;
}

// ==========================================
// 2. NUMBERS CHECKS
// ==========================================
function checkNumbers(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;

  // Strip tags to avoid false positives from tag attributes (e.g. id="0")
  const stripTags = (text: string) => text.replace(/<[^>]+>/g, ' ');
  const sText = stripTags(unit.source);
  const tText = stripTags(unit.target);

  const sourceNumbers: string[] = sText.match(/\d+/g) || [];
  const targetNumbers: string[] = tText.match(/\d+/g) || [];

  if (rules.num_mismatch && sourceNumbers.length !== targetNumbers.length) {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'num_mismatch', severity: 'error',
      message: `Number count mismatch: source has ${sourceNumbers.length}, target has ${targetNumbers.length}`,
      source: unit.source, target: unit.target, key: unit.key
    });
  }

  if (rules.num_missing) {
    const missing = sourceNumbers.filter(n => !targetNumbers.includes(n));
    if (missing.length > 0) {
      issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'num_missing', severity: 'error',
        message: `Missing numbers in target: ${missing.join(', ')}`,
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }

  if (rules.num_extra) {
    const extra = targetNumbers.filter(n => !sourceNumbers.includes(n));
    if (extra.length > 0) {
      issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'num_extra', severity: 'error',
        message: `Extra numbers in target: ${extra.join(', ')}`,
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }

  return issues;
}

function checkAlphanumericMismatch(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  if (!config.rules.num_alphanumeric_mismatch) return issues;

  // Strip tags to avoid false positives from tag attributes
  const stripTags = (text: string) => text.replace(/<[^>]+>/g, ' ');
  const sText = stripTags(unit.source);
  const tText = stripTags(unit.target || '');

  const alphaNumPattern = /\b(?=[A-Za-z0-9]*[A-Za-z])(?=[A-Za-z0-9]*[0-9])[A-Za-z0-9]+\b/g;
  const sMatches = sText.match(alphaNumPattern) || [];
  const tMatches = tText.match(alphaNumPattern) || [];

  for (const match of sMatches) {
    if (!tMatches.some(tm => tm.toLowerCase() === match.toLowerCase())) {
        issues.push({
          id: generateIssueId(), unitId: unit.id, type: 'num_alphanumeric_mismatch', severity: 'warning',
          message: `Alphanumeric mismatch: "${match}" from source not found in target.`,
          source: unit.source, target: (unit.target || ''), key: unit.key
        });
    }
  }

  return issues;
}

// ==========================================
// 3. TAG CHECKS
// ==========================================
function checkTags(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;
  
  const tagPattern = /\{[0-9]+>|<[0-9]+\}|\{[0-9]+\}|<[^>]+>|\{\{[^}]+\}\}/g;
  
  const sourceTags = (unit.source || '').match(tagPattern) || [];
  const targetTags = (unit.target || '').match(tagPattern) || [];

  const getTagCounts = (tags: string[]) => {
    const counts: Record<string, number> = {};
    tags.forEach(t => counts[t] = (counts[t] || 0) + 1);
    return counts;
  };

  const sCounts = getTagCounts(sourceTags);
  const tCounts = getTagCounts(targetTags);

  if (rules.tag_missing || rules.tag_extra) {
    const missing = Object.keys(sCounts).filter(t => (tCounts[t] || 0) < sCounts[t]);
    const extra = Object.keys(tCounts).filter(t => (sCounts[t] || 0) < tCounts[t]);
    
    if (missing.length > 0 || extra.length > 0) {
      const messages = [];
      if (missing.length > 0) messages.push(`Missing: ${missing.join(', ')}`);
      if (extra.length > 0) messages.push(`Extra: ${extra.join(', ')}`);
      
      issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'tag_missing', severity: 'error',
        message: `Tag mismatch: ${messages.join(' | ')}`,
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }

  if (rules.tag_order_mismatch && sourceTags.length === targetTags.length && sourceTags.length > 0) {
    const isOrderSame = sourceTags.every((val, index) => val === targetTags[index]);
    if (!isOrderSame) {
       issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'tag_order_mismatch', severity: 'warning',
        message: `Tags are in a different order than the source.`,
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }

  return issues;
}

// ==========================================
// 4. PUNCTUATION CHECKS
// ==========================================
function checkPunctuation(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;

  const terminalPunctuation = /[.!?:;]$/;
  const sTerm = unit.source.trim().match(terminalPunctuation);
  const tTerm = unit.target.trim().match(terminalPunctuation);

  if (rules.punct_missing_end && sTerm && !tTerm) {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'punct_missing_end', severity: 'warning',
      message: `Missing terminal punctuation. Source ends with '${sTerm[0]}'`,
      source: unit.source, target: unit.target, key: unit.key, suggestion: unit.target + sTerm[0]
    });
  }

  if (rules.punct_double && /([.!?,;:])\1/.test(unit.target) && !/([.!?,;:])\1/.test(unit.source)) {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'punct_double', severity: 'warning',
      message: `Double punctuation detected in target.`,
      source: unit.source, target: unit.target, key: unit.key
    });
  }

  if (rules.punct_incorrect_quotes) {
    // Exclude apostrophes (single quote between letters)
    const quoteRegex = /"|(?<![a-zA-Z])'(?![a-zA-Z])/g;
    const sQuotes = (unit.source.match(quoteRegex) || []).length;
    const tQuotes = (unit.target.match(quoteRegex) || []).length;
    if (sQuotes !== tQuotes) {
       issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'punct_incorrect_quotes', severity: 'info',
        message: `Quote marks count mismatch (${sQuotes} vs ${tQuotes}).`,
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }

  if (rules.punct_unpaired_quotes) {
    const doubleQuotes = (unit.target.match(/"/g) || []).length;
    // Exclude apostrophes from unpaired check
    const singleQuotes = (unit.target.match(/(?<![a-zA-Z])'(?![a-zA-Z])/g) || []).length;
    if (doubleQuotes % 2 !== 0 || singleQuotes % 2 !== 0) {
      issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'punct_unpaired_quotes', severity: 'warning',
        message: 'Unpaired quotation marks detected in target.',
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }

  if (rules.punct_unpaired_symbol) {
    const symbols = [
      { open: '(', close: ')', name: 'Parentheses' },
      { open: '[', close: ']', name: 'Brackets' },
      { open: '{', close: '}', name: 'Braces' }
    ];
    for (const s of symbols) {
      const openCount = (unit.target.match(new RegExp('\\' + s.open, 'g')) || []).length;
      const closeCount = (unit.target.match(new RegExp('\\' + s.close, 'g')) || []).length;
      if (openCount !== closeCount) {
        issues.push({
          id: generateIssueId(), unitId: unit.id, type: 'punct_unpaired_symbol', severity: 'warning',
          message: `Unpaired ${s.name} detected in target (${openCount} open vs ${closeCount} close).`,
          source: unit.source, target: unit.target, key: unit.key
        });
      }
    }
  }

  return issues;
}

// ==========================================
// 5. WHITESPACE CHECKS
// ==========================================
function checkWhitespace(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;

  if (rules.space_leading && /^\s/.test(unit.target) && !/^\s/.test(unit.source)) {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'space_leading', severity: 'warning',
      message: 'Extra leading whitespace in target.',
      source: unit.source, target: unit.target, key: unit.key, autoFix: unit.target.trimStart()
    });
  }

  if (rules.space_trailing && /\s$/.test(unit.target) && !/\s$/.test(unit.source)) {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'space_trailing', severity: 'warning',
      message: 'Extra trailing whitespace in target.',
      source: unit.source, target: unit.target, key: unit.key, autoFix: unit.target.trimEnd()
    });
  }

  if (rules.space_double && /\s{2,}/.test(unit.target) && !/\s{2,}/.test(unit.source)) {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'space_double', severity: 'warning',
      message: 'Double spaces detected in target.',
      source: unit.source, target: unit.target, key: unit.key, autoFix: unit.target.replace(/\s{2,}/g, ' ')
    });
  }

  if (rules.space_before_punct && /\s+[.,;:!?]/.test(unit.target) && !/\s+[.,;:!?]/.test(unit.source)) {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'space_before_punct', severity: 'warning',
      message: 'Space found before punctuation mark.',
      source: unit.source, target: unit.target, key: unit.key
    });
  }

  return issues;
}

// ==========================================
// 6. CAPITALIZATION CHECKS
// ==========================================
function checkCapitalization(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;

  const sStartUppercase = /^[A-Z]/.test(unit.source.trim());
  const tStartUppercase = /^[A-Z]/.test(unit.target.trim());

  if (rules.cap_sentence_start && unit.source.trim() && unit.target.trim()) {
    if (sStartUppercase && !tStartUppercase && /[a-z]/.test(unit.target.trim()[0])) {
      issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'cap_sentence_start', severity: 'warning',
        message: 'Source starts with uppercase, target starts with lowercase.',
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }

  /* 
  const sAllCaps = unit.source.trim().length > 0 && unit.source.toUpperCase() === unit.source && /[A-Z]/.test(unit.source);
  const tAllCaps = unit.target.trim().length > 0 && unit.target.toUpperCase() === unit.target && /[A-Z]/.test(unit.target);

  if (rules.cap_all_caps_mismatch && sAllCaps !== tAllCaps) {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'cap_all_caps_mismatch', severity: 'warning',
      message: 'All uppercase formatting mismatch.',
      source: unit.source, target: unit.target, key: unit.key
    });
  }
  */

  return issues;
}

function checkUpperCaseMismatch(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  if (!config.rules.cap_all_caps_word_mismatch) return issues;

  // Find all-uppercase words with length >= 2
  const upperPattern = /\b[A-Z]{2,}\b/g;
  const sMatches: string[] = unit.source.match(upperPattern) || [];
  const tMatches: string[] = (unit.target || '').match(upperPattern) || [];

  const missing = sMatches.filter(sm => !tMatches.includes(sm));
  
  if (missing.length > 0) {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'cap_all_caps_word_mismatch', severity: 'warning',
      message: `ALLUPPERCASE Mismatch: "${missing.join(', ')}" in source not found in target in uppercase.`,
      source: unit.source, target: (unit.target || ''), key: unit.key
    });
  }

  return issues;
}

// ==========================================
// 7. LENGTH CHECKS
// ==========================================
function checkLength(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;

  if (rules.len_empty_target && unit.target.trim() === '') {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'len_empty_target', severity: 'error',
      message: 'Empty target segment.',
      source: unit.source, target: unit.target, key: unit.key
    });
    return issues;
  }

  const sLen = unit.source.length;
  const tLen = unit.target.length;

  if (rules.len_expansion_limit && sLen > 0) {
    const ratio = tLen / sLen;
    if (ratio > (config.maxLengthRatio || 1.5)) {
      issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'len_expansion_limit', severity: 'warning',
        message: `Target is ${(ratio*100).toFixed(0)}% longer than source (Limit: ${((config.maxLengthRatio || 1.5)*100).toFixed(0)}%).`,
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }

  if (rules.len_target_short && sLen > 10 && tLen < (sLen * 0.2)) {
    issues.push({
      id: generateIssueId(), unitId: unit.id, type: 'len_target_short', severity: 'warning',
      message: 'Target seems suspiciously short compared to source.',
      source: unit.source, target: unit.target, key: unit.key
    });
  }

  return issues;
}

// ==========================================
// 8. CONSISTENCY CHECKS
// ==========================================
// We pre-calculate maps for O(1) lookups instead of O(N) searching for every unit
export function prepareConsistencyMaps(allUnits: TranslationUnit[], config: QAConfig = DEFAULT_CONFIG) {
  const sourceToTargets = new Map<string, Set<string>>();
  const targetToSources = new Map<string, Set<string>>();
  const caseSensitive = config.caseSensitive;

  for (const u of allUnits) {
    if (!u.target) continue;
    
    const source = caseSensitive ? u.source : u.source.toLowerCase().trim();
    const target = caseSensitive ? u.target : u.target.toLowerCase().trim();

    // Source -> Target mapping
    if (!sourceToTargets.has(source)) {
      sourceToTargets.set(source, new Set());
    }
    sourceToTargets.get(source)!.add(u.target); // Keep original target for report display

    // Target -> Source mapping
    if (!targetToSources.has(target)) {
      targetToSources.set(target, new Set());
    }
    targetToSources.get(target)!.add(u.source); // Keep original source for report display
  }

  return { sourceToTargets, targetToSources };
}

function checkConsistency(
  unit: TranslationUnit, 
  maps: { sourceToTargets: Map<string, Set<string>>, targetToSources: Map<string, Set<string>> }, 
  config: QAConfig
): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;

  if (rules.consist_identical_source && unit.target.trim() !== '') {
    const source = config.caseSensitive ? unit.source : unit.source.toLowerCase().trim();
    const targets = maps.sourceToTargets.get(source);
    if (targets && targets.size > 1) {
      const otherTargets = Array.from(targets).filter(t => 
        config.caseSensitive ? t !== unit.target : t.toLowerCase().trim() !== unit.target.toLowerCase().trim()
      );
      if (otherTargets.length > 0) {
        issues.push({
          id: generateIssueId(), unitId: unit.id, type: 'consist_identical_source', severity: 'warning',
          message: `Identical source translated differently elsewhere: "${otherTargets[0]}"`,
          source: unit.source, target: unit.target, key: unit.key
        });
      }
    }
  }

  if (rules.consist_identical_target && unit.target.trim() !== '') {
    const target = config.caseSensitive ? unit.target : unit.target.toLowerCase().trim();
    const sources = maps.targetToSources.get(target);
    if (sources && sources.size > 1) {
      const otherSources = Array.from(sources).filter(s => 
        config.caseSensitive ? s !== unit.source : s.toLowerCase().trim() !== unit.source.toLowerCase().trim()
      );
      if (otherSources.length > 0) {
        issues.push({
          id: generateIssueId(), unitId: unit.id, type: 'consist_identical_target', severity: 'warning',
          message: `Identical target used for different source segments: "${otherSources[0]}"`,
          source: unit.source, target: unit.target, key: unit.key
        });
      }
    }
  }

  return issues;
}

// ==========================================
// 9. FORMATTING CHECKS
// ==========================================
function checkFormatting(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;

  if (rules.fmt_line_break_mismatch) {
    const sLineBreaks = (unit.source.match(/\n/g) || []).length;
    const tLineBreaks = (unit.target.match(/\n/g) || []).length;
    if (sLineBreaks !== tLineBreaks) {
      issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'fmt_line_break_mismatch', severity: 'warning',
        message: 'Line break count mismatch.',
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }

  return issues;
}

// ==========================================
// 10. LANGUAGE CHECKS
// ==========================================
function checkLanguage(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;

  if (rules.lang_repeated_word) {
    const repeated = /\b(\w+)\s+\1\b/gi;
    const matches = unit.target.match(repeated);
    if (matches && !unit.source.match(repeated)) {
      issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'lang_repeated_word', severity: 'warning',
        message: `Repeated word detected in target: "${matches[0]}"`,
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }

  if (rules.lang_mixed) {
     const hasCyrillic = /[\u0400-\u04FF]/.test(unit.target);
     const hasLatin = /[a-zA-Z]/.test(unit.target);
     if (hasCyrillic && hasLatin && !/[\u0400-\u04FF]/.test(unit.source)) {
       issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'lang_mixed', severity: 'warning',
        message: 'Mixed language scripts detected in target that are not in source.',
        source: unit.source, target: unit.target, key: unit.key
      });
     }
  }

  return issues;
}

function checkCamelCaseMismatch(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  if (!config.rules.cap_camel_case_mismatch) return issues;

  const camelPattern = /\b[a-z]+[A-Z][a-z]+\b/g;
  const sMatches: string[] = unit.source.match(camelPattern) || [];
  const tMatches: string[] = unit.target.match(camelPattern) || [];

  for (const match of sMatches) {
    if (!tMatches.includes(match)) {
      issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'cap_camel_case_mismatch', severity: 'warning',
        message: `CamelCase mismatch: "${match}" from source not found in target.`,
        source: unit.source, target: unit.target, key: unit.key
      });
    }
  }
  return issues;
}

// ==========================================
// 10.5 SPELLING CHECKS
// ==========================================
function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => 
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

function findSpellingSuggestion(word: string, dictSet: Set<string> & { byLength?: Map<number, string[]> }): string | undefined {
  if (word.length <= 3) return undefined;

  let bestSuggestion: string | undefined = undefined;
  let minDistance = 3;

  const lengthsToCheck = [word.length - 1, word.length, word.length + 1];
  const byLength = dictSet.byLength;

  if (byLength) {
    for (const len of lengthsToCheck) {
      const words = byLength.get(len);
      if (words) {
        for (const dictWord of words) {
          const distance = getLevenshteinDistance(word, dictWord);
          if (distance === 1) {
            return dictWord;
          }
          if (distance === 2 && distance < minDistance) {
            minDistance = distance;
            bestSuggestion = dictWord;
          }
        }
      }
    }
  } else {
    for (const dictWord of dictSet) {
      if (Math.abs(dictWord.length - word.length) <= 1) {
        const distance = getLevenshteinDistance(word, dictWord);
        if (distance === 1) {
          return dictWord;
        }
        if (distance === 2 && distance < minDistance) {
          minDistance = distance;
          bestSuggestion = dictWord;
        }
      }
    }
  }

  return bestSuggestion;
}

function dictionarySupportsScript(word: string, dictSet: Set<string>): boolean {
  if (/^[a-zA-Z0-9]+$/.test(word)) return true;

  const scripts = [
    { name: 'Kannada', regex: /[\u0C80-\u0CFF]/ },
    { name: 'Devanagari', regex: /[\u0900-\u097F]/ },
    { name: 'Bengali', regex: /[\u0980-\u09FF]/ },
    { name: 'Tamil', regex: /[\u0B80-\u0BFF]/ },
    { name: 'Telugu', regex: /[\u0C00-\u0C7F]/ },
    { name: 'Malayalam', regex: /[\u0D00-\u0D7F]/ },
    { name: 'Gujarati', regex: /[\u0A80-\u0AFF]/ },
    { name: 'Gurmukhi', regex: /[\u0A00-\u0A7F]/ },
    { name: 'Oriya', regex: /[\u0B00-\u0B7F]/ },
    { name: 'Arabic', regex: /[\u0600-\u06FF]/ },
    { name: 'Cyrillic', regex: /[\u0400-\u04FF]/ },
    { name: 'CJK', regex: /[\u4E00-\u9FFF]/ }
  ];

  for (const s of scripts) {
    if (s.regex.test(word)) {
      for (const dw of dictSet) {
        if (s.regex.test(dw)) return true;
      }
      return false;
    }
  }

  return true;
}

function checkSpelling(unit: TranslationUnit, config: QAConfig, dictionary?: any): QAIssue[] {
  const issues: QAIssue[] = [];
  console.log(`[Worker-Spellcheck] Unit ${unit.id} lang_spelling rule:`, config.rules.lang_spelling, "Dict length:", Array.isArray(dictionary) ? dictionary.length : dictionary instanceof Set ? dictionary.size : 'not array/set');
  if (!config.rules.lang_spelling || !dictionary) return issues;

  let dictSet: Set<string> & { byLength?: Map<number, string[]> };
  if (dictionary instanceof Set) {
    dictSet = dictionary;
  } else if (Array.isArray(dictionary)) {
    dictSet = new Set(dictionary);
  } else if (dictionary && typeof dictionary === 'object' && 'has' in dictionary) {
    dictSet = dictionary;
  } else {
    try {
      dictSet = new Set(Object.values(dictionary) as string[]);
    } catch {
      return issues;
    }
  }

  if (dictSet && !dictSet.byLength) {
    const byLength = new Map<number, string[]>();
    for (const word of dictSet) {
      if (word && word.length > 0) {
        const len = word.length;
        if (!byLength.has(len)) {
          byLength.set(len, []);
        }
        byLength.get(len)!.push(word);
      }
    }
    dictSet.byLength = byLength;
  }

  // Extract source words to skip them
  const sourceWords = new Set(
    ((unit.source || '').match(/[\p{L}\p{M}\u200c\u200d]+/gu) || []).map(w => w.toLowerCase())
  );

  // Extract glossary terms to skip them
  const glossaryWords = new Set<string>();
  if (config.glossary) {
    for (const term of config.glossary) {
      if (term.target) {
        const terms = (term.target.match(/[\p{L}\p{M}\u200c\u200d]+/gu) || []).map(w => w.toLowerCase());
        terms.forEach(w => glossaryWords.add(w));
      }
    }
  }

  // Extract unique target words cleanly, including matras/combining marks (\p{M}) and ZWJ/ZWNJ
  const words = Array.from(new Set(
    ((unit.target || '').match(/[\p{L}\p{M}\u200c\u200d]+/gu) || [])
      .filter(w => w.length >= 1 && !/\d/.test(w))
  ));

  for (const word of words) {
    // Skip if fully uppercase (acronym only for cased scripts like Latin/Cyrillic/Greek)
    if (word === word.toUpperCase() && word !== word.toLowerCase() && word.length >= 2) continue;

    // Skip if present in source text (case-insensitive)
    const lowerWord = word.toLowerCase();
    if (sourceWords.has(lowerWord)) continue;
    if (glossaryWords.has(lowerWord)) continue;

    // Skip if word's script is not supported in dictionary
    if (!dictionarySupportsScript(word, dictSet)) continue;

    if (!dictSet.has(lowerWord) && !dictSet.has(word)) {
      const suggestion = findSpellingSuggestion(lowerWord, dictSet);
      issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'lang_spelling', severity: 'warning',
        message: `Possible spelling error: "${word}"`,
        source: unit.source, target: unit.target, key: unit.key,
        suggestion: suggestion ? unit.target.replace(word, suggestion) : undefined,
        autoFix: suggestion ? unit.target.replace(word, suggestion) : undefined
      });
    }
  }

  return issues;
}

// ==========================================
// 11. SEGMENT STRUCTURE CHECKS
// ==========================================
function checkUntranslatedContent(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  if (!config.rules.lang_partial_untranslated) return issues;

  // Strip tags for clean text analysis
  const sourceText = String(unit.source || '').replace(/<[^>]+>/g, ' ');
  const targetText = String(unit.target || '').replace(/<[^>]+>/g, ' ');

  if (!targetText.trim() || targetText === sourceText) return issues; // seg_source_copied handles identical segments

  // 1. Detect if target uses a non-Latin script (Asian/Indian/Arabic/etc.)
  // We exclude common Latin, extended Latin (for accented chars), numbers and punctuation.
  const isNonLatin = /[^\u0000-\u024F\u1E00-\u1EFF\s\d.,/#!$%^&*;:{}=\-_`~()]/.test(targetText);

  // 2. Extract Latin/English words (2+ chars)
  const latinPattern = /\b[a-zA-Z]{2,}\b/g;
  const targetLatinWords = targetText.match(latinPattern) || [];
  const sourceLatinWords = sourceText.match(latinPattern) || [];

  const brandWhitelist = ['Google', 'Facebook', 'Windows', 'iPhone', 'Apple', 'Microsoft', 'Android', 'TransTech'];
  
  const flaggedWords: string[] = [];

  for (const word of targetLatinWords) {
    if (brandWhitelist.includes(word)) continue;

    // Check if the word is leaked directly from source
    const isLeaked = sourceLatinWords.some(sw => sw.toLowerCase() === word.toLowerCase());
    
    // Flag if:
    // A) It's an English word leaked from source (for any language)
    // B) It's a Latin word in a target that otherwise uses non-Latin scripts (Asian/Indian)
    if (isLeaked || isNonLatin) {
      flaggedWords.push(word);
    }
  }

  if (flaggedWords.length > 0) {
    const uniqueFlagged = Array.from(new Set(flaggedWords));
    
    issues.push({
      id: generateIssueId(),
      unitId: unit.id,
      type: 'lang_partial_untranslated',
      severity: 'error',
      message: `Partially Untranslated: ${isNonLatin ? 'English content found in non-Latin script' : 'Source text leakage detected'}: ${uniqueFlagged.join(', ')}`,
      source: unit.source,
      target: unit.target,
      key: unit.key,
      highlights: {
        source: [],
        target: uniqueFlagged
      }
    });
  }

  return issues;
}

function checkSegmentStructure(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;

  if (rules.seg_untranslated && unit.target === '') {
     issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'seg_untranslated', severity: 'error',
        message: 'Untranslated segment.',
        source: unit.source, target: unit.target, key: unit.key
      });
  }

  if (rules.seg_source_copied && unit.source === unit.target && unit.source.length > 3 && !/[0-9]+$/.test(unit.source)) {
     issues.push({
        id: generateIssueId(), unitId: unit.id, type: 'seg_source_copied', severity: 'info',
        message: 'Target is identical to source. Check if it requires translation.',
        source: unit.source, target: unit.target, key: unit.key
      });
  }

  return issues;
}

// ==========================================
// 12. REGEX / PATTERN CHECKS
// ==========================================
function checkRegex(unit: TranslationUnit, config: QAConfig): QAIssue[] {
  const issues: QAIssue[] = [];
  const rules = config.rules;

  if (rules.regex_email) {
      const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
      const sEmails = unit.source.match(emailPattern) || [];
      const tEmails = unit.target.match(emailPattern) || [];
      if (sEmails.length !== tEmails.length) {
         issues.push({
            id: generateIssueId(), unitId: unit.id, type: 'regex_email', severity: 'warning',
            message: 'Email address mismatch between source and target.',
            source: unit.source, target: unit.target, key: unit.key
          });
      }
  }

  if (rules.regex_url) {
      const urlPattern = /https?:\/\/[^\s]+/g;
      const sUrls = unit.source.match(urlPattern) || [];
      const tUrls = unit.target.match(urlPattern) || [];
      if (sUrls.length !== tUrls.length) {
         issues.push({
            id: generateIssueId(), unitId: unit.id, type: 'regex_url', severity: 'warning',
            message: 'URL mismatch between source and target.',
            source: unit.source, target: unit.target, key: unit.key
          });
      }
  }

  if (rules.regex_custom && config.customRules && config.customRules.length > 0) {
      for (const rule of config.customRules) {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          const matches = regex.test(unit.target);
          if ((rule.type === 'forbidden' && matches) || (rule.type === 'required' && !matches)) {
            issues.push({
              id: generateIssueId(), unitId: unit.id, type: 'regex_custom', severity: rule.severity,
              message: rule.message || `Custom regex rule '${rule.name}' failed.`,
              source: unit.source, target: unit.target, key: unit.key
            });
          }
        } catch (e) {
          // ignore
        }
      }
  }

  return issues;
}

// ==========================================
// 13. LOCALIZATION CHECKS
// ==========================================
function checkLocalization(_unit: TranslationUnit, _config: QAConfig): QAIssue[] {
  return [];
}

// ==========================================
// 14. STYLE GUIDE CHECKS
// ==========================================
function checkStyleGuide(_unit: TranslationUnit, _config: QAConfig): QAIssue[] {
  return [];
}


// ==========================================
// MASTER DISPATCH
// ==========================================
export function checkUnit(
  unit: TranslationUnit,
  allUnitsOrConfig: TranslationUnit[] | QAConfig = DEFAULT_CONFIG,
  maybeConfig?: QAConfig
): QAIssue[] {
  let allUnits: TranslationUnit[] = [];
  let config: QAConfig = DEFAULT_CONFIG;

  if (Array.isArray(allUnitsOrConfig)) {
    allUnits = allUnitsOrConfig;
    config = maybeConfig || DEFAULT_CONFIG;
  } else if (allUnitsOrConfig && typeof allUnitsOrConfig === 'object') {
    config = allUnitsOrConfig as QAConfig;
  }

  const maps = prepareConsistencyMaps([unit, ...allUnits], config);
  return checkUnitWithMaps(unit, maps, config);
}


export function checkUnitWithMaps(
  unit: TranslationUnit, 
  maps: { sourceToTargets: Map<string, Set<string>>, targetToSources: Map<string, Set<string>> }, 
  config: QAConfig
): QAIssue[] {
  let issues: QAIssue[] = [];

  issues.push(...checkTerminology(unit, config));
  issues.push(...checkNumbers(unit, config));
  issues.push(...checkTags(unit, config));
  issues.push(...checkPunctuation(unit, config));
  issues.push(...checkWhitespace(unit, config));
  issues.push(...checkCapitalization(unit, config));
  issues.push(...checkLength(unit, config));
  issues.push(...checkConsistency(unit, maps, config));
  issues.push(...checkFormatting(unit, config));
  issues.push(...checkLanguage(unit, config));
  issues.push(...checkSegmentStructure(unit, config));
  issues.push(...checkRegex(unit, config));
  issues.push(...checkUpperCaseMismatch(unit, config));
  issues.push(...checkAlphanumericMismatch(unit, config));
  issues.push(...checkLocalization(unit, config));
  issues.push(...checkStyleGuide(unit, config));
  issues.push(...checkCamelCaseMismatch(unit, config));
  issues.push(...checkUntranslatedContent(unit, config));
  if (config.dictionary) {
    issues.push(...checkSpelling(unit, config, config.dictionary));
  }

  // De-duplicate issues based on Type and Message for the same unit
  const seen = new Set<string>();
  issues = issues.filter(issue => {
    const key = `${issue.type}|${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  issues.forEach((i) => { i.index = unit.index; });

  return issues;
}

export const DEFAULT_CONFIG: QAConfig = {
  rules: {
    term_missing: true, term_approved_not_used: true, term_forbidden_used: true, term_translation_mismatch: true, term_partial_match: true, term_case_mismatch: true, term_inflection_mismatch: true, term_multiple_translations: true, term_inconsistency_across_segments: true,
    num_missing: true, num_extra: true, num_mismatch: true, num_decimal_mismatch: true, num_thousand_mismatch: true, num_currency_mismatch: true, num_percentage_mismatch: true, num_measurement_mismatch: true, num_date_format_mismatch: true, num_time_format_mismatch: true, num_alphanumeric_mismatch: true,
    tag_missing: true, tag_extra: false, tag_order_mismatch: true, tag_position_mismatch: true, tag_pair_mismatch: true, tag_formatting_mismatch: true, tag_empty_issue: true, tag_nested_incorrect: true, tag_duplication: true,
    punct_missing: true, punct_extra: true, punct_mismatch: true, punct_double: true, punct_incorrect_quotes: true, punct_missing_end: true, punct_quotes_mismatch: true, punct_repeated: true,
    space_leading: true, space_trailing: true, space_double: true, space_before_punct: true, space_missing_after_punct: true, space_nbsp_mismatch: true, space_tab_issue: true,
    cap_mismatch: true, cap_incorrect_upper: true, cap_incorrect_lower: true, cap_sentence_start: true, cap_all_caps_mismatch: false, cap_all_caps_word_mismatch: false,
    len_target_short: true, len_target_long: true, len_expansion_limit: true, len_char_limit: true, len_empty_target: true,
    consist_identical_source: true, consist_repeated_phrase: true, consist_terminology: true, consist_style: true, consist_context: true,
    fmt_bold_mismatch: true, fmt_italic_mismatch: true, fmt_underline_mismatch: true, fmt_html_mismatch: true, fmt_line_break_mismatch: true, fmt_paragraph_break_mismatch: true,
    lang_spelling: true, lang_grammar: true, lang_detection_mismatch: true, lang_mixed: true, lang_locale_variant: true,
    seg_empty: true, seg_untranslated: true, seg_source_copied: true, seg_partial: true, seg_duplicate: true, seg_hidden_text: true,
    regex_email: true, regex_url: true, regex_product_code: true, regex_serial: true, regex_custom: true,
    loc_date: true, loc_currency: true, loc_measurement: true, loc_address: true, loc_phone: true,
    style_forbidden_words: true, style_tone_mismatch: true, style_formal_informal: true, style_branding: true, style_terminology_pref: true,
    consist_identical_target: true, punct_unpaired_symbol: true, punct_unpaired_quotes: true, lang_repeated_word: true, cap_camel_case_mismatch: true,
    lang_partial_untranslated: true
  },
  maxLengthRatio: 1.5,
  ignorePatterns: [],
  customPlaceholders: [],
  checkHtmlTags: true,
  checkXmlTags: true,
  checkPlaceholders: true,
  caseSensitive: false,
  customRules: [],
  blacklist: [],
  selectiveFiltering: {
    excludeIce: undefined,
    excludeLocked: undefined,
  },
};

export function runQA(file: TranslationFile, config: QAConfig = DEFAULT_CONFIG, allUnits: TranslationUnit[] = []): QAResult {
  const allIssues: QAIssue[] = [];

  const selective = config.selectiveFiltering;

  let dictSet: Set<string> & { byLength?: Map<number, string[]> } | undefined = undefined;
  if (config.dictionary) {
    if (config.dictionary instanceof Set) {
      dictSet = config.dictionary;
    } else if (Array.isArray(config.dictionary)) {
      dictSet = new Set(config.dictionary);
    } else if (config.dictionary && typeof config.dictionary === 'object' && 'has' in config.dictionary) {
      dictSet = config.dictionary as unknown as Set<string>;
    } else {
      try {
        dictSet = new Set(Object.values(config.dictionary) as string[]);
      } catch {
        dictSet = undefined;
      }
    }

    if (dictSet && !dictSet.byLength) {
      const byLength = new Map<number, string[]>();
      for (const word of dictSet) {
        if (word && word.length > 0) {
          const len = word.length;
          if (!byLength.has(len)) {
            byLength.set(len, []);
          }
          byLength.get(len)!.push(word);
        }
      }
      dictSet.byLength = byLength;
    }
  }

  const optimizedConfig = { ...config, dictionary: dictSet };

  const unitsForConsistency = allUnits.length > 0 ? allUnits : file.units;
  const maps = prepareConsistencyMaps(unitsForConsistency, optimizedConfig);

  for (const unit of file.units) {
    // Selective Filtering Logic
    if (selective) {
      const status = unit.status?.toLowerCase() || '';
      // ICE: In-Context Exact match (often 101%) or specifically marked as approved/sign-off
      const isICE = status.includes('sign-off') || 
                    status.includes('approved') || 
                    status.includes('exact') ||
                    (unit.matchPercent !== undefined && unit.matchPercent > 100);
      
      const isLocked = unit.isLocked || status.includes('locked');
      // 100% Match: Exactly 100%, but not necessarily ICE/locked
      const is100 = unit.matchPercent === 100;

      if (selective.excludeIce && isICE) continue;
      if (selective.excludeLocked && isLocked) continue;
      if (selective.excludeUnlocked && !isLocked) continue;
      if (selective.exclude100 && is100) continue;
      
      if (selective.excludeConf && selective.excludeConf.length > 0 && unit.conf) {
        if (selective.excludeConf.includes(unit.conf)) continue;
      }

      if (selective.excludePercent !== undefined && unit.matchPercent !== undefined) {
        if (unit.matchPercent >= selective.excludePercent) continue;
      }
    }

    if (unit.target || (optimizedConfig.rules.seg_empty || optimizedConfig.rules.seg_untranslated || optimizedConfig.rules.len_empty_target)) {
       const issues = checkUnitWithMaps(unit, maps, optimizedConfig);
       allIssues.push(...issues);
    }
  }

  const byType: Partial<Record<IssueType, number>> = {};
  for (const issue of allIssues) {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
  }

  return {
    fileId: file.id,
    fileName: file.name,
    totalUnits: file.units.length,
    issues: allIssues,
    stats: {
      total: allIssues.length,
      errors: allIssues.filter(i => i.severity === 'error').length,
      warnings: allIssues.filter(i => i.severity === 'warning').length,
      info: allIssues.filter(i => i.severity === 'info').length,
      byType: byType as Record<IssueType, number>,
    },
    completedAt: new Date(),
  };
}

export function getEnabledRules(config: QAConfig = DEFAULT_CONFIG): IssueType[] {
  const rules = { ...DEFAULT_CONFIG.rules, ...config.rules };
  return Object.entries(rules)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type as IssueType);
}
