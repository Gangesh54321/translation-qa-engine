import type { TranslationFile, TranslationUnit, FileType, GlossaryTerm } from '@/types/translation';
import * as XLSX from 'xlsx';

import { SUPPORTED_FILE_EXTENSIONS, FILE_TYPE_LABELS } from '@/types/translation';

export class FileParserError extends Error {
  fileName: string;
  constructor(message: string, fileName: string) {
    super(message);
    this.name = 'FileParserError';
    this.fileName = fileName;
  }
}

export function detectFileType(fileName: string): FileType | null {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return SUPPORTED_FILE_EXTENSIONS[extension] || null;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// JSON Parser
function parseJSON(content: string, fileName: string): TranslationFile {
  try {
    const data = JSON.parse(content);
    const units: TranslationUnit[] = [];

    function extractTranslations(obj: any, prefix = ''): void {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') {
          units.push({
            id: generateId(),
            key: fullKey,
            source: value,
            target: '',
            filePath: fileName,
            index: units.length + 1,
          });
        } else if (typeof value === 'object' && value !== null) {
          extractTranslations(value, fullKey);
        }
      }
    }


    // Handle nested JSON structures
    if (data.translations || data.messages || data.strings) {
      extractTranslations(data.translations || data.messages || data.strings);
    } else {
      extractTranslations(data);
    }

    return {
      id: generateId(),
      name: fileName,
      type: 'json',
      sourceLanguage: 'en',
      targetLanguage: '',
      units,
      uploadedAt: new Date(),
      size: content.length,
    };
  } catch (error) {
    throw new FileParserError('Invalid JSON format', fileName);
  }
}

// XLIFF Parser
function parseXLIFF(content: string, fileName: string): TranslationFile {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new FileParserError('Invalid XLIFF format', fileName);
  }

  const fileElements = doc.getElementsByTagName('file');
  if (fileElements.length === 0) {
    throw new FileParserError('No file elements found in XLIFF', fileName);
  }

  const fileEl = fileElements[0];
  const sourceLang = fileEl.getAttribute('source-language') || 'en';
  const targetLang = fileEl.getAttribute('target-language') || '';

  const units: TranslationUnit[] = [];
  const transUnits = doc.getElementsByTagName('trans-unit');

  for (let i = 0; i < transUnits.length; i++) {
    const unit = transUnits[i];
    const id = unit.getAttribute('id') || generateId();
    const sourceEl = unit.getElementsByTagName('source')[0];
    const targetEl = unit.getElementsByTagName('target')[0];
    const noteEl = unit.getElementsByTagName('note')[0];

    const source = sourceEl?.textContent || '';
    const target = targetEl?.textContent || '';
    const notes = noteEl?.textContent || undefined;

    units.push({
      id: generateId(),
      key: id,
      source,
      target,
      notes,
      filePath: fileName,
      index: units.length + 1,
    });
  }


  return {
    id: generateId(),
    name: fileName,
    type: 'xliff',
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

// XML Parser (Android strings.xml style)
function parseXML(content: string, fileName: string): TranslationFile {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new FileParserError('Invalid XML format', fileName);
  }

  const units: TranslationUnit[] = [];
  const stringElements = doc.getElementsByTagName('string');

  for (let i = 0; i < stringElements.length; i++) {
    const el = stringElements[i];
    const name = el.getAttribute('name') || `string_${i}`;
    const text = el.textContent || '';

    units.push({
      id: generateId(),
      key: name,
      source: text,
      target: '',
      filePath: fileName,
      index: units.length + 1,
    });
  }


  // Also parse string-array elements
  const arrayElements = doc.getElementsByTagName('string-array');
  for (let i = 0; i < arrayElements.length; i++) {
    const arr = arrayElements[i];
    const name = arr.getAttribute('name') || `array_${i}`;
    const items = arr.getElementsByTagName('item');

    for (let j = 0; j < items.length; j++) {
      units.push({
        id: generateId(),
        key: `${name}[${j}]`,
        source: items[j].textContent || '',
        target: '',
        filePath: fileName,
        index: units.length + 1,
      });
    }

  }

  return {
    id: generateId(),
    name: fileName,
    type: 'xml',
    sourceLanguage: 'en',
    targetLanguage: '',
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

// PO/POT Parser
function parsePO(content: string, fileName: string): TranslationFile {
  const units: TranslationUnit[] = [];
  const lines = content.split('\n');

  let currentMsgid = '';
  let currentMsgstr = '';
  let currentContext = '';
  let currentNotes = '';
  let inMsgid = false;
  let inMsgstr = false;

  function saveUnit(): void {
    if (currentMsgid) {
      units.push({
        id: generateId(),
        key: currentContext ? `${currentContext}\u0004${currentMsgid}` : currentMsgid,
        source: currentMsgid,
        target: currentMsgstr,
        context: currentContext || undefined,
        notes: currentNotes || undefined,
        filePath: fileName,
        index: units.length + 1,
      });
    }

    currentMsgid = '';
    currentMsgstr = '';
    currentContext = '';
    currentNotes = '';
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('msgctxt ')) {
      saveUnit();
      inMsgid = false;
      inMsgstr = false;
      currentContext = extractQuotedString(trimmed.substring(8));
    } else if (trimmed.startsWith('msgid ')) {
      if (inMsgstr) saveUnit();
      inMsgid = true;
      inMsgstr = false;
      currentMsgid = extractQuotedString(trimmed.substring(6));
    } else if (trimmed.startsWith('msgstr ')) {
      inMsgid = false;
      inMsgstr = true;
      currentMsgstr = extractQuotedString(trimmed.substring(7));
    } else if (trimmed.startsWith('"') && inMsgid) {
      currentMsgid += extractQuotedString(trimmed);
    } else if (trimmed.startsWith('"') && inMsgstr) {
      currentMsgstr += extractQuotedString(trimmed);
    } else if (trimmed.startsWith('#.')) {
      currentNotes += (currentNotes ? ' ' : '') + trimmed.substring(2).trim();
    }
  }

  saveUnit();

  return {
    id: generateId(),
    name: fileName,
    type: fileName.endsWith('.pot') ? 'pot' : 'po',
    sourceLanguage: 'en',
    targetLanguage: '',
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

function extractQuotedString(str: string): string {
  const match = str.match(/^\s*"(.*)"\s*$/);
  return match ? match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\') : '';
}

// iOS Strings Parser
function parseStrings(content: string, fileName: string): TranslationFile {
  const units: TranslationUnit[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Match "key" = "value";
    const match = trimmed.match(/^"([^"]*)"\s*=\s*"([^"]*)";$/);
    if (match) {
      units.push({
        id: generateId(),
        key: match[1],
        source: match[1],
        target: match[2],
        filePath: fileName,
        index: units.length + 1,
      });
    }

  }

  return {
    id: generateId(),
    name: fileName,
    type: 'strings',
    sourceLanguage: 'en',
    targetLanguage: '',
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

// YAML Parser
function parseYAML(content: string, fileName: string): TranslationFile {
  const units: TranslationUnit[] = [];
  const lines = content.split('\n');

  function parseYamlLine(line: string): { key: string; value: string; newIndent: number } | null {
    const match = line.match(/^(\s*)([\w-]+):\s*(.*)$/);
    if (!match) return null;

    return {
      key: match[2],
      value: match[3].trim(),
      newIndent: match[1].length,
    };
  }

  const keyStack: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parsed = parseYamlLine(line);

    if (parsed) {
      // Adjust stack based on indentation
      while (keyStack.length > parsed.newIndent / 2) {
        keyStack.pop();
      }

      if (parsed.value) {
        const fullKey = [...keyStack, parsed.key].join('.');
        units.push({
          id: generateId(),
          key: fullKey,
          source: parsed.value,
          target: '',
          filePath: fileName,
          lineNumber: i + 1,
          index: units.length + 1,
        });
      }
      else {
        keyStack.push(parsed.key);
      }
    }
  }

  return {
    id: generateId(),
    name: fileName,
    type: 'yaml',
    sourceLanguage: 'en',
    targetLanguage: '',
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

// Properties Parser (Java)
function parseProperties(content: string, fileName: string): TranslationFile {
  const units: TranslationUnit[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip comments and empty lines
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex > 0) {
      const key = line.substring(0, separatorIndex).trim();
      const value = line.substring(separatorIndex + 1).trim()
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');

      units.push({
        id: generateId(),
        key,
        source: value,
        target: '',
        filePath: fileName,
        lineNumber: i + 1,
        index: units.length + 1,
      });
    }

  }

  return {
    id: generateId(),
    name: fileName,
    type: 'properties',
    sourceLanguage: 'en',
    targetLanguage: '',
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

// CSV/TSV Parser
function parseCSV(content: string, fileName: string, delimiter = ','): TranslationFile {
  const units: TranslationUnit[] = [];
  const lines = content.split('\n');

  // Skip header if present
  const startIndex = lines[0].toLowerCase().includes('key') ||
    lines[0].toLowerCase().includes('source') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line, delimiter);
    if (columns.length >= 2) {
      units.push({
        id: generateId(),
        key: columns[0],
        source: columns[1],
        target: columns[2] || '',
        filePath: fileName,
        lineNumber: i + 1,
        index: units.length + 1,
      });
    }

  }

  return {
    id: generateId(),
    name: fileName,
    type: delimiter === '\t' ? 'tsv' : 'csv',
    sourceLanguage: 'en',
    targetLanguage: '',
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      if (inQuotes && line[line.indexOf(char) + 1] === '"') {
        current += '"';
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// RESX Parser (.NET)
function parseRESX(content: string, fileName: string): TranslationFile {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new FileParserError('Invalid RESX format', fileName);
  }

  const units: TranslationUnit[] = [];
  const dataElements = doc.getElementsByTagName('data');

  for (let i = 0; i < dataElements.length; i++) {
    const el = dataElements[i];
    const name = el.getAttribute('name') || `data_${i}`;
    const valueEl = el.getElementsByTagName('value')[0];
    const commentEl = el.getElementsByTagName('comment')[0];

    const value = valueEl?.textContent || '';
    const comment = commentEl?.textContent || undefined;

    units.push({
      id: generateId(),
      key: name,
      source: value,
      target: '',
      notes: comment,
      filePath: fileName,
      index: units.length + 1,
    });
  }


  return {
    id: generateId(),
    name: fileName,
    type: 'resx',
    sourceLanguage: 'en',
    targetLanguage: '',
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

// TMX Parser
function parseTMX(content: string, fileName: string): TranslationFile {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new FileParserError('Invalid TMX format', fileName);
  }

  const units: TranslationUnit[] = [];
  const tuElements = doc.getElementsByTagName('tu');

  for (let i = 0; i < tuElements.length; i++) {
    const tu = tuElements[i];
    const id = tu.getAttribute('id');
    const tuvElements = tu.getElementsByTagName('tuv');


    let source = '';
    let target = '';

    for (let j = 0; j < tuvElements.length; j++) {
      const tuv = tuvElements[j];
      const lang = tuv.getAttribute('xml:lang') || tuv.getAttribute('lang') || '';
      const seg = tuv.getElementsByTagName('seg')[0];
      const text = seg?.textContent || '';

      if (j === 0 || lang.startsWith('en')) {
        source = text;
      } else {
        target = text;
      }
    }

    units.push({
      id: generateId(),
      key: id || `tu_${i}`,
      source,
      target,
      filePath: fileName,
      index: units.length + 1,
    });
  }


  return {
    id: generateId(),
    name: fileName,
    type: 'tmx',
    sourceLanguage: 'en',
    targetLanguage: '',
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

// Main parse function
export async function parseFile(file: File): Promise<TranslationFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const fileType = detectFileType(file.name);

        if (!fileType) {
          reject(new FileParserError(`Unsupported file type: ${file.name}`, file.name));
          return;
        }

        let result: TranslationFile;

        switch (fileType) {
          case 'json':
            result = parseJSON(content, file.name);
            break;
          case 'xliff':
            result = parseXLIFF(content, file.name);
            break;
          case 'sdlxliff':
            result = parseXLIFF(content, file.name);
            result.type = 'sdlxliff';
            break;
          case 'xml':
            result = parseXML(content, file.name);
            break;
          case 'po':
          case 'pot':
            result = parsePO(content, file.name);
            break;
          case 'strings':
            result = parseStrings(content, file.name);
            break;
          case 'yaml':
          case 'yml':
            result = parseYAML(content, file.name);
            break;
          case 'properties':
            result = parseProperties(content, file.name);
            break;
          case 'csv':
            result = parseCSV(content, file.name, ',');
            break;
          case 'tsv':
            result = parseCSV(content, file.name, '\t');
            break;
          case 'resx':
            result = parseRESX(content, file.name);
            break;
          case 'tmx':
            result = parseTMX(content, file.name);
            break;
          default:
            throw new FileParserError(`Parser not implemented for type: ${fileType}`, file.name);
        }

        resolve(result);
      } catch (error) {
        reject(error instanceof FileParserError ? error : new FileParserError(String(error), file.name));
      }
    };

    reader.onerror = () => {
      reject(new FileParserError('Failed to read file', file.name));
    };

    reader.readAsText(file);
  });
}

export function getSupportedFileTypes(): string[] {
  return Object.keys(SUPPORTED_FILE_EXTENSIONS).map(ext => ext.substring(1));
}

export function getFileTypeLabel(fileType: FileType): string {
  return FILE_TYPE_LABELS[fileType] || fileType.toUpperCase();
}

// specialized Glossary Parsers
export async function parseGlossaryFile(file: File): Promise<GlossaryTerm[]> {
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (extension === '.xlsx' || extension === '.xls') {
    return parseExcelGlossary(file);
  } else if (extension === '.tmx') {
    return parseTMXGlossary(file);
  } else if (extension === '.csv' || extension === '.tsv') {
    return parseCSVGlossary(file);
  }

  throw new Error(`Unsupported glossary format: ${extension}`);
}

async function parseExcelGlossary(file: File): Promise<GlossaryTerm[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const terms: GlossaryTerm[] = [];
        let startIndex = 0;
        if (json.length > 0) {
          const firstRow = json[0].map(c => String(c || '').toLowerCase());
          if (firstRow.includes('source') || firstRow.includes('term')) {
            startIndex = 1;
          }
        }

        for (let i = startIndex; i < json.length; i++) {
          const row = json[i];
          if (row && row.length >= 2 && row[0] && row[1]) {
            terms.push({
              source: String(row[0]).trim(),
              target: String(row[1]).trim(),
              context: row[2] ? String(row[2]).trim() : undefined
            });
          }
        }
        resolve(terms);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read Excel glossary'));
    reader.readAsArrayBuffer(file);
  });
}

async function parseTMXGlossary(file: File): Promise<GlossaryTerm[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'application/xml');
        const terms: GlossaryTerm[] = [];
        const tuEntries = doc.getElementsByTagName('tu');

        for (let i = 0; i < tuEntries.length; i++) {
          const tu = tuEntries[i];
          const tuvElements = tu.getElementsByTagName('tuv');

          let source = '';
          let target = '';

          for (let j = 0; j < tuvElements.length; j++) {
            const tuv = tuvElements[j];
            const lang = tuv.getAttribute('xml:lang') || tuv.getAttribute('lang') || '';
            const seg = tuv.getElementsByTagName('seg')[0];
            const text = seg?.textContent || '';

            if (lang.toLowerCase().startsWith('en') || j === 0) {
              if (!source) source = text;
              else if (j > 0) target = text;
            } else {
              target = text;
            }
          }

          if (source && target) {
            terms.push({ source, target });
          }
        }
        resolve(terms);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });
}

async function parseCSVGlossary(file: File): Promise<GlossaryTerm[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const delimiter = file.name.endsWith('.tsv') ? '\t' : ',';
        const lines = content.split('\n');
        const terms: GlossaryTerm[] = [];

        let startIndex = 0;
        if (lines.length > 0) {
          const firstRow = lines[0].toLowerCase();
          if (firstRow.includes('source') || firstRow.includes('term')) {
            startIndex = 1;
          }
        }

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const columns = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
          if (columns.length >= 2) {
            terms.push({
              source: columns[0],
              target: columns[1],
              context: columns[2]
            });
          }
        }
        resolve(terms);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });
}

