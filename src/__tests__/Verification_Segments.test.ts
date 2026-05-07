import { describe, it, expect } from 'vitest';
import { parseFile } from '../lib/fileParser';
import * as fs from 'fs';
import * as path from 'path';

describe('Segment Count Verification', () => {
  const getFileAsBlob = (filePath: string) => {
    const absolutePath = path.resolve(filePath);
    const buffer = fs.readFileSync(absolutePath);
    const fileName = path.basename(filePath);
    return new File([buffer], fileName);
  };

  it('verifies EX_GDPR_CON_Invitation_en_hi.xml.xlf.sdlxliff has 24 segments', async () => {
    const file = getFileAsBlob('d:/Antigravity/QA Feture/app/test_suite/EX_GDPR_CON_Invitation_en_hi.xml.xlf.sdlxliff');
    const parsed = await parseFile(file);
    console.log(`Invitation File: ${parsed.units.length} segments`);
    parsed.units.forEach((u: any) => console.log(`ID: ${u.key}, Source: ${u.source.substring(0, 50)}`));
    expect(parsed.units.length).toBe(24);
  });

  it('verifies EX_GDPR_CON_LoginLetter_WithQR_PDF_Solution_en_hi.xml.xlf.sdlxliff has 28 segments', async () => {
    const file = getFileAsBlob('d:/Antigravity/QA Feture/app/test_suite/EX_GDPR_CON_LoginLetter_WithQR_PDF_Solution_en_hi.xml.xlf.sdlxliff');
    const parsed = await parseFile(file);
    console.log(`LoginLetter File: ${parsed.units.length} segments`);
    expect(parsed.units.length).toBe(28);
  });
});
