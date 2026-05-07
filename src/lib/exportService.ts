import ExcelJS from 'exceljs';
import type { QAResult, IssueType, QAConfig, QAIssue, TranslationFile } from '@/types/translation';
import { ISSUE_TYPE_LABELS } from '@/types/translation';

export const BASIC_ISSUES: IssueType[] = [
    'seg_untranslated',
    'seg_empty',
    'consist_identical_source',
    'consist_terminology',
    'seg_source_copied'
];

export function getCategory(type: IssueType): 'Basic' | 'Content' {
    return BASIC_ISSUES.includes(type) ? 'Basic' : 'Content';
}

/**
 * Export QA results to Excel with colors using ExcelJS
 */
export async function exportToExcel(resultOrResults: QAResult | QAResult[], config: QAConfig) {
    const results = Array.isArray(resultOrResults) ? resultOrResults : [resultOrResults];
    const isCombined = results.length > 1;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('QA Results');

    // Generate summary details
    const basicChecks = Object.entries(config.rules)
        .filter(([type, enabled]) => enabled && getCategory(type as IssueType) === 'Basic')
        .map(([type]) => ISSUE_TYPE_LABELS[type as IssueType])
        .join(', ');

    const contentChecks = Object.entries(config.rules)
        .filter(([type, enabled]) => enabled && getCategory(type as IssueType) === 'Content')
        .map(([type]) => ISSUE_TYPE_LABELS[type as IssueType])
        .join(', ');

    // Add Summary Section
    const summaryHeader = worksheet.addRow(['Selected QA Checks']);
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    summaryHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3498DB' } };
    worksheet.mergeCells(`A${summaryHeader.number}:B${summaryHeader.number}`);

    worksheet.addRow(['Basic', basicChecks]);
    worksheet.addRow(['Content', contentChecks]);
    worksheet.addRow(['Glossaries', config.glossary?.length ? 'Active' : 'None']);
    worksheet.addRow(['Report Type', isCombined ? 'Combined (Multiple Files)' : 'Single File']);
    worksheet.addRow([]); // Spacer

    // Add main Table Headers
    const tableHeader = worksheet.addRow(['File & Segment', 'Source', 'Target', 'Comments']);
    tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    tableHeader.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    if (!isCombined) {
        results.forEach(result => {
            // Group issues by type for single file
            const groupedIssues: Record<string, QAIssue[]> = {};
            result.issues.forEach(issue => {
                const label = ISSUE_TYPE_LABELS[issue.type as IssueType];
                if (!groupedIssues[label]) groupedIssues[label] = [];
                groupedIssues[label].push(issue);
            });

            Object.entries(groupedIssues).forEach(([label, issues]) => {
                const groupRow = worksheet.addRow([label.toUpperCase()]);
                groupRow.font = { bold: true };
                groupRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
                worksheet.mergeCells(`A${groupRow.number}:D${groupRow.number}`);

                issues.forEach(issue => {
                    let comments = '';
                    if (issue.type === 'term_translation_mismatch' && issue.glossaryMatches) {
                        comments = issue.glossaryMatches.map(m => `Glossary: ${m.source} -> ${m.target}`).join('; ');
                    }
                    const row = worksheet.addRow([`${result.fileName}_#${issue.index || issue.key}`, issue.source, issue.target, comments]);
                    row.alignment = { wrapText: true, vertical: 'middle' };
                });
            });
        });
    } else {
        // Global grouping for combined reports
        const allIssues: (QAIssue & { fileName: string })[] = [];
        results.forEach(r => {
            r.issues.forEach(issue => {
                allIssues.push({ ...issue, fileName: r.fileName });
            });
        });

        const groupedByType: Record<string, (QAIssue & { fileName: string })[]> = {};
        allIssues.forEach(issue => {
            const label = ISSUE_TYPE_LABELS[issue.type as IssueType];
            if (!groupedByType[label]) groupedByType[label] = [];
            groupedByType[label].push(issue);
        });

        Object.entries(groupedByType).forEach(([label, issues]) => {
            const groupRow = worksheet.addRow([label.toUpperCase()]);
            groupRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            groupRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3498DB' } };
            worksheet.mergeCells(`A${groupRow.number}:D${groupRow.number}`);

            issues.forEach(issue => {
                let comments = '';
                if (issue.type === 'term_translation_mismatch' && issue.glossaryMatches) {
                    comments = issue.glossaryMatches.map(m => `Glossary: ${m.source} -> ${m.target}`).join('; ');
                }
                const row = worksheet.addRow([`${issue.fileName}_#${issue.index || issue.key}`, issue.source, issue.target, comments]);
                row.alignment = { wrapText: true, vertical: 'middle' };
            });
        });
    }

    // Column widths
    worksheet.getColumn(1).width = 30; // File & Segment
    worksheet.getColumn(2).width = 45; // Source
    worksheet.getColumn(3).width = 45; // Target
    worksheet.getColumn(4).width = 25; // Comments

    // Buffer and Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = isCombined ? 'QA_Combined_Report' : `QA_Report_${results[0].fileName}`;
    a.download = `${fileName}_${new Date().getTime()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Export QA results to HTML with theme options
 */
export function exportToHTML(resultOrResults: QAResult | QAResult[], config: QAConfig, theme: 'professional' | 'modern' | 'classic' = 'professional') {
    const results = Array.isArray(resultOrResults) ? resultOrResults : [resultOrResults];
    const isCombined = results.length > 1;

    const highlightInHtml = (text: string, highlights?: string[], type: 'source' | 'target' = 'source') => {
        if (!text) return '';
        
        const tagRegex = /(<[^>]+>)/g;
        const parts = text.split(tagRegex);
        
        const processTextPart = (content: string) => {
            if (!highlights || highlights.length === 0) return content;
            let res = content;
            highlights.forEach(term => {
                const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const className = type === 'source' ? 'hl-source' : 'hl-target';
                res = res.replace(new RegExp(`(${escaped})`, 'gi'), `<span class="${className}">$1</span>`);
            });
            return res;
        };

        return parts.map(part => {
            if (part.startsWith('<') && part.endsWith('>')) {
                const xMatch = part.match(/<x\s+[^>]*id="([^"]*)"[^>]*\/?>/i);
                const gMatch = part.match(/<g\s+[^>]*id="([^"]*)"[^>]*>/i);
                const gEndMatch = part.match(/<\/g>/i);
                
                if (xMatch) return `<span class="pink-tag">[${xMatch[1]}]</span>`;
                if (gMatch) return `<span class="pink-tag">[${gMatch[1]}]</span>`;
                if (gEndMatch) return `<span class="pink-tag">[/]</span>`;
                return `<span class="pink-tag">${part}</span>`;
            }
            return processTextPart(part);
        }).join('');
    };

    const renderGlossaryMatches = (issue: QAIssue) => {
        if (issue.type !== 'term_translation_mismatch' || !issue.glossaryMatches || issue.glossaryMatches.length === 0) return '';
        return `
            <div class="glossary-info">
                <strong>Glossary Reference:</strong>
                ${issue.glossaryMatches.map(m => `<span class="glossary-tag">"${m.source}" &rarr; "${m.target}"</span>`).join('')}
            </div>
        `;
    };

    let issuesHtml = '';

    if (!isCombined) {
        issuesHtml = results.map(result => {
            const groupedIssues: Record<string, typeof result.issues> = {};
            result.issues.forEach(issue => {
                const label = ISSUE_TYPE_LABELS[issue.type];
                if (!groupedIssues[label]) groupedIssues[label] = [];
                groupedIssues[label].push(issue);
            });

            return `
                ${Object.entries(groupedIssues).map(([label, issues]) => `
                    <div class="group-header">${label}</div>
                    <table class="issues-table">
                        <thead>
                            <tr>
                                <th style="width: 20%">Key / Info</th>
                                <th style="width: 40%">Source</th>
                                <th style="width: 40%">Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${issues.map(issue => `
                                <tr>
                                    <td class="file-cell">${result.fileName}_#${issue.index || issue.key}</td>
                                    <td class="source-cell">${highlightInHtml(issue.source, issue.highlights?.source, 'source')}</td>
                                    <td class="target-cell">
                                        ${highlightInHtml(issue.target, issue.highlights?.target, 'target')}
                                        ${renderGlossaryMatches(issue)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `).join('')}
            `;
        }).join('<div class="file-spacer"></div>');
    } else {
        const allIssues: (QAIssue & { fileName: string })[] = [];
        results.forEach(r => {
            r.issues.forEach(issue => {
                allIssues.push({ ...issue, fileName: r.fileName });
            });
        });

        const groupedByType: Record<string, (QAIssue & { fileName: string })[]> = {};
        allIssues.forEach(issue => {
            const label = ISSUE_TYPE_LABELS[issue.type as IssueType];
            if (!groupedByType[label]) groupedByType[label] = [];
            groupedByType[label].push(issue);
        });

        issuesHtml = Object.entries(groupedByType).map(([label, issues]) => `
            <div class="group-header">${label}</div>
            <table class="issues-table">
                <thead>
                    <tr>
                        <th style="width: 20%">File / Key</th>
                        <th style="width: 40%">Source</th>
                        <th style="width: 40%">Target</th>
                    </tr>
                </thead>
                <tbody>
                    ${issues.map(issue => `
                        <tr>
                            <td class="file-cell">${issue.fileName}_#${issue.index || issue.key}</td>
                            <td class="source-cell">${highlightInHtml(issue.source, issue.highlights?.source, 'source')}</td>
                            <td class="target-cell">
                                ${highlightInHtml(issue.target, issue.highlights?.target, 'target')}
                                ${renderGlossaryMatches(issue)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `).join('');
    }

    // Generate summary of checks
    const basicChecks = Object.entries(config.rules)
        .filter(([type, enabled]) => enabled && getCategory(type as IssueType) === 'Basic')
        .map(([type]) => ISSUE_TYPE_LABELS[type as IssueType])
        .join(', ');

    const contentChecks = Object.entries(config.rules)
        .filter(([type, enabled]) => enabled && getCategory(type as IssueType) === 'Content')
        .map(([type]) => ISSUE_TYPE_LABELS[type as IssueType])
        .join(', ');

    const glossaryNames = config.glossary?.length ? 'Active Glossary' : 'None';

    const themes = {
        professional: `
            body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 20px; }
            .container { width: 100%; margin: 0 auto; }
            h1 { font-size: 24px; color: #333; margin-bottom: 20px; }
            
            .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            .summary-table th { background: #b8daff; text-align: left; padding: 8px; border: 1px solid #dee2e6; color: #004085; }
            .summary-table td { padding: 8px; border: 1px solid #dee2e6; }
            .summary-label { width: 150px; font-weight: bold; background: #f8f9fa; }

            .file-header { background: #2c3e50; color: #fff; padding: 12px; font-weight: bold; margin-top: 40px; border-radius: 4px 4px 0 0; }
            .group-header { background: #fff3cd; padding: 10px; font-weight: bold; margin-top: 20px; border-left: 5px solid #ffc107; font-size: 16px; }
            .file-spacer { height: 40px; }
            
            .issues-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12px; }
            .issues-table th { text-align: left; padding: 10px; border-bottom: 2px solid #333; }
            .issues-table td { padding: 12px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
            
            .file-cell { color: #d63384; font-size: 11px; word-break: break-all; }
            .key { color: #6c757d; font-family: monospace; }
            .source-cell, .target-cell { font-family: Arial, sans-serif; }
            .hl-source { background: rgba(99, 102, 241, 0.2); color: #4338ca; font-weight: bold; padding: 0 2px; border-radius: 2px; }
            .hl-target { background: rgba(245, 158, 11, 0.2); color: #b45309; font-weight: bold; padding: 0 2px; border-radius: 2px; }
            
            .pink-tag { color: #ec4899; font-weight: bold; background: rgba(236, 72, 153, 0.1); padding: 0 2px; border-radius: 2px; }
            
            .glossary-info { margin-top: 8px; font-size: 10px; color: #666; background: #fdf6e3; padding: 6px; border-radius: 4px; border: 1px solid #eee8d5; }
            .glossary-tag { display: inline-block; background: #eee8d5; color: #586e75; padding: 2px 6px; border-radius: 10px; margin-left: 5px; font-weight: bold; }
        `,
        modern: `
            body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 40px; }
            .container { max-width: 1200px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            .summary-table th { background: #6366f1; color: #fff; }
            .file-header { background: #4338ca; color: #fff; padding: 15px; border-radius: 8px 8px 0 0; }
            .group-header { border-left-color: #6366f1; background: #eef2ff; color: #4338ca; }
        `,
        classic: `
            body { font-family: 'Times New Roman', Times, serif; }
            .summary-table th, .summary-table td, .issues-table th, .issues-table td { border: 1px solid #000; }
        `
    };

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>QA Report - ${isCombined ? 'Combined' : results[0].fileName}</title>
            <style>
                ${themes[theme]}
                @media print {
                    .container { box-shadow: none; padding: 0; }
                    .group-header { break-after: avoid; }
                    .file-header { break-before: page; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>QA Quality Report</h1>
                
                <table class="summary-table">
                    <thead>
                        <tr><th colspan="2">Selected QA Checks</th></tr>
                    </thead>
                    <tbody>
                        <tr><td class="summary-label">Basic</td><td>${basicChecks}</td></tr>
                        <tr><td class="summary-label">Content</td><td>${contentChecks}</td></tr>
                        <tr><th colspan="2">Project Info</th></tr>
                        <tr><td class="summary-label">Glossaries</td><td>${glossaryNames}</td></tr>
                        <tr><td class="summary-label">Files</td><td>${results.length}</td></tr>
                    </tbody>
                </table>

                <div class="issues-list">
                    ${issuesHtml}
                </div>
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const outName = isCombined ? 'QA_Combined_Report' : `QA_Report_${results[0].fileName}`;
    a.download = `${outName}_${theme}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Export bilingual content to a 2-column RTF table for manual review
 */
export function exportToRTF(fileOrFiles: TranslationFile | TranslationFile[]) {
    const fileList = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    const isCombined = fileList.length > 1;

    const escapeRTF = (str: string): string => {
        if (!str) return '';
        // Escape RTF control characters and handle Unicode
        return str
            .replace(/\\/g, '\\\\')
            .replace(/{/g, '\\{')
            .replace(/}/g, '\\}')
            .split('')
            .map(char => {
                const code = char.charCodeAt(0);
                if (code > 127) {
                    // RTF Unicode is signed 16-bit
                    const signedCode = code > 32767 ? code - 65536 : code;
                    return `\\u${signedCode}?`;
                }
                return char;
            })
            .join('');
    };

    let rtf = '{\\rtf1\\ansi\\deff0\n';
    rtf += '{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}{\\f1\\fnil\\fcharset1 Arial Unicode MS;}}\n';
    
    // Header
    rtf += '\\b\\fs32 Bilingual Review Report\\b0\\fs20\\par\n';
    rtf += `Generated: ${new Date().toLocaleString()}\\par\\par\n`;

    fileList.forEach(file => {
        rtf += `\\b\\fs24 File: ${escapeRTF(file.name)}\\b0\\fs20\\par\\par\n`;
        
        // Table setup: ID (1.5"), Source (3"), Target (3")
        // Twips (1/1440 inch): 1.5" = 2160, 4.5" = 6480, 7.5" = 10800
        const rowDef = '\\trowd\\trgaph108\\trleft-108' +
                      '\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2160' +
                      '\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx6480' +
                      '\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx10800';

        // Table Header
        rtf += rowDef + '\\b ID\\b0 \\cell \\b Source Content\\b0 \\cell \\b Target Translation\\b0 \\cell\\row\n';

        file.units.forEach(unit => {
            rtf += rowDef + 
                   `${unit.index || unit.key} \\cell ${escapeRTF(unit.source)} \\cell ${escapeRTF(unit.target)} \\cell\\row\n`;
        });
        
        rtf += '\\par\\page\n';
    });

    rtf += '}';

    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const outName = isCombined ? 'Bilingual_Review_Combined' : `Bilingual_Review_${fileList[0].name.split('.')[0]}`;
    a.download = `${outName}_${new Date().getTime()}.rtf`;
    a.click();
    URL.revokeObjectURL(url);
}
