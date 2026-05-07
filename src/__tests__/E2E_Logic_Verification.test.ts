import { describe, it, expect } from 'vitest';
import { parseFile } from '../lib/fileParser';
import { runQA, DEFAULT_CONFIG } from '../lib/qaEngine';

describe('E2E Logic Verification - All Formats', () => {
  const createMockFile = (name: string, content: string): File => {
    const blob = new Blob([content], { type: 'text/plain' });
    return new File([blob], name);
  };

  it('verifies JSON format end-to-end', async () => {
    const content = JSON.stringify({ "login": "Sign in", "error": "Invalid" });
    const file = createMockFile('test.json', content);
    const parsed = await parseFile(file);
    expect(parsed.units.length).toBeGreaterThan(0);
    const result = runQA(parsed, DEFAULT_CONFIG);
    expect(result.issues).toBeDefined();
    console.log(`JSON Verification: ${parsed.units.length} units, ${result.issues.length} issues.`);
  });

  it('verifies XLIFF format end-to-end', async () => {
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2">
  <file source-language="en" target-language="fr" datatype="plaintext" original="file.ext">
    <body>
      <trans-unit id="1"><source>Hello</source><target>Bonjour</target></trans-unit>
      <trans-unit id="2"><source>Missing</source><target></target></trans-unit>
    </body>
  </file>
</xliff>`;
    const file = createMockFile('test.xlf', content);
    const parsed = await parseFile(file);
    expect(parsed.units.length).toBe(2);
    const result = runQA(parsed, DEFAULT_CONFIG);
    expect(result.issues.length).toBeGreaterThan(0); // Should detect missing translation
    console.log(`XLIFF Verification: ${parsed.units.length} units, ${result.issues.length} issues.`);
  });

  it('verifies PO format end-to-end', async () => {
    const content = `msgid "Submit"\nmsgstr "Envoyer"\n\nmsgid "Empty"\nmsgstr ""`;
    const file = createMockFile('test.po', content);
    const parsed = await parseFile(file);
    expect(parsed.units.length).toBe(2);
    const result = runQA(parsed, DEFAULT_CONFIG);
    expect(result.issues.length).toBeGreaterThan(0);
    console.log(`PO Verification: ${parsed.units.length} units, ${result.issues.length} issues.`);
  });

  it('verifies CSV format end-to-end', async () => {
    const content = `Source,Target\n"Email","E-mail"\n"Password",""`;
    const file = createMockFile('test.csv', content);
    const parsed = await parseFile(file);
    expect(parsed.units.length).toBeGreaterThan(0);
    const result = runQA(parsed, DEFAULT_CONFIG);
    expect(result.issues.length).toBeGreaterThan(0);
    console.log(`CSV Verification: ${parsed.units.length} units, ${result.issues.length} issues.`);
  });

  it('verifies XML format end-to-end', async () => {
    const content = `<?xml version="1.0" encoding="UTF-8"?><resources><string name="app">App</string><string name="empty"></string></resources>`;
    const file = createMockFile('test.xml', content);
    const parsed = await parseFile(file);
    expect(parsed.units.length).toBe(2);
    const result = runQA(parsed, DEFAULT_CONFIG);
    expect(result.issues.length).toBeGreaterThan(0);
    console.log(`XML Verification: ${parsed.units.length} units, ${result.issues.length} issues.`);
  });
});
