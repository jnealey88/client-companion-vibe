import React from 'react';
import { TiptapEditor } from './tiptap-editor';

interface AdaptiveEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

/**
 * AdaptiveEditor now exclusively uses TipTap for all content editing.
 * 
 * TipTap provides a robust visual HTML editor with support for tables,
 * images, text formatting, and more. It's more reliable in all environments
 * and provides a superior user experience compared to EditorJS.
 */
export function AdaptiveEditor(props: AdaptiveEditorProps) {
  // Directly render the TipTap editor
  return <TiptapEditor {...props} />;
}
