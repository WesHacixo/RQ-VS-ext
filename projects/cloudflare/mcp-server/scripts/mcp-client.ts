import 'dotenv/config';
import fetch from 'node-fetch';

const BASE = 'http://localhost:8787/rpc';

async function getContract(contractId: string) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-redqueen-auth': process.env.REDQUEEN_API_KEY || ''
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getContract',
      params: { contractId },
      id: 1
    })
  });
  const data = await res.json();
  console.log('Contract:', JSON.stringify(data, null, 2));
}

async function claim(contractId: string, agentId: string, srDelta: number) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-redqueen-auth': process.env.REDQUEEN_API_KEY || ''
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'evaluateClaim',
      params: { contractId, agentId, srDelta },
      id: 2
    })
  });
  const data = await res.json();
  console.log('Claim:', JSON.stringify(data, null, 2));
}

async function reportDrift(contractId: string, agentId: string, drift: number) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-redqueen-auth': process.env.REDQUEEN_API_KEY || ''
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'reportDrift',
      params: { contractId, agentId, drift, metrics: { cpu: 0.1, memory: 0.2, latency: 10 } },
      id: 3
    })
  });
  const data = await res.json();
  console.log('Drift Report:', JSON.stringify(data, null, 2));
}

// Usage: pnpm tsx scripts/mcp-client.ts getContract MemoryTrace::Indexer
const [,, cmd, contractId, agentId, value] = process.argv;
if (cmd === 'getContract') getContract(contractId);
if (cmd === 'claim') claim(contractId, agentId, parseFloat(value));
if (cmd === 'reportDrift') reportDrift(contractId, agentId, parseFloat(value));
