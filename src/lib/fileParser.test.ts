
import { describe, it, expect, vi } from 'vitest';
// We need to mock DOMParser for the tests to run in Node environment
import { JSDOM } from 'jsdom';

// Before importing fileParser, we must set up the global DOMParser
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;
global.FileReader = dom.window.FileReader;

// Mocking the File class which is not available in Node
global.File = class File {
    constructor(parts, name, options) {
        this.parts = parts;
        this.name = name;
        this.type = options?.type || '';
    }
} as any;

import { parseFile } from './fileParser';

describe('File Parser - New Formats', () => {

    it('should parse TBX files correctly', async () => {
        const tbxContent = `<?xml version="1.0" encoding="UTF-8"?>
<martif type="TBX" xml:lang="en">
  <text>
    <body>
      <termEntry id="C001">
        <langSet xml:lang="en"><term>Login</term></langSet>
        <langSet xml:lang="fr"><term>Connexion</term></langSet>
      </termEntry>
    </body>
  </text>
</martif>`;

        const file = new File([tbxContent], 'test.tbx', { type: 'application/xml' });

        // Mocking FileReader behavior
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: tbxContent } } as any);
        });

        const result = await parseFile(file);
        expect(result.type).toBe('tbx');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('Login');
        expect(result.units[0].target).toBe('Connexion');
    });

    it('should parse TTX files correctly', async () => {
        const ttxContent = `<?xml version="1.0" encoding="UTF-8"?>
<TRADOStag Version="2.0">
  <Body>
    <tu>
      <tuv lang="EN-US"><seg>Open file</seg></tuv>
      <tuv lang="DE-DE"><seg>Datei öffnen</seg></tuv>
    </tu>
  </Body>
</TRADOStag>`;

        const file = new File([ttxContent], 'test.ttx', { type: 'application/xml' });

        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: ttxContent } } as any);
        });

        const result = await parseFile(file);
        expect(result.type).toBe('ttx');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('Open file');
        expect(result.units[0].target).toBe('Datei öffnen');
    });

    it('should parse MQXLIFF files correctly using XLIFF logic', async () => {
        const mqxliffContent = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2">
  <file source-language="en" target-language="es" datatype="plaintext" original="test.mqxliff">
    <body>
      <trans-unit id="1">
        <source>Welcome</source>
        <target>Bienvenido</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;

        const file = new File([mqxliffContent], 'test.mqxliff', { type: 'application/xml' });

        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: mqxliffContent } } as any);
        });

        const result = await parseFile(file);
        expect(result.type).toBe('mqxliff');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('Welcome');
    });
});
