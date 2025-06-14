import { parse, TSESTree } from '@typescript-eslint/typescript-estree';

export type ConceptType = 'function' | 'component' | 'hook' | 'class' | 'pattern';

export interface ASTConceptToken {
    name: string;
    type: ConceptType;
    loc: {
        start: number;
        end: number;
    };
    imfTag?: string;
}

// *|Extracts concept tokens from TypeScript/JavaScript source code|*
export function extractConceptTokens(source: string): ASTConceptToken[] {
    const ast = parse(source, { loc: true, comment: true, jsx: true });
    const concepts: ASTConceptToken[] = [];

    function addConcept(name: string, type: ConceptType, node: TSESTree.Node, imfTag?: string) {
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

    function visit(node: TSESTree.Node, parent?: TSESTree.Node) {
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
            const value = (node as any)[key];
            if (Array.isArray(value)) {
                value.forEach(child => {
                    if (child && typeof child.type === 'string') {visit(child, node);}
                });
            } else if (value && typeof value.type === 'string') {
                visit(value, node);
            }
        }
    }

    visit(ast as unknown as TSESTree.Node);
    return concepts;
}

// *|Detects concept type based on naming and context|*
function detectConceptType(name: string, node: TSESTree.Node): ConceptType {
    if (/^use[A-Z]/.test(name)) {return 'hook';}
    if (/^[A-Z]/.test(name)) {return 'component';}
    if (node.type === 'ClassDeclaration') {return 'class';}
    // TODO: Add more pattern detection
    return 'function';
}

// *|Finds IMF tag in leading comments or inline|*
function findIMFTag(node: TSESTree.Node, source: string): string | undefined {
    // Look for *|...|* in leading comments
    if ('leadingComments' in node && Array.isArray((node as any).leadingComments)) {
        const comments = (node as any).leadingComments as TSESTree.Comment[];
        for (const comment of comments) {
            const match = comment.value.match(/\*\|(.+?)\|\*/);
            if (match) {return match[1];}
        }
    }
    // Fallback: search source near node start
    const snippet = source.slice(Math.max(0, node.range[0] - 100), node.range[0]);
    const match = snippet.match(/\*\|(.+?)\|\*/);
    return match ? match[1] : undefined;
}
