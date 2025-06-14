#!/usr/bin/env ts-node

// Dev CLI for RedQueen Agent Console
import { FEATURES } from '../src/config/FEATURE_FLAGS';

async function printStatus() {
  // Stub: Replace with real agent/task manager integration
  const agents = [{ id: 'agent1', status: 'active' }, { id: 'agent2', status: 'idle' }];
  const taskQueueLength = 3; // Stub
  const budget = { cpu: 42, memory: 512, remoteCalls: 7 };

  console.log('RedQueen Agent Status:');
  agents.forEach(a => console.log(`- ${a.id}: ${a.status}`));
  console.log(`Task Queue Length: ${taskQueueLength}`);
  console.log(`Budget: CPU ${budget.cpu}%, Memory ${budget.memory}MB, Remote Calls ${budget.remoteCalls}`);
  if (FEATURES.DEV_OVERLAYS) {
    console.log('Dev Overlays: ENABLED');
  }
}

if (process.argv[2] === 'status') {
  printStatus();
} else {
  console.log('Usage: npx redqueen status');
}
