import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-typescript';
import 'prismjs/themes/prism-tomorrow.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { logMessage } from '../utils/logBridge';

/**
 * Represents a file entry in the workspace
 */
interface FileEntry {
  /** Full path to the file */
  path: string;
  /** Name of the file */
  name: string;
  /** File extension/type */
  type: string;
}

/**
 * Props for the WorkspaceEditorPanel component
 */
interface WorkspaceEditorPanelProps {
  /** Enable debug mode for additional logging and UI elements */
  debugMode?: boolean;
  /** Feature flags to control component behavior */
  featureFlags?: {
    /** Enable/disable the workspace editor functionality */
    enableWorkspaceEditor?: boolean;
  };
}

/**
 * Analytics data for tracking user interactions
 */
interface EditorAnalytics {
  /** Set of file paths that have been viewed */
  filesViewed: Set<string>;
  /** Number of edits made */
  editCount: number;
  /** Number of searches performed */
  searchCount: number;
  /** Timestamp of last user interaction */
  lastInteraction: string;
}

/**
 * Maps file extensions to Prism.js language identifiers
 * @param type - File extension
 * @returns Prism.js language identifier
 */
const getLanguage = (type: string): string => {
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
export const WorkspaceEditorPanel: React.FC<WorkspaceEditorPanelProps> = ({
  debugMode = false,
  featureFlags = { enableWorkspaceEditor: true }
}) => {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [analytics, setAnalytics] = useState<EditorAnalytics>({
    filesViewed: new Set<string>(),
    editCount: 0,
    searchCount: 0,
    lastInteraction: new Date().toISOString()
  });

  // Early return if feature is disabled
  if (!featureFlags.enableWorkspaceEditor) {
    return null;
  }

  // Request file list on mount
  useEffect(() => {
    // If you need VS Code API, use:
    // const vscode = acquireVsCodeApi();
    // vscode.postMessage({ type: 'REQUEST_FILE_LIST' });
  }, []);

  /**
   * Handles file selection and content loading
   * @param file - Selected file entry
   */
  const handleFileSelect = useCallback((file: FileEntry) => {
    setSelectedFile(file);
    setEditContent('');
    setIsEditing(false);
    setAnalytics(prev => ({
      ...prev,
      filesViewed: new Set([...prev.filesViewed, file.path]),
      lastInteraction: new Date().toISOString()
    }));
    logMessage('info', 'File selected', {
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
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setAnalytics(prev => ({
      ...prev,
      searchCount: prev.searchCount + 1,
      lastInteraction: new Date().toISOString()
    }));
    logMessage('info', 'File search', {
      query,
      resultCount: filteredFiles.length,
      totalSearches: analytics.searchCount + 1
    });
  }, [analytics.searchCount]);

  /**
   * Handles file content editing
   * @param content - New content to set
   */
  const handleEdit = useCallback((content: string) => {
    setEditContent(content);
    setAnalytics(prev => ({
      ...prev,
      editCount: prev.editCount + 1,
      lastInteraction: new Date().toISOString()
    }));
    logMessage('info', 'File edit', {
      path: selectedFile?.path,
      contentLength: content.length,
      totalEdits: analytics.editCount + 1
    });
  }, [analytics.editCount, selectedFile?.path]);

  /**
   * Handles file save operation
   */
  const handleSave = useCallback(() => {
    if (!selectedFile) {return;}

    const saveAnalytics = {
      path: selectedFile.path,
      contentLength: editContent.length,
      timeSinceLastEdit: new Date().getTime() - new Date(analytics.lastInteraction).getTime(),
      totalEdits: analytics.editCount
    };

    logMessage('info', 'Save initiated', saveAnalytics);

    if (debugMode) {
      setShowConfirmModal(true);
    } else {
      saveFile();
    }
  }, [debugMode, editContent.length, selectedFile, analytics.lastInteraction, analytics.editCount]);

  /**
   * Saves the current file content
   */
  const saveFile = useCallback(() => {
    if (!selectedFile) {return;}

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
  const filteredFiles = useMemo(() =>
    files.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [files, searchQuery]
  );

  /**
   * Applies syntax highlighting to code
   * @param code - Code to highlight
   * @param language - Language identifier
   * @returns Highlighted HTML string
   */
  const highlightCode = useCallback((code: string, language: string): string => {
    return Prism.highlight(code, Prism.languages[language], language);
  }, []);

  /**
   * Renders the file preview with syntax highlighting
   * @returns JSX element
   */
  const renderPreview = useCallback(() => {
    if (!selectedFile || !fileContent) {return null;}
    const language = getLanguage(selectedFile.type);
    const highlighted = highlightCode(fileContent, language);
    return (
      <pre className="preview-area">
        <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    );
  }, [fileContent, highlightCode, selectedFile]);

  /**
   * Renders the file edit area with syntax highlighting
   * @returns JSX element
   */
  const renderEditArea = useCallback(() => {
    if (!selectedFile) {return null;}
    const language = getLanguage(selectedFile.type);
    return (
      <div className="edit-container">
        <textarea
          value={editContent}
          onChange={(e) => handleEdit(e.target.value)}
          className={`edit-area language-${language}`}
          spellCheck={false}
        />
        <div className="edit-preview">
          <code className={`language-${language}`} dangerouslySetInnerHTML={{
            __html: highlightCode(editContent, language)
          }} />
        </div>
      </div>
    );
  }, [editContent, handleEdit, highlightCode, selectedFile]);

  return (
    <div className="workspace-editor-panel">
      <div className="file-browser">
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        <div className="file-list">
          {filteredFiles.map(file => (
            <div
              key={file.path}
              className={`file-item ${selectedFile?.path === file.path ? 'selected' : ''}`}
              onClick={() => handleFileSelect(file)}
            >
              {file.name}
            </div>
          ))}
        </div>
      </div>

      <div className="file-preview">
        {selectedFile ? (
          <>
            <div className="file-header">
              <h3>{selectedFile.name}</h3>
              <div className="file-stats">
                {debugMode && (
                  <span className="stats">
                    Views: {analytics.filesViewed.size} |
                    Edits: {analytics.editCount} |
                    Searches: {analytics.searchCount}
                  </span>
                )}
                <button onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => handleEdit(e.target.value)}
                className={`edit-area language-${getLanguage(selectedFile.type)}`}
                spellCheck={false}
              />
            ) : (
              renderPreview()
            )}
            {isEditing && (
              <button onClick={handleSave} className="save-button">
                Save Changes
              </button>
            )}
          </>
        ) : (
          <div className="no-file-selected">
            Select a file to preview
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm File Edit</h3>
            <p>You are about to modify: {selectedFile?.name}</p>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button onClick={saveFile} className="confirm-button">
                Confirm Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
