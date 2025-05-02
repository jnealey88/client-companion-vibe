import React, { useState, useEffect } from 'react';
import { RichTextEditor } from './rich-text-editor';

interface EditorJsProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

export function EditorJs(props: EditorJsProps) {
  const [processedContent, setProcessedContent] = useState(props.content);
  
  // Process the content when it changes
  useEffect(() => {
    // Try to determine if the content is HTML or JSON
    const isHTML = props.content && props.content.includes('<') && props.content.includes('>');
    const isJSON = props.content && 
      ((props.content.startsWith('{') && props.content.endsWith('}')) ||
       (props.content.startsWith('[') && props.content.endsWith(']')));
    
    if (isHTML) {
      // Keep HTML content as is
      setProcessedContent(props.content);
    } else if (isJSON) {
      try {
        // Try to parse the JSON and extract any text content
        const parsed = JSON.parse(props.content);
        
        // Handle EditorJS format
        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          const textContent = parsed.blocks
            .map((block: any) => {
              if (block.type === 'paragraph' && block.data && block.data.text) {
                return block.data.text;
              } else if (block.type === 'header' && block.data && block.data.text) {
                const level = block.data.level || 2;
                return `<h${level}>${block.data.text}</h${level}>`;
              }
              return '';
            })
            .filter(Boolean)
            .join('\n\n');
          
          setProcessedContent(textContent);
        } else {
          // Not EditorJS format, just use the content as is
          setProcessedContent(props.content);
        }
      } catch (e) {
        // If JSON parsing fails, use the content as is
        setProcessedContent(props.content);
      }
    } else {
      // Not HTML or JSON, use as is
      setProcessedContent(props.content);
    }
  }, [props.content]);
  
  // Handle content changes
  const handleChange = (newContent: string) => {
    props.onChange(newContent);
  };
  
  // If it's HTML content and in readonly mode, render it directly
  if (props.readOnly && processedContent && processedContent.includes('<')) {
    return (
      <div 
        className={`html-content-viewer ${props.className || ''}`}
        dangerouslySetInnerHTML={{ __html: processedContent }}
        style={{
          padding: '1rem',
          border: '1px solid #e2e8f0',
          borderRadius: '0.375rem',
          backgroundColor: '#fff'
        }}
      />
    );
  }
  
  // Otherwise use the RichTextEditor
  return (
    <RichTextEditor 
      content={processedContent}
      onChange={handleChange}
      readOnly={props.readOnly}
      placeholder={props.placeholder}
      className={props.className}
    />
  );
}