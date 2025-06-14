"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceEditorPanel = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const prismjs_1 = __importDefault(require("prismjs"));
require("prismjs/components/prism-json");
require("prismjs/components/prism-jsx");
require("prismjs/components/prism-markdown");
require("prismjs/components/prism-typescript");
require("prismjs/themes/prism-tomorrow.css");
const react_1 = require("react");
const logBridge_1 = require("../utils/logBridge");
/**
 * Maps file extensions to Prism.js language identifiers
 * @param type - File extension
 * @returns Prism.js language identifier
 */
const getLanguage = (type) => {
    switch (type) {
        case '.ts': return 'typescript';
        case '.tsx': return 'jsx';
        case '.json': return 'json';
        case '.md': return 'markdown';
        default: return 'plaintext';
    }
};
/**
 * WorkspaceEditorPanel Component
 *
 * A component that provides file browsing, viewing, and editing capabilities.
 * Features include:
 * - File search and filtering
 * - Syntax highlighting
 * - File content editing
 * - Analytics tracking
 * - Debug mode support
 *
 * @param props - Component props
 * @returns React component
 */
const WorkspaceEditorPanel = ({ debugMode = false, featureFlags = { enableWorkspaceEditor: true } }) => {
    const [files, setFiles] = (0, react_1.useState)([]);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [selectedFile, setSelectedFile] = (0, react_1.useState)(null);
    const [fileContent, setFileContent] = (0, react_1.useState)('');
    const [editContent, setEditContent] = (0, react_1.useState)('');
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const [showConfirmModal, setShowConfirmModal] = (0, react_1.useState)(false);
    const [analytics, setAnalytics] = (0, react_1.useState)({
        filesViewed: new Set(),
        editCount: 0,
        searchCount: 0,
        lastInteraction: new Date().toISOString()
    });
    // Early return if feature is disabled
    if (!featureFlags.enableWorkspaceEditor) {
        return null;
    }
    // Request file list on mount
    (0, react_1.useEffect)(() => {
        // If you need VS Code API, use:
        // const vscode = acquireVsCodeApi();
        // vscode.postMessage({ type: 'REQUEST_FILE_LIST' });
    }, []);
    /**
     * Handles file selection and content loading
     * @param file - Selected file entry
     */
    const handleFileSelect = (0, react_1.useCallback)((file) => {
        setSelectedFile(file);
        setEditContent('');
        setIsEditing(false);
        setAnalytics(prev => ({
            ...prev,
            filesViewed: new Set([...prev.filesViewed, file.path]),
            lastInteraction: new Date().toISOString()
        }));
        (0, logBridge_1.logMessage)('info', 'File selected', {
            path: file.path,
            type: file.type,
            totalFilesViewed: analytics.filesViewed.size + 1
        });
        // If you need VS Code API, use:
        // vscode.postMessage({
        //   type: 'FETCH_FILE_CONTENT',
        //   payload: { path: file.path }
        // });
    }, [analytics.filesViewed.size]);
    /**
     * Handles file search functionality
     * @param query - Search query string
     */
    const handleSearch = (0, react_1.useCallback)((query) => {
        setSearchQuery(query);
        setAnalytics(prev => ({
            ...prev,
            searchCount: prev.searchCount + 1,
            lastInteraction: new Date().toISOString()
        }));
        (0, logBridge_1.logMessage)('info', 'File search', {
            query,
            resultCount: filteredFiles.length,
            totalSearches: analytics.searchCount + 1
        });
    }, [analytics.searchCount]);
    /**
     * Handles file content editing
     * @param content - New content to set
     */
    const handleEdit = (0, react_1.useCallback)((content) => {
        setEditContent(content);
        setAnalytics(prev => ({
            ...prev,
            editCount: prev.editCount + 1,
            lastInteraction: new Date().toISOString()
        }));
        (0, logBridge_1.logMessage)('info', 'File edit', {
            path: selectedFile?.path,
            contentLength: content.length,
            totalEdits: analytics.editCount + 1
        });
    }, [analytics.editCount, selectedFile?.path]);
    /**
     * Handles file save operation
     */
    const handleSave = (0, react_1.useCallback)(() => {
        if (!selectedFile)
            return;
        const saveAnalytics = {
            path: selectedFile.path,
            contentLength: editContent.length,
            timeSinceLastEdit: new Date().getTime() - new Date(analytics.lastInteraction).getTime(),
            totalEdits: analytics.editCount
        };
        (0, logBridge_1.logMessage)('info', 'Save initiated', saveAnalytics);
        if (debugMode) {
            setShowConfirmModal(true);
        }
        else {
            saveFile();
        }
    }, [debugMode, editContent.length, selectedFile, analytics.lastInteraction, analytics.editCount]);
    /**
     * Saves the current file content
     */
    const saveFile = (0, react_1.useCallback)(() => {
        if (!selectedFile)
            return;
        // If you need VS Code API, use:
        // vscode.postMessage({
        //   type: 'SAVE_FILE_CONTENT',
        //   payload: {
        //     path: selectedFile.path,
        //     content: editContent
        //   }
        // });
        setShowConfirmModal(false);
        setIsEditing(false);
    }, [editContent, selectedFile]);
    // Filter files based on search query
    const filteredFiles = (0, react_1.useMemo)(() => files.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase())), [files, searchQuery]);
    /**
     * Applies syntax highlighting to code
     * @param code - Code to highlight
     * @param language - Language identifier
     * @returns Highlighted HTML string
     */
    const highlightCode = (0, react_1.useCallback)((code, language) => {
        return prismjs_1.default.highlight(code, prismjs_1.default.languages[language], language);
    }, []);
    /**
     * Renders the file preview with syntax highlighting
     * @returns JSX element
     */
    const renderPreview = (0, react_1.useCallback)(() => {
        if (!selectedFile || !fileContent)
            return null;
        const language = getLanguage(selectedFile.type);
        const highlighted = highlightCode(fileContent, language);
        return ((0, jsx_runtime_1.jsx)("pre", { className: "preview-area", children: (0, jsx_runtime_1.jsx)("code", { className: `language-${language}`, dangerouslySetInnerHTML: { __html: highlighted } }) }));
    }, [fileContent, highlightCode, selectedFile]);
    /**
     * Renders the file edit area with syntax highlighting
     * @returns JSX element
     */
    const renderEditArea = (0, react_1.useCallback)(() => {
        if (!selectedFile)
            return null;
        const language = getLanguage(selectedFile.type);
        return ((0, jsx_runtime_1.jsxs)("div", { className: "edit-container", children: [(0, jsx_runtime_1.jsx)("textarea", { value: editContent, onChange: (e) => handleEdit(e.target.value), className: `edit-area language-${language}`, spellCheck: false }), (0, jsx_runtime_1.jsx)("div", { className: "edit-preview", children: (0, jsx_runtime_1.jsx)("code", { className: `language-${language}`, dangerouslySetInnerHTML: {
                            __html: highlightCode(editContent, language)
                        } }) })] }));
    }, [editContent, handleEdit, highlightCode, selectedFile]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "workspace-editor-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "file-browser", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search files...", value: searchQuery, onChange: (e) => handleSearch(e.target.value), className: "search-input" }), (0, jsx_runtime_1.jsx)("div", { className: "file-list", children: filteredFiles.map(file => ((0, jsx_runtime_1.jsx)("div", { className: `file-item ${selectedFile?.path === file.path ? 'selected' : ''}`, onClick: () => handleFileSelect(file), children: file.name }, file.path))) })] }), (0, jsx_runtime_1.jsx)("div", { className: "file-preview", children: selectedFile ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "file-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: selectedFile.name }), (0, jsx_runtime_1.jsxs)("div", { className: "file-stats", children: [debugMode && ((0, jsx_runtime_1.jsxs)("span", { className: "stats", children: ["Views: ", analytics.filesViewed.size, " | Edits: ", analytics.editCount, " | Searches: ", analytics.searchCount] })), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsEditing(!isEditing), children: isEditing ? 'Cancel' : 'Edit' })] })] }), isEditing ? ((0, jsx_runtime_1.jsx)("textarea", { value: editContent, onChange: (e) => handleEdit(e.target.value), className: `edit-area language-${getLanguage(selectedFile.type)}`, spellCheck: false })) : (renderPreview()), isEditing && ((0, jsx_runtime_1.jsx)("button", { onClick: handleSave, className: "save-button", children: "Save Changes" }))] })) : ((0, jsx_runtime_1.jsx)("div", { className: "no-file-selected", children: "Select a file to preview" })) }), showConfirmModal && ((0, jsx_runtime_1.jsx)("div", { className: "modal-overlay", children: (0, jsx_runtime_1.jsxs)("div", { className: "modal-content", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Confirm File Edit" }), (0, jsx_runtime_1.jsxs)("p", { children: ["You are about to modify: ", selectedFile?.name] }), (0, jsx_runtime_1.jsx)("p", { children: "This action cannot be undone." }), (0, jsx_runtime_1.jsxs)("div", { className: "modal-actions", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setShowConfirmModal(false), children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { onClick: saveFile, className: "confirm-button", children: "Confirm Edit" })] })] }) }))] }));
};
exports.WorkspaceEditorPanel = WorkspaceEditorPanel;
//# sourceMappingURL=WorkspaceEditorPanel.js.map