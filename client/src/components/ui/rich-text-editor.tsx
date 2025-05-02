import React from 'react';
import { TiptapEditor } from './tiptap-editor';

// This is a compatibility wrapper around TiptapEditor to maintain backward compatibility
// with code that expects RichTextEditor to be available
export interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

export function RichTextEditor(props: RichTextEditorProps) {
  // Simply pass through to TiptapEditor
  return <TiptapEditor {...props} />;
}
