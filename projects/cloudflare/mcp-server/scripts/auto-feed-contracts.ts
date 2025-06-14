import { exec } from 'child_process';
import chokidar from 'chokidar';
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

chokidar.watch(CONTRACTS_DIR, { persistent: true })
  .on('add', file => {
    if (file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')) {
      const key = path.basename(file, path.extname(file));
      putContract(key, file);
    }
  })
  .on('change', file => {
    if (file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')) {
      const key = path.basename(file, path.extname(file));
      putContract(key, file);
    }
  });

console.log('Watching contracts/ for changes...');
