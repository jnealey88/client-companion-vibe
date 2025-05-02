import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
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
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Button } from './button';
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

  // Initialize TipTap editor with enhanced visual capabilities
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
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
      // Enhanced visual capabilities
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
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
      {/* Bubble menu that appears when text is selected */}
      {editor && !readOnly && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="bg-white shadow-lg border border-gray-200 rounded-md flex gap-1 p-1"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="4" x2="10" y2="4"></line>
              <line x1="14" y1="20" x2="5" y2="20"></line>
              <line x1="15" y1="4" x2="9" y2="20"></line>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
              <line x1="4" y1="21" x2="20" y2="21"></line>
            </svg>
          </button>
          <span className="border-r border-gray-300 mx-1"></span>
          <button
            onClick={() => {
              const url = window.prompt('Enter the URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </button>
        </BubbleMenu>
      )}

      {/* Floating menu that appears when the editor is empty */}
      {editor && !readOnly && (
        <FloatingMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="bg-white shadow-lg border border-gray-200 rounded-md py-2 px-1 flex flex-col gap-1"
        >
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="px-3 py-1 hover:bg-gray-100 rounded text-left flex items-center"
          >
            <span className="font-bold mr-2">H1</span> Heading 1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="px-3 py-1 hover:bg-gray-100 rounded text-left flex items-center"
          >
            <span className="font-bold mr-2">H2</span> Heading 2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="px-3 py-1 hover:bg-gray-100 rounded text-left flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            Bullet List
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="px-3 py-1 hover:bg-gray-100 rounded text-left flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Quote
          </button>
        </FloatingMenu>
      )}
      
      {/* Enhanced toolbar with visual editing features */}
      {!readOnly && (
        <div className="tiptap-toolbar flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-200 rounded-t-md">
          {/* Text formatting group */}
          <div className="flex gap-1 mr-2">
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
          </div>
          
          <span className="border-r border-gray-300 mx-1"></span>
          
          {/* Headings group */}
          <div className="flex gap-1 mr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
              title="Heading 1"
            >
              <span className="font-bold text-xs">H1</span>
            </button>
            
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
              title="Heading 2"
            >
              <span className="font-bold text-xs">H2</span>
            </button>
            
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}`}
              title="Heading 3"
            >
              <span className="font-bold text-xs">H3</span>
            </button>
          </div>
          
          <span className="border-r border-gray-300 mx-1"></span>
          
          {/* Lists group */}
          <div className="flex gap-1 mr-2">
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
          </div>
          
          <span className="border-r border-gray-300 mx-1"></span>
          
          {/* Table controls */}
          <div className="flex gap-1 mr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              className="p-1 rounded hover:bg-gray-200"
              title="Insert Table"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
              </svg>
            </button>
            
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className={`p-1 rounded hover:bg-gray-200 ${!editor.can().addColumnBefore() ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Add Column Before"
              disabled={!editor.can().addColumnBefore()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h18v18H3z"></path>
                <path d="M9 3v18"></path>
                <path d="M6 12h6"></path>
                <path d="M9 9v6"></path>
              </svg>
            </button>
            
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className={`p-1 rounded hover:bg-gray-200 ${!editor.can().deleteTable() ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Delete Table"
              disabled={!editor.can().deleteTable()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
                <line x1="4" y1="4" x2="20" y2="20"></line>
              </svg>
            </button>
          </div>
          
          <span className="border-r border-gray-300 mx-1"></span>
          
          {/* Image upload */}
          <div className="flex gap-1 mr-2">
            <button
              type="button"
              onClick={() => {
                const url = window.prompt('Enter the URL of the image:');
                if (url) {
                  editor.chain().focus().setImage({ src: url }).run();
                }
              }}
              className="p-1 rounded hover:bg-gray-200"
              title="Insert Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
          </div>
          
          <span className="border-r border-gray-300 mx-1"></span>
          
          {/* Advanced formatting */}
          <div className="flex gap-1 mr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
              title="Blockquote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
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
            
            <button
              type="button"
              onClick={() => {
                const url = window.prompt('Enter the URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              className={`p-1 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
              title="Add Link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
            
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className={`p-1 rounded hover:bg-gray-200 ${!editor.isActive('link') ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!editor.isActive('link')}
              title="Remove Link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className={`border ${!readOnly ? 'border-t-0 rounded-b-md' : 'rounded-md'} p-3 min-h-[200px] bg-white`}>
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
    </div>
  );
}
