import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import './tiptap-editor-styles.css';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

export function TiptapEditor({
  content = '',
  onChange,
  className = '',
  readOnly = false,
  placeholder = 'Start writing...'
}: TiptapEditorProps) {
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      BulletList,
      OrderedList,
    ],
    content: processContent(content),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg mx-auto focus:outline-none',
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      // When the editor content changes, notify the parent
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Process the input content to ensure it's HTML
  function processContent(inputContent: string): string {
    if (!inputContent) {
      return '';
    }

    // If content appears to be JSON (like EditorJS output)
    if (inputContent.trim().startsWith('{') && inputContent.trim().endsWith('}')) {
      try {
        const parsedContent = JSON.parse(inputContent);
        
        // If it's EditorJS format with blocks
        if (parsedContent.blocks && Array.isArray(parsedContent.blocks)) {
          let htmlContent = '';
          
          parsedContent.blocks.forEach((block: any) => {
            if (block.type === 'header') {
              const level = block.data.level || 2;
              htmlContent += `<h${level}>${block.data.text}</h${level}>`;
            } else if (block.type === 'paragraph') {
              htmlContent += `<p>${block.data.text}</p>`;
            } else if (block.type === 'list') {
              const listTag = block.data.style === 'ordered' ? 'ol' : 'ul';
              htmlContent += `<${listTag}>`;
              block.data.items.forEach((item: string) => {
                htmlContent += `<li>${item}</li>`;
              });
              htmlContent += `</${listTag}>`;
            } else if (block.type === 'quote') {
              htmlContent += `<blockquote>${block.data.text}</blockquote>`;
            } else if (block.type === 'code') {
              htmlContent += `<pre><code>${block.data.code}</code></pre>`;
            } else if (block.data && block.data.text) {
              htmlContent += block.data.text;
            }
          });
          
          return htmlContent;
        }
        
        // Not EditorJS format, return the stringified JSON as code
        return `<pre><code>${JSON.stringify(parsedContent, null, 2)}</code></pre>`;
      } catch (e) {
        // Not valid JSON, just return as is
        return inputContent;
      }
    }
    
    // Already HTML or plain text
    return inputContent;
  }

  useEffect(() => {
    if (editor) {
      setIsEditorReady(true);
    }
  }, [editor]);

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(processContent(content));
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className={`tiptap-editor-loading ${className}`}>
        <div className="p-4 bg-gray-50 rounded border">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`tiptap-editor-wrapper ${className}`}>
      {/* Simple toolbar for basic formatting */}
      {!readOnly && (
        <div className="tiptap-toolbar flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-200 rounded-t-md">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
            title="Bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
            title="Italic"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="4" x2="10" y2="4"></line>
              <line x1="14" y1="20" x2="5" y2="20"></line>
              <line x1="15" y1="4" x2="9" y2="20"></line>
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
            title="Underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
              <line x1="4" y1="21" x2="20" y2="21"></line>
            </svg>
          </button>
          
          <span className="border-r border-gray-300 mx-1"></span>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
            title="Heading 2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 4v16M17 4v16M3 8h4M14 8h4M3 12h18M3 16h4M14 16h4"></path>
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
            title="Heading 3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 4v16M17 4v16M3 8h4M14 8h4M3 12h18M3 16h4M14 16h4"></path>
            </svg>
          </button>
          
          <span className="border-r border-gray-300 mx-1"></span>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
            title="Bullet List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
            title="Ordered List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="21" y2="6"></line>
              <line x1="10" y1="12" x2="21" y2="12"></line>
              <line x1="10" y1="18" x2="21" y2="18"></line>
              <path d="M4 6h1v4"></path>
              <path d="M4 10h2"></path>
              <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().setHardBreak().run()}
            className="p-1 rounded hover:bg-gray-200"
            title="Line Break"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 8H3"></path>
              <path d="M21 16H3"></path>
              <path d="M3 3v18"></path>
            </svg>
          </button>
        </div>
      )}
      
      <div className={`border ${!readOnly ? 'border-t-0 rounded-b-md' : 'rounded-md'} p-3 min-h-[200px] bg-white`}>
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
    </div>
  );
}
