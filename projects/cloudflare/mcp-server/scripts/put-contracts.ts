import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const CONTRACTS_DIR = path.join(process.cwd(), 'contracts');

async function putContract(key: string, file: string) {
  const content = await fs.readFile(file, 'utf8');
  exec(`wrangler kv:key put --binding=CONTRACTS ${key} '${content.replace(/'/g, "'\''")}'`, (err, stdout, stderr) => {
    if (err) console.error(stderr);
    else console.log(stdout);
  });
}

async function main() {
  const files = await fs.readdir(CONTRACTS_DIR);
  for (const file of files) {
    if (file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')) {
      const key = path.basename(file, path.extname(file));
      await putContract(key, path.join(CONTRACTS_DIR, file));
    }
  }
}

main();
