import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AuditLog, Claim, DriftReport } from './types';

interface Env {
  DB: D1Database;
  CONTRACTS: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  c.res.headers.set('X-Response-Time', `${duration}ms`);
});

// JSON-RPC 2.0 endpoint
app.post('/rpc', async (c) => {
  const { method, params, id } = await c.req.json();
  let result;
  try {
    switch (method) {
      case 'evaluateClaim':
        result = await claimContract(params, c);
        break;
      case 'getContract':
        result = await getContract(params.contractId, c);
        break;
      case 'reportDrift':
        result = await reportDrift(params, c);
        break;
      default:
        return c.json({ error: 'Unknown method', id }, 400);
    }
    return c.json({ jsonrpc: '2.0', result, id });
  } catch (error) {
    return c.json({ error: error.message, id }, 500);
  }
});

// Serve mcp.config.json from KV
app.get('/mcp.config.json', async (c) => {
  const config = await c.env.CONTRACTS.get('mcp.config.json');
  if (config) return c.json(JSON.parse(config));
  return c.json({ error: 'Config not found' }, 404);
});

// Routes
app.post('/claim', async (c) => {
  try {
    const claim: Claim = await c.req.json();

    // Validate claim
    if (!claim.agentId || !claim.contractId || typeof claim.srDelta !== 'number') {
      return c.json({ error: 'Invalid claim format' }, 400);
    }

    // Store in D1
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: 'claim',
      agentId: claim.agentId,
      contractId: claim.contractId,
      details: { srDelta: claim.srDelta }
    };

    await c.env.DB.prepare(
      'INSERT INTO audit_logs (id, timestamp, action, agent_id, contract_id, details) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      auditLog.id,
      auditLog.timestamp,
      auditLog.action,
      auditLog.agentId,
      auditLog.contractId,
      JSON.stringify(auditLog.details)
    ).run();

    return c.json({ success: true, claimId: auditLog.id });
  } catch (error) {
    console.error('Claim error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/contract/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const contract = await c.env.CONTRACTS.get(id);

    if (!contract) {
      return c.json({ error: 'Contract not found' }, 404);
    }

    return c.json(JSON.parse(contract));
  } catch (error) {
    console.error('Contract retrieval error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/drift-report', async (c) => {
  try {
    const report: DriftReport = await c.req.json();

    // Validate report
    if (!report.contractId || !report.agentId || typeof report.drift !== 'number') {
      return c.json({ error: 'Invalid drift report format' }, 400);
    }

    // Store in D1
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: 'drift',
      agentId: report.agentId,
      contractId: report.contractId,
      details: { drift: report.drift, metrics: report.metrics }
    };

    await c.env.DB.prepare(
      'INSERT INTO audit_logs (id, timestamp, action, agent_id, contract_id, details) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      auditLog.id,
      auditLog.timestamp,
      auditLog.action,
      auditLog.agentId,
      auditLog.contractId,
      JSON.stringify(auditLog.details)
    ).run();

    return c.json({ success: true, reportId: auditLog.id });
  } catch (error) {
    console.error('Drift report error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Helper functions for JSON-RPC
async function claimContract(params: any, c: any) {
  if (!params.agentId || !params.contractId || typeof params.srDelta !== 'number') {
    throw new Error('Invalid claim format');
  }
  const auditLog: AuditLog = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    action: 'claim',
    agentId: params.agentId,
    contractId: params.contractId,
    details: { srDelta: params.srDelta }
  };
  await c.env.DB.prepare(
    'INSERT INTO audit_logs (id, timestamp, action, agent_id, contract_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(
    auditLog.id,
    auditLog.timestamp,
    auditLog.action,
    auditLog.agentId,
    auditLog.contractId,
    JSON.stringify(auditLog.details)
  ).run();
  return { success: true, claimId: auditLog.id };
}

async function getContract(contractId: string, c: any) {
  const contract = await c.env.CONTRACTS.get(contractId);
  if (!contract) throw new Error('Contract not found');
  return JSON.parse(contract);
}

async function reportDrift(params: any, c: any) {
  if (!params.contractId || !params.agentId || typeof params.drift !== 'number') {
    throw new Error('Invalid drift report format');
  }
  const auditLog: AuditLog = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    action: 'drift',
    agentId: params.agentId,
    contractId: params.contractId,
    details: { drift: params.drift, metrics: params.metrics }
  };
  await c.env.DB.prepare(
    'INSERT INTO audit_logs (id, timestamp, action, agent_id, contract_id, details) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(
    auditLog.id,
    auditLog.timestamp,
    auditLog.action,
    auditLog.agentId,
    auditLog.contractId,
    JSON.stringify(auditLog.details)
  ).run();
  return { success: true, reportId: auditLog.id };
}

export default app;
