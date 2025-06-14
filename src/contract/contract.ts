import { z } from 'zod';

// Core contract types
export enum ContractType {
  GET_MEMORY_DELTA = 'GET_MEMORY_DELTA',
  LOG_BRIDGE_MUTATION = 'LOG_BRIDGE_MUTATION',
  AGENT_LOOP_PING = 'AGENT_LOOP_PING',
  VAULT_OPERATION = 'VAULT_OPERATION'
}

export enum VaultAccessLevel {
  READ = 'READ',
  WRITE = 'WRITE',
  ADMIN = 'ADMIN'
}

export enum ResolutionStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PENDING = 'PENDING',
  INVALID = 'INVALID'
}

// Zod schemas for runtime validation
export const VaultOperationSchema = z.object({
  type: z.enum(['READ', 'WRITE', 'QUERY']),
  path: z.string(),
  semanticHash: z.string().optional(),
  proof: z.string().optional()
});

export const VaultContextSchema = z.object({
  semanticHash: z.string(),
  vaultPath: z.string(),
  accessLevel: z.nativeEnum(VaultAccessLevel)
});

export const ClaimSchema = z.object({
  action: z.string(),
  context: z.record(z.unknown()),
  assertions: z.array(z.record(z.unknown())),
  resolution: z.object({
    status: z.nativeEnum(ResolutionStatus),
    data: z.unknown(),
    drift: z.number(),
    proof: z.string()
  }).optional(),
  vaultOperations: z.array(VaultOperationSchema).optional()
});

export const ContractSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(ContractType),
  claim: ClaimSchema,
  timestamp: z.number(),
  proof: z.string().optional(),
  vaultContext: VaultContextSchema.optional()
});

// TypeScript interfaces
export interface VaultOperation {
  type: 'READ' | 'WRITE' | 'QUERY';
  path: string;
  semanticHash?: string;
  proof?: string;
}

export interface VaultContext {
  semanticHash: string;
  vaultPath: string;
  accessLevel: VaultAccessLevel;
}

export interface Claim {
  action: string;
  context: Record<string, unknown>;
  assertions: Record<string, unknown>[];
  resolution?: Resolution;
  vaultOperations?: VaultOperation[];
}

export interface Resolution {
  status: ResolutionStatus;
  data: unknown;
  drift: number;
  proof: string;
}

export interface Contract {
  id: string;
  type: ContractType;
  claim: Claim;
  timestamp: number;
  proof?: string;
  vaultContext?: VaultContext;
}

// Contract validation and creation utilities
export class ContractFactory {
  static createContract(
    type: ContractType,
    claim: Claim,
    vaultContext?: VaultContext
  ): Contract {
    const contract: Contract = {
      id: crypto.randomUUID(),
      type,
      claim,
      timestamp: Date.now(),
      vaultContext
    };

    // Validate contract
    ContractSchema.parse(contract);
    return contract;
  }

  static validateContract(contract: Contract): boolean {
    try {
      ContractSchema.parse(contract);
      return true;
    } catch (error) {
      console.error('Contract validation failed:', error);
      return false;
    }
  }
}

// Example contract creation
export const exampleContracts = {
  getMemoryDelta: () => ContractFactory.createContract(
    ContractType.GET_MEMORY_DELTA,
    {
      action: 'getMemoryDelta',
      context: { timestamp: Date.now() },
      assertions: [
        { type: 'timestamp', operator: '>', value: 0 }
      ]
    }
  ),

  vaultOperation: (path: string, operation: VaultOperation) => ContractFactory.createContract(
    ContractType.VAULT_OPERATION,
    {
      action: 'vaultOperation',
      context: { timestamp: Date.now() },
      assertions: [
        { type: 'path', operator: 'exists', value: true }
      ],
      vaultOperations: [operation]
    },
    {
      semanticHash: crypto.randomUUID(),
      vaultPath: path,
      accessLevel: VaultAccessLevel.READ
    }
  )
};
