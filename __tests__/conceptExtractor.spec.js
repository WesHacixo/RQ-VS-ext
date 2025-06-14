"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const astConceptParser_1 = require("../src/agents/astConceptParser");
describe('AST Concept Extractor', () => {
    const fixturePath = path.join(__dirname, '../fixtures/testExample.ts');
    const source = fs.readFileSync(fixturePath, 'utf-8');
    it('extracts all concept tokens with correct types and IMF tags', () => {
        const tokens = (0, astConceptParser_1.extractConceptTokens)(source);
        expect(tokens.length).toBe(3);
        const names = tokens.map(t => t.name);
        expect(names).toContain('loginUser');
        expect(names).toContain('useFormState');
        expect(names).toContain('DashboardWidget');
        const types = tokens.map(t => t.type);
        expect(types).toContain('function');
        expect(types).toContain('hook');
        expect(types).toContain('class');
        const imfTags = tokens.map(t => t.imfTag).filter(Boolean);
        expect(imfTags).toContain('Handles user login intent');
        expect(imfTags).toContain('Reactive state hook');
    });
    // Optional: Emit SR metrics JSON (mocked for now)
    it('can emit SR metrics JSON for project', () => {
        const tokens = (0, astConceptParser_1.extractConceptTokens)(source);
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
//# sourceMappingURL=conceptExtractor.spec.js.map