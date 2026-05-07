import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_URL = 'https://github.com/LibreOffice/dictionaries.git';
const TEMP_DIR = path.join(__dirname, '../temp_dictionaries');
const TARGET_DIR = path.join(__dirname, '../public/dictionaries');

async function downloadDictionaries() {
  try {
    console.log('🚀 Starting dictionary download process...');

    // 1. Cleanup old temp dir if exists
    if (fs.existsSync(TEMP_DIR)) {
      console.log('🧹 Cleaning up old temporary directory...');
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    // 2. Clone the repository (depth 1 to save time/bandwidth)
    console.log(`📥 Cloning LibreOffice dictionaries repository (this may take a minute)...`);
    execSync(`git clone --depth 1 ${REPO_URL} "${TEMP_DIR}"`, { stdio: 'inherit' });

    // 3. Prepare target directory
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    // 4. Iterate through folders and copy relevant files
    const entries = fs.readdirSync(TEMP_DIR, { withFileTypes: true });
    const dictionaryIndex = [];

    console.log('📂 Processing language folders...');

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const langDir = path.join(TEMP_DIR, entry.name);
        const files = fs.readdirSync(langDir);
        
        const dicFiles = files.filter(f => f.endsWith('.dic'));
        const affFiles = files.filter(f => f.endsWith('.aff'));

        if (dicFiles.length > 0 || affFiles.length > 0) {
          const targetLangDir = path.join(TARGET_DIR, entry.name);
          if (!fs.existsSync(targetLangDir)) {
            fs.mkdirSync(targetLangDir, { recursive: true });
          }

          // Copy .dic and .aff files
          const copiedFiles = [];
          [...dicFiles, ...affFiles].forEach(file => {
            fs.copyFileSync(path.join(langDir, file), path.join(targetLangDir, file));
            copiedFiles.push(file);
          });

          dictionaryIndex.push({
            locale: entry.name,
            files: copiedFiles,
            path: `/dictionaries/${entry.name}/`
          });
        }
      }
    }

    // 5. Generate index.json
    console.log('📄 Generating index.json...');
    fs.writeFileSync(
      path.join(TARGET_DIR, 'index.json'),
      JSON.stringify(dictionaryIndex, null, 2)
    );

    console.log(`✅ Successfully processed ${dictionaryIndex.length} dictionaries.`);

  } catch (error) {
    console.error('❌ Error downloading dictionaries:', error);
  } finally {
    // 6. Cleanup
    if (fs.existsSync(TEMP_DIR)) {
      console.log('🧹 Cleaning up temporary directory...');
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  }
}

downloadDictionaries();
