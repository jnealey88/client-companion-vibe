import React from 'react';
import { RichTextEditor } from './rich-text-editor';

interface EditorJsProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

export function EditorJs(props: EditorJsProps) {
  return (
    <RichTextEditor 
      content={props.content}
      onChange={props.onChange}
      readOnly={props.readOnly}
      placeholder={props.placeholder}
      className={props.className}
    />
  );
}