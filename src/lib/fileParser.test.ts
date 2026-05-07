
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

describe('File Parser - Base Formats', () => {
    it('should parse JSON files correctly', async () => {
        const jsonContent = JSON.stringify({
            "greeting": "Hello",
            "nested": {
                "user": "Developer"
            }
        });
        const file = new File([jsonContent], 'test.json', { type: 'application/json' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: jsonContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('json');
        expect(result.units.length).toBe(2);
        expect(result.units[0].source).toBe('Hello');
        expect(result.units[1].source).toBe('Developer');
    });

    it('should parse XLIFF files correctly', async () => {
        const xliffContent = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2">
  <file source-language="en" target-language="es">
    <body>
      <trans-unit id="1">
        <source>Welcome</source>
        <target>Bienvenido</target>
      </trans-unit>
    </body>
  </file>
</xliff>`;
        const file = new File([xliffContent], 'test.xliff', { type: 'application/xml' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: xliffContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('xliff');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('Welcome');
        expect(result.units[0].target).toBe('Bienvenido');
    });

    it('should parse XML (Android) files correctly', async () => {
        const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">MyApp</string>
</resources>`;
        const file = new File([xmlContent], 'test.xml', { type: 'application/xml' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: xmlContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('xml');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('MyApp');
    });

    it('should parse PO files correctly', async () => {
        const poContent = `msgid "Hello"\nmsgstr "Hola"`;
        const file = new File([poContent], 'test.po', { type: 'text/plain' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: poContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('po');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('Hello');
        expect(result.units[0].target).toBe('Hola');
    });

    it('should parse iOS Strings files correctly', async () => {
        const stringsContent = `"WelcomeKey" = "Welcome";`;
        const file = new File([stringsContent], 'test.strings', { type: 'text/plain' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: stringsContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('strings');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('WelcomeKey');
        expect(result.units[0].target).toBe('Welcome');
    });

    it('should parse YAML files correctly', async () => {
        const yamlContent = `title: "My App"\nsettings:\n  theme: "Dark"`;
        const file = new File([yamlContent], 'test.yaml', { type: 'text/yaml' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: yamlContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('yaml');
        expect(result.units.length).toBe(2);
        expect(result.units[0].source).toBe('"My App"');
    });

    it('should parse Properties files correctly', async () => {
        const propsContent = `welcome.message=Hello World\n# comment\nbutton.save=Save Options`;
        const file = new File([propsContent], 'test.properties', { type: 'text/plain' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: propsContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('properties');
        expect(result.units.length).toBe(2);
        expect(result.units[0].source).toBe('Hello World');
    });

    it('should parse CSV files correctly', async () => {
        const csvContent = `key,source,target\ngreeting,Hello,Hola`;
        const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: csvContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('csv');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('Hello');
        expect(result.units[0].target).toBe('Hola');
    });

    it('should parse TSV files correctly', async () => {
        const tsvContent = `key\tsource\ttarget\ngreeting\tHello\tHola`;
        const file = new File([tsvContent], 'test.tsv', { type: 'text/tab-separated-values' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: tsvContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('tsv');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('Hello');
        expect(result.units[0].target).toBe('Hola');
    });

    it('should parse TXT files correctly', async () => {
        const txtContent = `Hello\tHola\nGoodbye\tAdios`;
        const file = new File([txtContent], 'test.txt', { type: 'text/plain' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: txtContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('txt');
        expect(result.units.length).toBe(2);
        expect(result.units[0].source).toBe('Hello');
    });

    it('should parse RESX files correctly', async () => {
        const resxContent = `<?xml version="1.0" encoding="utf-8"?>
<root>
  <data name="String1" xml:space="preserve">
    <value>Hello World</value>
  </data>
</root>`;
        const file = new File([resxContent], 'test.resx', { type: 'application/xml' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: resxContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('resx');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('Hello World');
    });

    it('should parse TMX files correctly', async () => {
        const tmxContent = `<?xml version="1.0" encoding="UTF-8"?>
<tmx version="1.4">
  <body>
    <tu>
      <tuv xml:lang="en"><seg>Hello</seg></tuv>
      <tuv xml:lang="es"><seg>Hola</seg></tuv>
    </tu>
  </body>
</tmx>`;
        const file = new File([tmxContent], 'test.tmx', { type: 'application/xml' });
        vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
            this.onload?.({ target: { result: tmxContent } } as any);
        });
        const result = await parseFile(file);
        expect(result.type).toBe('tmx');
        expect(result.units.length).toBe(1);
        expect(result.units[0].source).toBe('Hello');
        expect(result.units[0].target).toBe('Hola');
    });
});

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
