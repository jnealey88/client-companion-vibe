import React, { useState, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

/**
 * A simple rich text editor component that uses a textarea
 * This acts as a fallback when EditorJS has loading issues
 */
export function RichTextEditor({
  content = '',
  onChange,
  className = '',
  readOnly = false,
  placeholder = 'Start writing...'
}: RichTextEditorProps) {
  const [text, setText] = useState('');

  // Initialize content
  useEffect(() => {
    // Try to parse JSON content if it's from EditorJS
    if (content && content.startsWith('{') && content.endsWith('}')) {
      try {
        const parsedContent = JSON.parse(content);
        if (parsedContent.blocks) {
          // Extract text from blocks
          const extractedText = parsedContent.blocks
            .map((block: any) => {
              if (block.type === 'paragraph') return block.data.text;
              if (block.type === 'header') return `${block.data.text}\n`;
              return block.data.text || '';
            })
            .filter(Boolean)
            .join('\n\n');
          setText(extractedText);
          return;
        }
      } catch (e) {
        console.log('Error parsing editor JSON content', e);
      }
    }
    
    // Fallback to using content as-is
    setText(content);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // If the content was originally in JSON format, try to maintain that structure
    if (content && content.startsWith('{') && content.endsWith('}')) {
      try {
        const originalContent = JSON.parse(content);
        if (originalContent.blocks) {
          // Create a new block structure with the updated text
          const newContent = {
            ...originalContent,
            blocks: [{
              type: 'paragraph',
              data: { text: newText }
            }]
          };
          onChange(JSON.stringify(newContent));
          return;
        }
      } catch (e) {
        console.log('Error updating editor content', e);
      }
    }
    
    // Fallback to plain text
    onChange(newText);
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      <textarea
        value={text}
        onChange={handleChange}
        className="w-full min-h-[300px] p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
