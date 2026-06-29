export interface TranslationUnit {
  id: string;
  key: string;
  source: string;
  target: string;
  context?: string;
  notes?: string;
  filePath: string;
  lineNumber?: number;
  metadata?: Record<string, any>;
  index: number;
  status?: string;
  matchPercent?: number;
  isLocked?: boolean;
  conf?: string;
}


export interface TranslationFile {
  id: string;
  name: string;
  type: FileType;
  sourceLanguage: string;
  targetLanguage: string;
  units: TranslationUnit[];
  uploadedAt: Date;
  size: number;
}

export interface GlossaryTerm {
  source: string;
  target: string;
  context?: string;
}


export type FileType =
  | 'json'
  | 'xliff'
  | 'sdlxliff'
  | 'xml'
  | 'po'
  | 'pot'
  | 'strings'
  | 'yaml'
  | 'yml'
  | 'properties'
  | 'resx'
  | 'csv'
  | 'tmx'
  | 'tsv'
  | 'txt'
  | 'tbx'
  | 'ttx'
  | 'mqxliff'
  | 'mqxlz'
  | 'tipp'
  | 'xlsx'
  | 'xls';

export interface QAIssue {
  id: string;
  unitId: string;
  type: IssueType;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  target: string;
  key: string;
  suggestion?: string;
  autoFix?: string; // Content to replace the target with if auto-fixed
  index?: number;
  position?: {

    line?: number;
    column?: number;
  };
  highlights?: {
    source: string[];
    target: string[];
  };
  glossaryMatches?: {
    source: string;
    target: string;
  }[];
}


export type IssueCategory =
  | 'terminology'
  | 'numbers'
  | 'tags'
  | 'punctuation'
  | 'whitespace'
  | 'capitalization'
  | 'length'
  | 'consistency'
  | 'formatting'
  | 'language'
  | 'segment_structure'
  | 'regex'
  | 'localization'
  | 'spelling'
  | 'style_guide';

export type IssueType =
  | 'term_missing'
  | 'term_approved_not_used'
  | 'term_forbidden_used'
  | 'term_translation_mismatch'
  | 'term_partial_match'
  | 'term_case_mismatch'
  | 'term_inflection_mismatch'
  | 'term_multiple_translations'
  | 'term_inconsistency_across_segments'
  | 'num_missing'
  | 'num_extra'
  | 'num_mismatch'
  | 'num_decimal_mismatch'
  | 'num_thousand_mismatch'
  | 'num_currency_mismatch'
  | 'num_percentage_mismatch'
  | 'num_measurement_mismatch'
  | 'num_date_format_mismatch'
  | 'num_time_format_mismatch'
  | 'tag_missing'
  | 'tag_extra'
  | 'tag_order_mismatch'
  | 'tag_position_mismatch'
  | 'tag_pair_mismatch'
  | 'tag_formatting_mismatch'
  | 'tag_empty_issue'
  | 'tag_nested_incorrect'
  | 'tag_duplication'
  | 'punct_missing'
  | 'punct_extra'
  | 'punct_mismatch'
  | 'punct_double'
  | 'punct_incorrect_quotes'
  | 'punct_missing_end'
  | 'punct_quotes_mismatch'
  | 'punct_repeated'
  | 'space_leading'
  | 'space_trailing'
  | 'space_double'
  | 'space_before_punct'
  | 'space_missing_after_punct'
  | 'space_nbsp_mismatch'
  | 'space_tab_issue'
  | 'cap_mismatch'
  | 'cap_incorrect_upper'
  | 'cap_incorrect_lower'
  | 'cap_sentence_start'
  | 'cap_all_caps_mismatch'
  | 'len_target_short'
  | 'len_target_long'
  | 'len_expansion_limit'
  | 'len_char_limit'
  | 'len_empty_target'
  | 'consist_identical_source'
  | 'consist_repeated_phrase'
  | 'consist_terminology'
  | 'consist_style'
  | 'consist_context'
  | 'fmt_bold_mismatch'
  | 'fmt_italic_mismatch'
  | 'fmt_underline_mismatch'
  | 'fmt_html_mismatch'
  | 'fmt_line_break_mismatch'
  | 'fmt_paragraph_break_mismatch'
  | 'lang_spelling'
  | 'lang_grammar'
  | 'lang_detection_mismatch'
  | 'lang_mixed'
  | 'lang_locale_variant'
  | 'seg_empty'
  | 'seg_untranslated'
  | 'seg_source_copied'
  | 'seg_partial'
  | 'seg_duplicate'
  | 'seg_hidden_text'
  | 'regex_email'
  | 'regex_url'
  | 'regex_product_code'
  | 'regex_serial'
  | 'regex_custom'
  | 'cap_all_caps_word_mismatch'
  | 'num_alphanumeric_mismatch'
  | 'loc_date'
  | 'loc_currency'
  | 'loc_measurement'
  | 'loc_address'
  | 'loc_phone'
  | 'style_forbidden_words'
  | 'style_tone_mismatch'
  | 'style_formal_informal'
  | 'style_branding'
  | 'style_terminology_pref'
  | 'consist_identical_target'
  | 'punct_unpaired_symbol'
  | 'punct_unpaired_quotes'
  | 'lang_repeated_word'
  | 'cap_camel_case_mismatch'
  | 'lang_partial_untranslated';



export interface QAResult {
  fileId: string;
  fileName: string;
  totalUnits: number;
  issues: QAIssue[];
  stats: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    byType: Record<IssueType, number>;
  };
  completedAt: Date;
}

export interface QARule {
  id: IssueType;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
  check: (unit: TranslationUnit) => boolean | string | undefined;
}

export interface QAConfig {
  rules: Partial<Record<IssueType, boolean>>;
  maxLengthRatio: number;
  ignorePatterns: string[];
  customPlaceholders: string[];
  checkHtmlTags: boolean;
  checkXmlTags: boolean;
  checkPlaceholders: boolean;
  caseSensitive: boolean;
  glossary?: GlossaryTerm[];
  dictionary?: Set<string>;

  // New configuration fields
  customRules?: QACustomRule[];
  blacklist?: string[];
  localization?: {
    locale: string;
    dateFormat?: string;
    numberFormat?: string;
    allowedUnits?: string[];
  };
  selectiveFiltering?: {
    excludeIce?: boolean;
    excludeLocked?: boolean;
    exclude100?: boolean;
    excludeConf?: string[];
    excludePercent?: number;
    excludeUnlocked?: boolean;
  };
}

export interface QACustomRule {
  id: string;
  name: string;
  pattern: string; // Regex pattern
  type: 'forbidden' | 'required';
  severity: 'error' | 'warning' | 'info';
  message: string;
}


export interface BilingualPair {
  source: string;
  target: string;
  key: string;
  issues: QAIssue[];
}

export interface ExportFormat {
  type: 'json' | 'csv' | 'xlsx' | 'pdf' | 'html';
  includeSource: boolean;
  includeTarget: boolean;
  includeSuggestions: boolean;
  severityFilter: ('error' | 'warning' | 'info')[];
}

export const SUPPORTED_FILE_EXTENSIONS: Record<string, FileType> = {
  '.json': 'json',
  '.xliff': 'xliff',
  '.xlf': 'xliff',
  '.sdlxliff': 'sdlxliff',
  '.xml': 'xml',
  '.po': 'po',
  '.pot': 'pot',
  '.strings': 'strings',
  '.yaml': 'yaml',
  '.yml': 'yml',
  '.properties': 'properties',
  '.resx': 'resx',
  '.csv': 'csv',
  '.tmx': 'tmx',
  '.tsv': 'tsv',
  '.txt': 'txt',
  '.tbx': 'tbx',
  '.ttx': 'ttx',
  '.mqxliff': 'mqxliff',
  '.mqxlz': 'mqxlz',
  '.tipp': 'tipp',
  '.xlsx': 'xlsx',
  '.xls': 'xls',
};

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  json: 'JSON',
  xliff: 'XLIFF',
  sdlxliff: 'SDL XLIFF',
  xml: 'XML',
  po: 'Gettext PO',
  pot: 'Gettext POT',
  strings: 'iOS Strings',
  yaml: 'YAML',
  yml: 'YAML',
  properties: 'Java Properties',
  resx: '.NET RESX',
  csv: 'CSV',
  tmx: 'TMX',
  tsv: 'TSV',
  txt: 'Plain Text',
  tbx: 'TBX/MARTIF',
  ttx: 'Trados TTX',
  mqxliff: 'MemoQ XLIFF',
  mqxlz: 'MemoQ Zipped XLIFF',
  tipp: 'TIPP',
  xlsx: 'Excel Spreadsheet',
  xls: 'Excel Spreadsheet',
};

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  terminology: 'Terminology QA Checks',
  numbers: 'Numbers QA Checks',
  tags: 'Tag QA Checks',
  punctuation: 'Punctuation QA Checks',
  whitespace: 'Whitespace QA Checks',
  capitalization: 'Capitalization QA Checks',
  length: 'Length QA Checks',
  consistency: 'Consistency QA Checks',
  formatting: 'Formatting QA Checks',
  language: 'Language QA Checks',
  segment_structure: 'Target same as source',
  regex: 'Regex / Pattern QA Checks',
  localization: 'Localization QA Checks',
  spelling: 'Spelling Error',
  style_guide: 'Style Guide Checks'
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  term_missing: 'Termbase term missing in translation',
  term_approved_not_used: 'Approved term not used',
  term_forbidden_used: 'Forbidden term used',
  term_translation_mismatch: 'Term translation mismatch',
  term_partial_match: 'Partial terminology match',
  term_case_mismatch: 'Case mismatch in terminology',
  term_inflection_mismatch: 'Term inflection mismatch',
  term_multiple_translations: 'Multiple translation for same term',
  term_inconsistency_across_segments: 'Terminology inconsistency across segments',
  num_missing: 'Missing numbers',
  num_extra: 'Extra numbers',
  num_mismatch: 'Number mismatch',
  num_decimal_mismatch: 'Decimal separator mismatch',
  num_thousand_mismatch: 'Thousand separator mismatch',
  num_currency_mismatch: 'Currency value mismatch',
  num_percentage_mismatch: 'Percentage mismatch',
  num_measurement_mismatch: 'Measurement value mismatch',
  num_date_format_mismatch: 'Date format mismatch',
  num_time_format_mismatch: 'Time format mismatch',
  num_alphanumeric_mismatch: 'Alphanumeric Mismatch',
  tag_missing: 'Missing tag',
  tag_extra: 'Extra tag',
  tag_order_mismatch: 'Tag order mismatch',
  tag_position_mismatch: 'Tag position mismatch',
  tag_pair_mismatch: 'Tag pair mismatch',
  tag_formatting_mismatch: 'Tag formatting mismatch',
  tag_empty_issue: 'Empty tag issue',
  tag_nested_incorrect: 'Incorrect nested tags',
  tag_duplication: 'Tag duplication',
  punct_missing: 'Missing punctuation',
  punct_extra: 'Extra punctuation',
  punct_mismatch: 'Source-target punctuation mismatch',
  punct_double: 'Double punctuation',
  punct_incorrect_quotes: 'Incorrect quotation marks',
  punct_missing_end: 'Missing sentence-ending punctuation',
  punct_quotes_mismatch: 'Punctuation inside/outside quotes mismatch',
  punct_repeated: 'Repeated punctuation marks',
  space_leading: 'Leading whitespace',
  space_trailing: 'Trailing whitespace',
  space_double: 'Double spaces',
  space_before_punct: 'Space before punctuation',
  space_missing_after_punct: 'Missing space after punctuation',
  space_nbsp_mismatch: 'Non-breaking space mismatch',
  space_tab_issue: 'Tab character issue',
  cap_mismatch: 'Capitalization mismatch',
  cap_incorrect_upper: 'Incorrect uppercase word',
  cap_incorrect_lower: 'Incorrect lowercase word',
  cap_sentence_start: 'Sentence start capitalization error',
  cap_all_caps_mismatch: 'All caps mismatch',
  cap_all_caps_word_mismatch: 'ALLUPPERCASE Mismatch',
  len_target_short: 'Target too short',
  len_target_long: 'Target too long',
  len_expansion_limit: 'Expansion limit exceeded',
  len_char_limit: 'UI character limit exceeded',
  len_empty_target: 'Empty target segment',
  consist_identical_source: 'Inconsistent translation of identical source segments',
  consist_repeated_phrase: 'Inconsistent translation of repeated phrases',
  consist_terminology: 'Inconsistent terminology usage',
  consist_style: 'Inconsistent style',
  consist_context: 'Context-based inconsistency',
  fmt_bold_mismatch: 'Bold formatting mismatch',
  fmt_italic_mismatch: 'Italic formatting mismatch',
  fmt_underline_mismatch: 'Underline formatting mismatch',
  fmt_html_mismatch: 'HTML formatting mismatch',
  fmt_line_break_mismatch: 'Line break mismatch',
  fmt_paragraph_break_mismatch: 'Paragraph break mismatch',
  lang_spelling: 'Spelling error',
  lang_grammar: 'Typo',
  lang_detection_mismatch: 'Language detection mismatch',
  lang_mixed: 'Mixed language issue',
  lang_locale_variant: 'Incorrect locale variant',
  seg_empty: 'Empty target segment',
  seg_untranslated: 'Untranslated segment',
  seg_source_copied: 'Target same as source',
  seg_partial: 'Partial translation',
  seg_duplicate: 'Duplicate translation',
  seg_hidden_text: 'Hidden text issue',
  regex_email: 'Email format validation',
  regex_url: 'URL format validation',
  regex_product_code: 'Product code validation',
  regex_serial: 'Serial number validation',
  regex_custom: 'Custom regex rules',
  loc_date: 'Date localization issue',
  loc_currency: 'Currency localization issue',
  loc_measurement: 'Measurement unit mismatch',
  loc_address: 'Address format mismatch',
  loc_phone: 'Phone number format mismatch',
  style_forbidden_words: 'Forbidden words',
  style_tone_mismatch: 'Tone mismatch',
  style_formal_informal: 'Formal / informal style mismatch',
  style_branding: 'Branding guideline violation',
  style_terminology_pref: 'Terminology preference violation',
  consist_identical_target: 'Inconsistent translation of different source segments',
  punct_unpaired_symbol: 'Unpaired symbol (brackets, braces, etc.)',
  punct_unpaired_quotes: 'Unpaired quotation marks',
  lang_repeated_word: 'Repeated word in translation',
  cap_camel_case_mismatch: 'CamelCase mismatch',
  lang_partial_untranslated: 'Partially Untranslated (English word/character found in target)'
};

export const ISSUE_CATEGORY_MAP: Record<IssueType, IssueCategory> = {
  term_missing: 'terminology',
  term_approved_not_used: 'terminology',
  term_forbidden_used: 'terminology',
  term_translation_mismatch: 'terminology',
  term_partial_match: 'terminology',
  term_case_mismatch: 'terminology',
  term_inflection_mismatch: 'terminology',
  term_multiple_translations: 'terminology',
  term_inconsistency_across_segments: 'terminology',
  num_missing: 'numbers',
  num_extra: 'numbers',
  num_mismatch: 'numbers',
  num_decimal_mismatch: 'numbers',
  num_thousand_mismatch: 'numbers',
  num_currency_mismatch: 'numbers',
  num_percentage_mismatch: 'numbers',
  num_measurement_mismatch: 'numbers',
  num_date_format_mismatch: 'numbers',
  num_time_format_mismatch: 'numbers',
  num_alphanumeric_mismatch: 'numbers',
  tag_missing: 'tags',
  tag_extra: 'tags',
  tag_order_mismatch: 'tags',
  tag_position_mismatch: 'tags',
  tag_pair_mismatch: 'tags',
  tag_formatting_mismatch: 'tags',
  tag_empty_issue: 'tags',
  tag_nested_incorrect: 'tags',
  tag_duplication: 'tags',
  punct_missing: 'punctuation',
  punct_extra: 'punctuation',
  punct_mismatch: 'punctuation',
  punct_double: 'punctuation',
  punct_incorrect_quotes: 'punctuation',
  punct_missing_end: 'punctuation',
  punct_quotes_mismatch: 'punctuation',
  punct_repeated: 'punctuation',
  space_leading: 'whitespace',
  space_trailing: 'whitespace',
  space_double: 'whitespace',
  space_before_punct: 'whitespace',
  space_missing_after_punct: 'whitespace',
  space_nbsp_mismatch: 'whitespace',
  space_tab_issue: 'whitespace',
  cap_mismatch: 'capitalization',
  cap_incorrect_upper: 'capitalization',
  cap_incorrect_lower: 'capitalization',
  cap_sentence_start: 'capitalization',
  cap_all_caps_mismatch: 'capitalization',
  cap_all_caps_word_mismatch: 'capitalization',
  len_target_short: 'length',
  len_target_long: 'length',
  len_expansion_limit: 'length',
  len_char_limit: 'length',
  len_empty_target: 'length',
  consist_identical_source: 'consistency',
  consist_repeated_phrase: 'consistency',
  consist_terminology: 'consistency',
  consist_style: 'consistency',
  consist_context: 'consistency',
  fmt_bold_mismatch: 'formatting',
  fmt_italic_mismatch: 'formatting',
  fmt_underline_mismatch: 'formatting',
  fmt_html_mismatch: 'formatting',
  fmt_line_break_mismatch: 'formatting',
  fmt_paragraph_break_mismatch: 'formatting',
  lang_spelling: 'spelling',
  lang_grammar: 'language',
  lang_detection_mismatch: 'language',
  lang_mixed: 'language',
  lang_locale_variant: 'language',
  seg_empty: 'segment_structure',
  seg_untranslated: 'segment_structure',
  seg_source_copied: 'segment_structure',
  seg_partial: 'segment_structure',
  seg_duplicate: 'segment_structure',
  seg_hidden_text: 'segment_structure',
  regex_email: 'regex',
  regex_url: 'regex',
  regex_product_code: 'regex',
  regex_serial: 'regex',
  regex_custom: 'regex',
  loc_date: 'localization',
  loc_currency: 'localization',
  loc_measurement: 'localization',
  loc_address: 'localization',
  loc_phone: 'localization',
  style_forbidden_words: 'style_guide',
  style_tone_mismatch: 'style_guide',
  style_formal_informal: 'style_guide',
  style_branding: 'style_guide',
  style_terminology_pref: 'style_guide',
  consist_identical_target: 'consistency',
  punct_unpaired_symbol: 'punctuation',
  punct_unpaired_quotes: 'punctuation',
  lang_repeated_word: 'language',
  cap_camel_case_mismatch: 'capitalization',
  lang_partial_untranslated: 'language'
};



export const ISSUE_SEVERITY_COLORS = {
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};
