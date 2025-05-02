import React, { useState, useEffect, Suspense } from 'react';
import { EditorJs as EditorJsFallback } from './editor-js-fallback';

interface EditorJsProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

// This component will try to load the real EditorJS component first,
// but will silently fall back to our simpler implementation if it fails
export function EditorJs(props: EditorJsProps) {
  const [EditorComponent, setEditorComponent] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Try to import the real EditorJS component
    import('./editor-js')
      .then(module => {
        setEditorComponent(() => module.EditorJs);
      })
      .catch(error => {
        console.error('Error loading EditorJS component:', error);
        setLoadError(true);
      });
  }, []);

  if (loadError) {
    // If loading failed, use our fallback
    return <EditorJsFallback {...props} />;
  }

  if (!EditorComponent) {
    // While loading, show a placeholder
    return (
      <div className={`editor-loading ${props.className || ''}`} style={{
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.375rem',
        backgroundColor: '#f7fafc',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading editor...
      </div>
    );
  }

  // If loaded successfully, use the real component
  return <EditorComponent {...props} />;
}
