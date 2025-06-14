"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractConceptTokens = extractConceptTokens;
const typescript_estree_1 = require("@typescript-eslint/typescript-estree");
// *|Extracts concept tokens from TypeScript/JavaScript source code|*
function extractConceptTokens(source) {
    const ast = (0, typescript_estree_1.parse)(source, { loc: true, comment: true, jsx: true });
    const concepts = [];
    function addConcept(name, type, node, imfTag) {
        concepts.push({
            name,
            type,
            loc: {
                start: node.range[0],
                end: node.range[1]
            },
            imfTag
        });
    }
    function visit(node, parent) {
        // Function declarations
        if (node.type === 'FunctionDeclaration' && node.id) {
            addConcept(node.id.name, detectConceptType(node.id.name, node), node, findIMFTag(node, source));
        }
        // Variable declarations (hooks, components)
        if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier') {
            const name = node.id.name;
            if (node.init) {
                if (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression') {
                    addConcept(name, detectConceptType(name, node), node, findIMFTag(node, source));
                }
            }
        }
        // Class declarations
        if (node.type === 'ClassDeclaration' && node.id) {
            addConcept(node.id.name, 'class', node, findIMFTag(node, source));
        }
        // JSX components (function or class)
        if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier') {
            addConcept(node.name.name, 'component', node, findIMFTag(node, source));
        }
        // Recurse
        for (const key in node) {
            const value = node[key];
            if (Array.isArray(value)) {
                value.forEach(child => {
                    if (child && typeof child.type === 'string') {
                        visit(child, node);
                    }
                });
            }
            else if (value && typeof value.type === 'string') {
                visit(value, node);
            }
        }
    }
    visit(ast);
    return concepts;
}
// *|Detects concept type based on naming and context|*
function detectConceptType(name, node) {
    if (/^use[A-Z]/.test(name)) {
        return 'hook';
    }
    if (/^[A-Z]/.test(name)) {
        return 'component';
    }
    if (node.type === 'ClassDeclaration') {
        return 'class';
    }
    // TODO: Add more pattern detection
    return 'function';
}
// *|Finds IMF tag in leading comments or inline|*
function findIMFTag(node, source) {
    // Look for *|...|* in leading comments
    if ('leadingComments' in node && Array.isArray(node.leadingComments)) {
        const comments = node.leadingComments;
        for (const comment of comments) {
            const match = comment.value.match(/\*\|(.+?)\|\*/);
            if (match) {
                return match[1];
            }
        }
    }
    // Fallback: search source near node start
    const snippet = source.slice(Math.max(0, node.range[0] - 100), node.range[0]);
    const match = snippet.match(/\*\|(.+?)\|\*/);
    return match ? match[1] : undefined;
}
//# sourceMappingURL=astConceptParser.js.map