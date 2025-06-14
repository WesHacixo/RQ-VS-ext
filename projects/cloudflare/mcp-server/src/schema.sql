-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  action TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  contract_id TEXT,
  details TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Create agent_trust table for trust decay
CREATE TABLE IF NOT EXISTS agent_trust (
  agent_id TEXT PRIMARY KEY,
  trust REAL NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_agent_id ON audit_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_contract_id ON audit_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
