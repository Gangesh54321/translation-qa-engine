import type { TranslationFile, TranslationUnit, FileType, GlossaryTerm } from '@/types/translation';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

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
  if (!fileName || !fileName.includes('.')) return null;
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
  const seenUnitIds = new Set<string>();

  for (let i = 0; i < transUnits.length; i++) {
    const unit = transUnits[i];
    const unitId = unit.getAttribute('id') || `unit-${i}`;
    
    // Safety: some SDLXLIFF files repeat trans-unit nodes across different structural elements
    if (seenUnitIds.has(unitId)) continue;
    seenUnitIds.add(unitId);
    
    // Find source and target as DIRECT children to avoid duplicates from alt-trans or metadata
    let sourceEl: Element | null = null;
    let targetEl: Element | null = null;
    let noteEl: Element | null = null;

    for (let j = 0; j < unit.childNodes.length; j++) {
      const node = unit.childNodes[j];
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const localName = el.localName || el.nodeName.split(':').pop()?.toLowerCase();
        if (localName === 'source') sourceEl = el;
        else if (localName === 'target') targetEl = el;
        else if (localName === 'note') noteEl = el;
      }
    }

    const getCleanContent = (node: Element | null): string => {
      if (!node) return '';
      
      const processNode = (n: Node): string => {
        if (n.nodeType === Node.ELEMENT_NODE) {
          const el = n as Element;
          const localName = el.localName || el.nodeName.split(':').pop()?.toLowerCase();
          
          if (localName === 'mrk') {
            let res = '';
            for (let k = 0; k < n.childNodes.length; k++) {
              res += processNode(n.childNodes[k]);
            }
            return res;
          }
          
          // Identify tag ID (priority: id > rid > name)
          const tagId = el.getAttribute('id') || el.getAttribute('rid') || el.getAttribute('name') || el.getAttribute('pos') || '?';
          
          if (localName === 'bpt' || localName === 'bx') {
            return `{${tagId}}`;
          } else if (localName === 'ept' || localName === 'ex') {
            return `{/${tagId}}`;
          } else if (localName === 'ph' || localName === 'x' || localName === 'it' || localName === 'st') {
            return `{${tagId}}`;
          } else if (localName === 'g') {
            let res = `{${tagId}}`;
            for (let k = 0; k < n.childNodes.length; k++) {
              res += processNode(n.childNodes[k]);
            }
            res += `{/${tagId}}`;
            return res;
          }
          
          // Fallback for other elements
          if (n.childNodes.length > 0) {
            let res = `{${tagId}}`;
            for (let k = 0; k < n.childNodes.length; k++) {
              res += processNode(n.childNodes[k]);
            }
            res += `{/${tagId}}`;
            return res;
          } else {
            return `{${tagId}}`;
          }
        } else if (n.nodeType === Node.TEXT_NODE) {
          return n.textContent || '';
        }
        return '';
      };

      // Heuristic: If the node contains segmentation markers, prioritize them
      const mrks = Array.from(node.getElementsByTagName('mrk'))
        .filter(m => m.getAttribute('mtype') === 'seg' || m.hasAttribute('mid'));

      if (mrks.length > 0) {
        const seenMids = new Set<string>();
        let result = '';
        
        for (const mrk of mrks) {
          const mid = mrk.getAttribute('mid');
          if (mid && seenMids.has(mid)) continue;
          if (mid) seenMids.add(mid);
          
          for (let k = 0; k < mrk.childNodes.length; k++) {
            result += processNode(mrk.childNodes[k]);
          }
        }
        
        if (result.trim()) return result;
      }
      
      // Fallback: full inner content
      let fallbackResult = '';
      for (let j = 0; j < node.childNodes.length; j++) {
        fallbackResult += processNode(node.childNodes[j]);
      }
      
      return fallbackResult || node.textContent || '';
    };

    const source = getCleanContent(sourceEl);
    const target = getCleanContent(targetEl);
    const notes = noteEl?.textContent || undefined;

    const state = targetEl?.getAttribute('state') || '';
    const conf = targetEl?.getAttribute('conf') || unit.getAttribute('conf') || '';
    const isLocked = unit.getAttribute('locked') === 'yes' || unit.getAttribute('locked') === 'true' || unit.getAttribute('mq:locked') === 'yes';
    
    // MemoQ specific status and match rate
    const mqStatus = unit.getAttribute('mq:status') || targetEl?.getAttribute('mq:status') || '';
    const mqPercent = unit.getAttribute('mq:percent') || targetEl?.getAttribute('mq:percent') || '';
    
    const matchRate = mqPercent || unit.getAttribute('match-quality') || unit.getAttribute('percent-match') || '';
    const matchPercent = matchRate ? parseInt(matchRate, 10) : undefined;

    units.push({
      id: generateId(),
      key: unitId,
      source,
      target,
      notes,
      status: state || conf || undefined,
      conf: conf || undefined,
      matchPercent,
      isLocked: isLocked || state.toLowerCase().includes('locked'),
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

// TXT Parser (Plain text or tab-delimited)
function parseTXT(content: string, fileName: string): TranslationFile {
  const units: TranslationUnit[] = [];
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Try tab first
    const parts = line.split('\t');
    let source = parts[0];
    let target = parts.length > 1 ? parts[1] : parts[0];

    units.push({
      id: generateId(),
      key: `line_${i + 1}`,
      source,
      target,
      filePath: fileName,
      index: i + 1,
    });
  }

  return {
    id: generateId(),
    name: fileName,
    type: 'txt',
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

// TBX Parser
function parseTBX(content: string, fileName: string): TranslationFile {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new FileParserError('Invalid TBX format', fileName);
  }

  const units: TranslationUnit[] = [];
  const termEntries = doc.getElementsByTagName('termEntry');

  for (let i = 0; i < termEntries.length; i++) {
    const entry = termEntries[i];
    const id = entry.getAttribute('id') || `term_${i}`;
    const langSets = entry.getElementsByTagName('langSet');

    let source = '';
    let target = '';

    for (let j = 0; j < langSets.length; j++) {
      const langSet = langSets[j];
      const lang = langSet.getAttribute('xml:lang') || langSet.getAttribute('lang') || '';
      const term = langSet.getElementsByTagName('term')[0]?.textContent || '';

      if (lang.toLowerCase().startsWith('en') || j === 0) {
        if (!source) source = term;
        else if (j > 0) target = term;
      } else {
        target = term;
      }
    }

    if (source) {
      units.push({
        id: generateId(),
        key: id,
        source,
        target,
        filePath: fileName,
        index: units.length + 1,
      });
    }
  }

  return {
    id: generateId(),
    name: fileName,
    type: 'tbx',
    sourceLanguage: 'en',
    targetLanguage: '',
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

// TTX Parser (Trados TagEditor)
function parseTTX(content: string, fileName: string): TranslationFile {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new FileParserError('Invalid TTX format', fileName);
  }

  const units: TranslationUnit[] = [];
  const tuElements = doc.getElementsByTagName('tu');

  for (let i = 0; i < tuElements.length; i++) {
    const tu = tuElements[i];
    const tuvElements = tu.getElementsByTagName('tuv');

    let source = '';
    let target = '';

    for (let j = 0; j < tuvElements.length; j++) {
      const tuv = tuvElements[j];
      // TTX segments are usually inside <seg>
      const seg = tuv.getElementsByTagName('seg')[0];
      const text = seg?.textContent || '';

      if (j === 0) {
        source = text;
      } else {
        target = text;
      }
    }

    if (source) {
      units.push({
        id: generateId(),
        key: `tu_${i}`,
        source,
        target,
        filePath: fileName,
        index: units.length + 1,
      });
    }
  }

  return {
    id: generateId(),
    name: fileName,
    type: 'ttx',
    sourceLanguage: 'en',
    targetLanguage: '',
    units,
    uploadedAt: new Date(),
    size: content.length,
  };
}

// EXCEL Parser (Generic translation)
function parseEXCEL(data: Uint8Array, fileName: string): TranslationFile {
  try {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    const units: TranslationUnit[] = [];
    let startIndex = 0;
    
    // Auto-detect columns
    let sourceCol = 0;
    let targetCol = 1;
    let keyCol = -1;

    if (json.length > 0) {
      const firstRow = json[0].map(c => String(c || '').toLowerCase().trim());
      
      // Look for explicit headers
      const sIdx = firstRow.findIndex(h => h.includes('source') || h === 'src' || h === 'english');
      const tIdx = firstRow.findIndex(h => h.includes('target') || h === 'tgt' || h === 'translation');
      const kIdx = firstRow.findIndex(h => h.includes('key') || h === 'id' || h === 'identifier');

      if (sIdx !== -1) {
        sourceCol = sIdx;
        startIndex = 1; // Header found
      }
      if (tIdx !== -1) {
        targetCol = tIdx;
        startIndex = 1;
      }
      if (kIdx !== -1) {
        keyCol = kIdx;
        startIndex = 1;
      }
    }

    for (let i = startIndex; i < json.length; i++) {
      const row = json[i];
      if (row && row.length > Math.max(sourceCol, targetCol)) {
        const source = String(row[sourceCol] || '').trim();
        const target = String(row[targetCol] || '').trim();
        
        if (source || target) {
          units.push({
            id: generateId(),
            key: keyCol !== -1 ? String(row[keyCol] || `row_${i + 1}`) : `row_${i + 1}`,
            source: source,
            target: target,
            filePath: fileName,
            index: units.length + 1,
          });
        }
      }
    }

    return {
      id: generateId(),
      name: fileName,
      type: 'xlsx',
      sourceLanguage: 'en',
      targetLanguage: '',
      units,
      uploadedAt: new Date(),
      size: data.length,
    };
  } catch (error) {
    throw new FileParserError(`Excel parsing failed: ${error}`, fileName);
  }
}

// MQXLZ Parser (Zipped MemoQ XLIFF)
async function parseMQXLZ(data: Uint8Array, fileName: string): Promise<TranslationFile> {
  try {
    const zip = await JSZip.loadAsync(data);
    const mqxliffFile = Object.keys(zip.files).find(f => f.endsWith('.mqxliff'));
    
    if (!mqxliffFile) {
      // Try finding any XLIFF if mqxliff not found
      const anyXliff = Object.keys(zip.files).find(f => f.toLowerCase().endsWith('.xlf') || f.toLowerCase().endsWith('.xliff'));
      if (!anyXliff) {
        throw new Error('No translation content found in MQXLZ package');
      }
      const content = await zip.files[anyXliff].async('string');
      const result = parseXLIFF(content, fileName);
      result.type = 'mqxlz';
      return result;
    }
    
    const content = await zip.files[mqxliffFile].async('string');
    const result = parseXLIFF(content, fileName);
    result.type = 'mqxlz';
    return result;
  } catch (error) {
    throw new FileParserError(`MQXLZ parsing failed: ${error}`, fileName);
  }
}

// Main parse function
export async function parseFile(file: File): Promise<TranslationFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const isBinary = file.name.endsWith('.xlsx') || 
                     file.name.endsWith('.xls') || 
                     file.name.endsWith('.mqxlz');

    reader.onload = async (e) => {
      try {
        const fileType = detectFileType(file.name);

        if (!fileType) {
          reject(new FileParserError(`Unsupported file type: ${file.name}`, file.name));
          return;
        }

        let result: TranslationFile;

        if (isBinary) {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          if (file.name.endsWith('.mqxlz')) {
            result = await parseMQXLZ(data, file.name);
          } else {
            result = parseEXCEL(data, file.name);
          }
          resolve(result);
          return;
        }

        const content = e.target?.result as string;

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
          case 'txt':
            result = parseTXT(content, file.name);
            break;
          case 'resx':
            result = parseRESX(content, file.name);
            break;
          case 'tmx':
            result = parseTMX(content, file.name);
            break;
          case 'tbx':
            result = parseTBX(content, file.name);
            break;
          case 'ttx':
            result = parseTTX(content, file.name);
            break;
          case 'mqxliff':
            result = parseXLIFF(content, file.name);
            result.type = 'mqxliff';
            break;
          case 'mqxlz':
            // Handled in isBinary block
            break;
          case 'tipp':
            // TIPP is often a package, but if it's the XML payload:
            result = parseXLIFF(content, file.name);
            result.type = 'tipp';
            break;
          default:
            throw new FileParserError(`Parser not implemented for type: ${fileType}`, file.name);
        }

        resolve(result);
      } catch (error) {
        reject(error instanceof FileParserError ? error : new FileParserError(String(error), file.name));
      }
    };

    if (isBinary) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
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

