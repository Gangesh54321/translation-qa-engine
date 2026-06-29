import { runQA } from './qaEngine';

async function checkWithGemini(file: any, apiKey: string): Promise<any[]> {
  console.log("[Worker-Gemini] Starting spelling check for file:", file?.name, "API Key prefix:", apiKey.substring(0, 7));
  const issues: any[] = [];
  const units = (file?.units || []).filter((u: any) => u.target && u.target.trim().length > 0);
  console.log("[Worker-Gemini] Total units with translation:", units.length);
  if (units.length === 0) return issues;

  // Chunk units into batches of 25 to optimize calls and costs
  const chunkSize = 25;
  const chunkPromises: Promise<any[]>[] = [];

  for (let i = 0; i < units.length; i += chunkSize) {
    const chunk = units.slice(i, i + chunkSize);
    
    chunkPromises.push((async () => {
      const chunkIssues: any[] = [];
      const segmentsPayload = chunk.map((u: any) => ({
        id: u.id,
        source: u.source,
        target: u.target
      }));

      const prompt = `You are a professional Translation Quality Assurance expert. Your task is to identify typo, spelling, and grammar errors in the target translation text for any language (including Hindi).
Pay special attention to Hindi grammar, missing postpositions (e.g. "पसंद करते क मिश्रण" should be corrected to "का मिश्रण"), context-based spelling errors, and spelling typos in any language.

For the translation segments provided below, identify any spelling (typo) or grammar errors in the target text.
For each error identified, generate an error report matching this exact JSON format:
{
  "unitId": "the id from the input",
  "type": "lang_spelling" or "lang_grammar",
  "severity": "error",
  "message": "For lang_spelling, message MUST be formatted exactly as: 'Typo: <misspelled_word_or_char>' (e.g. Typo: 'क'), 'The word incomplete: <word>', or 'significantly deviates from the source: <word>'. For lang_grammar, provide a clear explanation of the error in English.",
  "suggestion": "Corrected target text"
}

Respond ONLY with a JSON array containing the error reports for the segments that have errors. Do not include markdown fences (like \`\`\`json or \`\`\`), do not include conversational text. If no errors are found, return an empty array [].

Segments to analyze:
${JSON.stringify(segmentsPayload, null, 2)}`;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        console.log("[Worker-Gemini] Sending payload for chunk size:", chunk.length);
        let response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        console.log("[Worker-Gemini] Response status (2.5-flash):", response.status);
        if (!response.ok) {
          const errText = await response.text();
          console.warn("[Worker-Gemini] 2.5-flash failed:", errText);
          
          // Fallback to gemini-1.5-flash (which works under some v1beta keys, or we log it)
          const backupUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
          console.log("[Worker-Gemini] Retrying with 1.5-flash...");
          response = await fetch(backupUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });
          console.log("[Worker-Gemini] Response status (1.5-flash):", response.status);
        }

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          console.log("[Worker-Gemini] API Response text:", text);
          if (text) {
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            if (Array.isArray(parsed)) {
              console.log("[Worker-Gemini] Parsed", parsed.length, "issues from chunk");
              for (const item of parsed) {
                const u = chunk.find((unit: any) => unit.id === item.unitId);
                if (u) {
                  let finalMessage = item.message;
                  if (item.type === 'lang_spelling') {
                    // Extract the incorrect word or details from the message if any
                    let wordDetail = "";
                    const matchQuote = item.message.match(/['"`]([^'"`]+)['"`]/);
                    if (matchQuote) {
                      wordDetail = `: '${matchQuote[1]}'`;
                    } else {
                      // Try to find if there is a colon with detail
                      const colonIdx = item.message.indexOf(':');
                      if (colonIdx !== -1) {
                        wordDetail = item.message.substring(colonIdx);
                      }
                    }

                    if (item.message.toLowerCase().includes('incomplete') || item.message.toLowerCase().includes('partial')) {
                      finalMessage = 'The word incomplete' + wordDetail;
                    } else if (item.message.toLowerCase().includes('deviates') || item.message.toLowerCase().includes('different')) {
                      finalMessage = 'significantly deviates from the source' + wordDetail;
                    } else {
                      finalMessage = 'Typo' + wordDetail;
                    }
                  }

                  chunkIssues.push({
                    id: `gemini_${Math.random().toString(36).substring(2, 11)}`,
                    unitId: u.id,
                    type: item.type === 'lang_grammar' ? 'lang_grammar' : 'lang_spelling',
                    severity: item.severity === 'warning' ? 'warning' : 'error',
                    message: finalMessage,
                    source: u.source,
                    target: u.target,
                    key: u.key,
                    suggestion: item.suggestion || undefined,
                    autoFix: item.suggestion || undefined,
                    index: u.index
                  });
                } else {
                  console.warn("[Worker-Gemini] Could not find unit with id matching Gemini output:", item.unitId);
                }
              }
            }
          }
        } else {
          console.error("[Worker-Gemini] Response not OK:", response.status, await response.text());
        }
      } catch (err) {
        console.error('[Worker-Gemini] Error during Gemini API call/parsing:', err);
      }

      return chunkIssues;
    })());
  }

  const results = await Promise.all(chunkPromises);
  for (const chunkIssues of results) {
    issues.push(...chunkIssues);
  }

  console.log("[Worker-Gemini] Total Gemini spelling/grammar issues found:", issues.length);
  return issues;
}


self.onmessage = async (e) => {
  const { file, config, allUnits } = e.data;
  console.log("[Worker] onmessage received for file:", file?.name, "rules.lang_spelling:", config?.rules?.lang_spelling);
  
  try {
    const result = runQA(file, config, allUnits);
    
    // Check if Gemini API key is available
    const apiKey = config?.geminiApiKey;
    console.log("[Worker] API Key loaded:", !!apiKey);
    if (apiKey && config?.rules?.lang_spelling) {
      try {
        const geminiIssues = await checkWithGemini(file, apiKey);
        if (geminiIssues.length > 0) {
          result.issues.push(...geminiIssues);
          
          // Re-calculate results stats
          result.stats.total = result.issues.length;
          result.stats.errors = result.issues.filter((i: any) => i.severity === 'error').length;
          result.stats.warnings = result.issues.filter((i: any) => i.severity === 'warning').length;
          result.stats.info = result.issues.filter((i: any) => i.severity === 'info').length;
          
          for (const issue of geminiIssues) {
            const type = issue.type as keyof typeof result.stats.byType;
            result.stats.byType[type] = (result.stats.byType[type] || 0) + 1;
          }
        }
      } catch (geminiError) {
        console.error('Gemini check failed inside worker:', geminiError);
      }
    }
    
    self.postMessage({ type: 'success', result });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error during QA' 
    });
  }
};
