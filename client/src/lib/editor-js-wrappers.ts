/**
 * This file provides ESM-compatible wrappers for EditorJS tools
 * to avoid 'require is not defined' errors in production builds
 */

// Common function to safely import an EditorJS tool
async function safeImport(importFn: () => Promise<any>) {
  try {
    const module = await importFn();
    // Handle both ESM and CommonJS-style exports
    return module.default || module;
  } catch (error) {
    console.error('Error importing editor tool:', error);
    return null;
  }
}

// Export wrapper functions for each EditorJS tool
export async function loadHeaderTool() {
  return safeImport(() => import('@editorjs/header'));
}

export async function loadListTool() {
  return safeImport(() => import('@editorjs/list'));
}

export async function loadParagraphTool() {
  return safeImport(() => import('@editorjs/paragraph'));
}

export async function loadQuoteTool() {
  return safeImport(() => import('@editorjs/quote'));
}

export async function loadChecklistTool() {
  return safeImport(() => import('@editorjs/checklist'));
}

export async function loadLinkTool() {
  return safeImport(() => import('@editorjs/link'));
}

export async function loadTableTool() {
  return safeImport(() => import('@editorjs/table'));
}

export async function loadDelimiterTool() {
  return safeImport(() => import('@editorjs/delimiter'));
}

export async function loadWarningTool() {
  return safeImport(() => import('@editorjs/warning'));
}

export async function loadImageTool() {
  return safeImport(() => import('@editorjs/image'));
}

export async function loadMarkerTool() {
  return safeImport(() => import('@editorjs/marker'));
}

export async function loadCodeTool() {
  return safeImport(() => import('@editorjs/code'));
}

export async function loadEmbedTool() {
  return safeImport(() => import('@editorjs/embed'));
}

// Load the ReactEditorJS component
export async function loadReactEditorJS() {
  try {
    const module = await import('react-editor-js');
    if (module && module.createReactEditorJS) {
      return module.createReactEditorJS();
    }
    return null;
  } catch (error) {
    console.error('Error loading ReactEditorJS:', error);
    return null;
  }
}
