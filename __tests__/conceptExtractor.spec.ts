import * as fs from 'fs';
import * as path from 'path';
import { extractConceptTokens } from '../src/agents/astConceptParser';

type SemanticMetrics = {
  sr: number;
  lsd: number;
  sae: number;
  mcr: number;
  delta: number;
};

describe('RedQueen Concept Pipeline', () => {
  const fixturePath = path.join(__dirname, '../fixtures/testExample.ts');
  const source = fs.readFileSync(fixturePath, 'utf-8');
  const mockMetrics: SemanticMetrics = { sr: 0.9, lsd: 0.8, sae: 0.7, mcr: 0.6, delta: 0 };

  it('extracts ConceptTokens with correct types and IMF tags', () => {
    const tokens = extractConceptTokens(source);
    expect(tokens.length).toBe(3);
    const names = tokens.map(t => t.name);
    expect(names).toContain('loginUser');
    expect(names).toContain('useFormState');
    expect(names).toContain('DashboardWidget');

    const types = tokens.map(t => t.type);
    expect(types).toContain('function');
    expect(types).toContain('hook');
    expect(types).toContain('class');

    // IMF tag consistency
    const imfTags = tokens.map(t => t.imfTag).filter(Boolean);
    expect(imfTags).toContain('Handles user login intent');
    expect(imfTags).toContain('Reactive state hook');

    // Build a MemoryThread mock
    const thread = {
      id: 'mock-file',
      timestamp: Date.now(),
      type: 'code',
      content: source,
      metrics: mockMetrics,
      metadata: {
        context: tokens.map(t => t.name),
        relationships: [],
        lastModified: Date.now(),
        imfTags: tokens.map(t => t.imfTag).filter(Boolean)
      }
    };
    // IMF tags present in thread metadata
    expect(thread.metadata.imfTags).toEqual(expect.arrayContaining(imfTags));
  });

  // Optional: Emit SR metrics JSON (mocked for now)
  it('can emit SR metrics JSON for project', () => {
    const tokens = extractConceptTokens(source);
    const srMetrics = {
      'fixtures/testExample.ts': {
        avgSR: 0.86, // placeholder
        concepts: tokens.map(t => t.name),
        tags: tokens.map(t => t.imfTag).filter(Boolean)
      }
    };
    expect(srMetrics['fixtures/testExample.ts'].concepts.length).toBe(3);
    expect(Array.isArray(srMetrics['fixtures/testExample.ts'].tags)).toBe(true);
  });
});
