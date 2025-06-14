import 'dotenv/config';
import fetch from 'node-fetch';

const BASE = 'https://redqueen-mcp-server.bluehand.workers.dev/rpc';
const BASE_REST = 'https://redqueen-mcp-server.bluehand.workers.dev';

function printHelp() {
  console.log(`\nRedQueen MCP CLI\n==================\n
Usage:
  pnpm tsx scripts/mcp-client.ts <command> [args...]

Commands (aliases):
  getContract, getc   <contractId>                        Fetch a contract by ID
  claim, clam         <contractId> <agentId> <srDelta>    Submit a claim
  reportDrift, drft   <contractId> <agentId> <drift>      Report drift
  getTrustScore, trst <agentId>                           Get agent trust score
  --help, -h, help, -help                                Show this help screen

Examples:
  pnpm tsx scripts/mcp-client.ts getc MemoryTrace::Indexer
  pnpm tsx scripts/mcp-client.ts clam MemoryTrace::Indexer RedQueen::Windsurf 0.81
  pnpm tsx scripts/mcp-client.ts drft MemoryTrace::Indexer RedQueen::Windsurf 0.12
  pnpm tsx scripts/mcp-client.ts trst RedQueen::Windsurf
`);
}

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

async function getTrustScore(agentId: string) {
  // Try JSON-RPC first
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-redqueen-auth': process.env.REDQUEEN_API_KEY || ''
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getTrustScore',
      params: { agentId },
      id: 4
    })
  });
  const data = await res.json();
  console.log('Trust Score (RPC):', JSON.stringify(data, null, 2));

  // Also try REST endpoint
  const res2 = await fetch(`${BASE_REST}/trust/${agentId}`, {
    headers: { 'x-redqueen-auth': process.env.REDQUEEN_API_KEY || '' }
  });
  const data2 = await res2.json();
  console.log('Trust Score (REST):', JSON.stringify(data2, null, 2));
}

const [,, cmd, ...args] = process.argv;
const helpAliases = ['--help', '-h', 'help', '-help'];
if (!cmd || helpAliases.includes(cmd)) {
  printHelp();
} else if (cmd === 'getContract' || cmd === 'getc') {
  getContract(args[0]);
} else if (cmd === 'claim' || cmd === 'clam') {
  claim(args[0], args[1], parseFloat(args[2]));
} else if (cmd === 'reportDrift' || cmd === 'drft') {
  reportDrift(args[0], args[1], parseFloat(args[2]));
} else if (cmd === 'getTrustScore' || cmd === 'trst') {
  getTrustScore(args[0]);
} else {
  printHelp();
}
