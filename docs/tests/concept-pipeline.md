# 🧬 RedQueen Concept Pipeline Test

## Intent
Validate the semantic fidelity of the RedQueen concept extraction pipeline:
- AST parser → ConceptToken → MemoryThread
- Ensure IMF tags, typing, and context are preserved
- Prove the foundation for agentic routing, SR overlays, and memory-driven development

## Test Input
**File:** `fixtures/testExample.ts`
```ts
// *|Handles user login intent|*
function loginUser() {}

// *|Reactive state hook|*
const useFormState = () => { return {}; };

class DashboardWidget {
  render() { return null; }
}
```

## Test Output
- 3 ConceptTokens extracted
- Types: `function`, `hook`, `class`
- IMF tags parsed: "Handles user login intent", "Reactive state hook"
- Tokens and thread metadata both contain IMF tags
- Typing is accurate and robust

## Expected Behaviors
- **IMF Tag Consistency:** Tags are parsed and stored in both ConceptToken and MemoryThread
- **Token Typing:** Functions, hooks, and classes are correctly identified
- **Semantic Metrics:** Mocked for this test, but pipeline is ready for SR integration
- **Thread Construction:** Tokens are bound to a MemoryThread with context, time, and tags

## Why This Test Matters
- It proves the core "idea-to-memory" loop in RedQueen
- Ensures agentic and UI layers can trust the semantic substrate
- Enables future features: agent routing, SR overlays, GIST scoring, chat-to-code
- Establishes a contract for all future semantic and agentic modules

---

> "This is not just a test — it's the first proof of cognition in the RedQueen kernel."
