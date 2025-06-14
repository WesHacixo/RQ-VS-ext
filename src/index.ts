import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getTrustScore } from './trust';

interface Env {
  DB: D1Database;
  CONTRACTS: KVNamespace;
  REDQUEEN_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// API key authentication middleware
app.use('*', async (c, next) => {
  if (["POST", "PUT", "DELETE"].includes(c.req.method)) {
    const auth = c.req.header('x-redqueen-auth');
    if (auth !== c.env.REDQUEEN_API_KEY) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
  }
  await next();
});

// Middleware
app.use('*', cors());
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  c.res.headers.set('X-Response-Time', `${duration}ms`);
});

// Trust score endpoint
app.get('/trust/:agentId', async (c) => {
  const agentId = c.req.param('agentId');
  const trust = await getTrustScore(c.env.DB, agentId);
  return c.json({ agentId, trust });
});

// Extend JSON-RPC
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
      case 'getTrustScore':
        result = await getTrustScore(c.env.DB, params.agentId);
        break;
      default:
        return c.json({ error: 'Unknown method', id }, 400);
    }
    return c.json({ jsonrpc: '2.0', result, id });
  } catch (error) {
    return c.json({ error: error.message, id }, 500);
  }
});

// ... rest of the file remains unchanged ...
