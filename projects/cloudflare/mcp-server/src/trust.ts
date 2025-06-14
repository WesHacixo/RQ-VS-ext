import { D1Database } from '@cloudflare/workers-types';

export async function updateTrustScore(db: D1Database, agentId: string, drift: number, decayRate: number) {
  // Fetch current trust score
  const { results } = await db.prepare('SELECT trust FROM agent_trust WHERE agent_id = ?').bind(agentId).all();
  let trust = results.length ? results[0].trust : 1.0;
  // Decay trust
  trust = Math.max(0, trust - drift * decayRate);
  // Upsert trust score
  await db.prepare('INSERT OR REPLACE INTO agent_trust (agent_id, trust) VALUES (?, ?)').bind(agentId, trust).run();
  return trust;
}
