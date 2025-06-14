import { exec } from 'child_process';
import chokidar from 'chokidar';
import fs from 'fs/promises';
import yaml from 'js-yaml';
import path from 'path';
import { z } from 'zod';

const CONTRACTS_DIR = path.join(process.cwd(), 'contracts');

const ContractSchema = z.object({
  id: z.string(),
  version: z.string(),
  requiredSR: z.number().optional(),
  validUntil: z.string().optional(),
  trustClass: z.string().optional(),
  decayRate: z.string().optional(),
  description: z.string().optional(),
  fields: z.record(z.any()).optional(),
});

function isExpired(validUntil?: string): boolean {
  if (!validUntil) return false;
  const expiry = new Date(validUntil).getTime();
  return Date.now() > expiry;
}

async function getContractIdAndValidate(file: string): Promise<{ id: string | null, valid: boolean, expired: boolean }> {
  const content = await fs.readFile(file, 'utf8');
  let contract;
  try {
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      contract = yaml.load(content);
    } else if (file.endsWith('.json')) {
      contract = JSON.parse(content);
    } else {
      return { id: null, valid: false, expired: false };
    }
    ContractSchema.parse(contract);
    const expired = isExpired(contract.validUntil);
    return { id: contract.id, valid: true, expired };
  } catch (e) {
    console.error(`Invalid contract schema in ${file}:`, e.message);
    return { id: null, valid: false, expired: false };
  }
}

async function putContract(file: string) {
  const { id, valid, expired } = await getContractIdAndValidate(file);
  if (!valid) {
    console.error(`Skipping invalid contract: ${file}`);
    return;
  }
  if (expired) {
    console.warn(`Skipping expired contract: ${id}`);
    return;
  }
  const content = await fs.readFile(file, 'utf8');
  exec(`wrangler kv:key put --binding=CONTRACTS ${id} '${content.replace(/'/g, "'\''")}'`, (err, stdout, stderr) => {
    if (err) console.error(stderr);
    else console.log(stdout);
  });
}

chokidar.watch(CONTRACTS_DIR, { persistent: true })
  .on('add', file => {
    if (file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')) {
      putContract(file);
    }
  })
  .on('change', file => {
    if (file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')) {
      putContract(file);
    }
  });

console.log('Watching contracts/ for changes...');
