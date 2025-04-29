import React, { useEffect, useRef, useState } from 'react';
import { createReactEditorJS } from 'react-editor-js';
import { OutputData } from '@editorjs/editorjs';

// Import EditorJS tools (with type assertions to avoid TypeScript errors)
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import Checklist from '@editorjs/checklist';
import LinkTool from '@editorjs/link';
import Table from '@editorjs/table';
import Marker from '@editorjs/marker';
import Code from '@editorjs/code';
import Embed from '@editorjs/embed';

const ReactEditorJS = createReactEditorJS();

interface EditorJsProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

export function EditorJs({
  content = '',
  onChange,
  className = '',
  readOnly = false,
  placeholder = 'Start writing...'
}: EditorJsProps) {
  const editorCore = useRef(null);
  const [editorData, setEditorData] = useState<OutputData | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize editor data from HTML content
  useEffect(() => {
    // Only load content initially or when content changes from outside
    if (!isReady || (content && !editorData)) {
      try {
        if (content.startsWith('{') && content.endsWith('}')) {
          // Content is already in JSON format
          setEditorData(JSON.parse(content));
        } else if (content) {
          // Content is in HTML format, convert to blocks
          const blocks = convertHtmlToBlocks(content);
          setEditorData({
            time: new Date().getTime(),
            blocks: blocks
          });
        }
      } catch (error) {
        console.error('Error parsing editor content:', error);
        
        // Fallback to simple paragraph 
        setEditorData({
          time: new Date().getTime(),
          blocks: [
            {
              type: 'paragraph',
              data: {
                text: content || ''
              }
            }
          ]
        });
      }
    }
  }, [content, isReady]);

  // Helper function to convert HTML to EditorJS blocks
  const convertHtmlToBlocks = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: any[] = [];
    
    // Process each element in the body
    Array.from(doc.body.children).forEach((element) => {
      if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
        blocks.push({
          type: 'header',
          data: {
            text: element.innerHTML,
            level: parseInt(element.tagName.charAt(1))
          }
        });
      } else if (element.tagName === 'P') {
        blocks.push({
          type: 'paragraph',
          data: {
            text: element.innerHTML
          }
        });
      } else if (element.tagName === 'UL' || element.tagName === 'OL') {
        const items = Array.from(element.querySelectorAll('li')).map(li => li.innerHTML);
        blocks.push({
          type: 'list',
          data: {
            style: element.tagName === 'OL' ? 'ordered' : 'unordered',
            items: items
          }
        });
      } else if (element.tagName === 'BLOCKQUOTE') {
        blocks.push({
          type: 'quote',
          data: {
            text: element.innerHTML,
            caption: ''
          }
        });
      } else if (element.tagName === 'TABLE') {
        const tableData: string[][] = [];
        const rows = element.querySelectorAll('tr');
        rows.forEach(row => {
          const rowData: string[] = [];
          const cells = row.querySelectorAll('td, th');
          cells.forEach(cell => {
            rowData.push(cell.innerHTML);
          });
          if (rowData.length > 0) {
            tableData.push(rowData);
          }
        });
        
        if (tableData.length > 0) {
          blocks.push({
            type: 'table',
            data: {
              content: tableData
            }
          });
        }
      } else if (element.tagName === 'DIV' && element.classList.contains('embed')) {
        blocks.push({
          type: 'embed',
          data: {
            embed: element.innerHTML,
            caption: ''
          }
        });
      } else {
        // Default to paragraph for any other element
        blocks.push({
          type: 'paragraph',
          data: {
            text: element.outerHTML
          }
        });
      }
    });
    
    // If no blocks were created, create a default paragraph with the entire HTML content
    if (blocks.length === 0) {
      blocks.push({
        type: 'paragraph',
        data: {
          text: html
        }
      });
    }
    
    return blocks;
  };

  // Handle editor initialization
  const handleInitialize = React.useCallback((instance: any) => {
    editorCore.current = instance;
    setIsReady(true);
  }, []);

  // Handle changes to the editor content
  const handleChange = React.useCallback(async () => {
    if (editorCore.current) {
      const savedData = await (editorCore.current as any).save();
      setEditorData(savedData);
      
      // Convert the saved data back to HTML for compatibility with existing components
      let htmlContent = '';
      savedData.blocks.forEach((block: any) => {
        switch (block.type) {
          case 'header':
            htmlContent += `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
            break;
          case 'paragraph':
            htmlContent += `<p>${block.data.text}</p>`;
            break;
          case 'list':
            const listTag = block.data.style === 'ordered' ? 'ol' : 'ul';
            htmlContent += `<${listTag}>`;
            block.data.items.forEach((item: any) => {
              htmlContent += `<li>${item}</li>`;
            });
            htmlContent += `</${listTag}>`;
            break;
          case 'quote':
            htmlContent += `<blockquote>${block.data.text}</blockquote>`;
            break;
          case 'checklist':
            htmlContent += '<ul class="checklist">';
            block.data.items.forEach((item: any) => {
              htmlContent += `<li class="${item.checked ? 'checked' : ''}">${item.text}</li>`;
            });
            htmlContent += '</ul>';
            break;
          case 'table':
            htmlContent += '<table><tbody>';
            block.data.content.forEach((row: any) => {
              htmlContent += '<tr>';
              row.forEach((cell: any) => {
                htmlContent += `<td>${cell}</td>`;
              });
              htmlContent += '</tr>';
            });
            htmlContent += '</tbody></table>';
            break;
          case 'code':
            htmlContent += `<pre><code class="language-${block.data.language}">${block.data.code}</code></pre>`;
            break;
          case 'embed':
            htmlContent += `<div class="embed">${block.data.embed}</div>`;
            break;
          default:
            // Try to handle text-based blocks generically
            if (block.data && block.data.text) {
              htmlContent += block.data.text;
            }
        }
      });
      
      onChange(htmlContent);
    }
  }, [onChange]);

  // Define available tools
  const EDITOR_JS_TOOLS = {
    header: {
      class: Header,
      inlineToolbar: true,
      config: {
        placeholder: 'Enter a header',
        levels: [1, 2, 3],
        defaultLevel: 2
      }
    },
    list: {
      class: List,
      inlineToolbar: true,
    },
    paragraph: {
      class: Paragraph,
      inlineToolbar: true,
    },
    quote: {
      class: Quote,
      inlineToolbar: true,
      config: {
        quotePlaceholder: 'Enter a quote',
        captionPlaceholder: 'Quote caption',
      },
    },
    checklist: {
      class: Checklist,
      inlineToolbar: true,
    },
    linkTool: {
      class: LinkTool,
      config: {
        endpoint: '#', // We're not using the backend validation for links
      }
    },
    table: {
      class: Table,
      inlineToolbar: true,
      config: {
        rows: 2,
        cols: 3,
      },
    },
    marker: {
      class: Marker,
      inlineToolbar: true,
    },
    code: {
      class: Code,
      config: {
        placeholder: 'Enter code',
      }
    },
    embed: {
      class: Embed,
      config: {
        services: {
          youtube: true,
          vimeo: true,
        }
      }
    }
  };

  return (
    <div className={`editor-js-wrapper ${className}`}>
      {editorData && (
        <ReactEditorJS
          onInitialize={handleInitialize}
          onChange={handleChange}
          tools={EDITOR_JS_TOOLS}
          defaultValue={editorData}
          readOnly={readOnly}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}