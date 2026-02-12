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
  | 'tsv';

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
  index?: number;
  position?: {

    line?: number;
    column?: number;
  };
}


export type IssueType =
  | 'missing_translation'
  | 'empty_translation'
  | 'leading_trailing_spaces'
  | 'inconsistent_brackets'
  | 'inconsistent_placeholders'
  | 'inconsistent_punctuation'
  | 'inconsistent_case'
  | 'inconsistent_numbers'
  | 'inconsistent_urls'
  | 'inconsistent_emails'
  | 'too_long_translation'
  | 'potentially_incorrect_translation'
  | 'duplicate_translation'
  | 'invalid_html_tags'
  | 'invalid_xml_tags'
  | 'special_characters_mismatch'
  | 'formatting_issues'
  | 'untranslated_text'
  | 'target_same_as_source'
  | 'key_term_mismatch'
  | 'alphanumeric_mismatch'
  | 'inconsistent_source'
  | 'inconsistent_target';



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
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  missing_translation: 'Missing Translation',
  empty_translation: 'Empty Translation',
  leading_trailing_spaces: 'Leading/Trailing Spaces',
  inconsistent_brackets: 'Inconsistent Brackets',
  inconsistent_placeholders: 'Inconsistent Placeholders',
  inconsistent_punctuation: 'Inconsistent Punctuation',
  inconsistent_case: 'Inconsistent Case',
  inconsistent_numbers: 'Inconsistent Numbers',
  inconsistent_urls: 'Inconsistent URLs',
  inconsistent_emails: 'Inconsistent Emails',
  too_long_translation: 'Too Long Translation',
  potentially_incorrect_translation: 'Potentially Incorrect',
  duplicate_translation: 'Duplicate Translation',
  invalid_html_tags: 'Invalid HTML Tags',
  invalid_xml_tags: 'Invalid XML Tags',
  special_characters_mismatch: 'Special Characters Mismatch',
  formatting_issues: 'Formatting Issues',
  untranslated_text: 'Untranslated Text',
  target_same_as_source: 'Target Same as Source',
  key_term_mismatch: 'Key Term Mismatch',
  alphanumeric_mismatch: 'Alphanumeric Mismatch',
  inconsistent_source: 'Inconsistent Source',
  inconsistent_target: 'Inconsistent Target',
};



export const ISSUE_SEVERITY_COLORS = {
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};
