export interface Contract {
  id: string;
  agentId: string;
  type: string;
  timestamp: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  srDelta: number;
  metadata: Record<string, unknown>;
}

export interface Claim {
  agentId: string;
  contractId: string;
  srDelta: number;
  timestamp: number;
  proof?: string;
}

export interface DriftReport {
  contractId: string;
  agentId: string;
  timestamp: number;
  drift: number;
  metrics: {
    cpu: number;
    memory: number;
    latency: number;
  };
}

export interface AuditLog {
  id: string;
  timestamp: number;
  action: 'claim' | 'contract' | 'drift';
  agentId: string;
  contractId?: string;
  details: Record<string, unknown>;
}
