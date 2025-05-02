import React, { useState, useEffect } from 'react';
import { EditorJs } from './editor-js';
import { TiptapEditor } from './tiptap-editor';

interface AdaptiveEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

/**
 * AdaptiveEditor automatically chooses between EditorJS and TipTap
 * based on the environment and compatibility.
 * 
 * The component tries to use EditorJS first, but if it fails to load or
 * we're in a production environment where CommonJS modules are problematic,
 * it falls back to TipTap which is more reliable in browser environments.
 */
export function AdaptiveEditor(props: AdaptiveEditorProps) {
  const [useEditorJs, setUseEditorJs] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Determine if we're in production and should default to TipTap
    const isProd = process.env.NODE_ENV === 'production' || import.meta.env?.MODE === 'production';
    
    // In production, simply use TipTap for reliability
    if (isProd) {
      console.log('Production environment detected - using TipTap editor');
      setUseEditorJs(false);
      return;
    }
    
    // In development, try EditorJS first
    setUseEditorJs(true);
    
    // Safety timeout - if EditorJS fails to load in 3 seconds, switch to TipTap
    const timeout = setTimeout(() => {
      const editorJsElements = document.querySelectorAll('.codex-editor');
      if (editorJsElements.length === 0) {
        console.log('EditorJS failed to load in time - switching to TipTap');
        setUseEditorJs(false);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  // Show loading state until editor type is determined
  if (useEditorJs === null) {
    return (
      <div className={`editor-loading ${props.className || ''}`}>
        <div className="p-4 border rounded-md animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Once determined, render the appropriate editor
  return useEditorJs ? (
    <EditorJs {...props} />
  ) : (
    <TiptapEditor {...props} />
  );
}
