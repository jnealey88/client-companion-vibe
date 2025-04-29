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
import Image from '@editorjs/image';
import Delimiter from '@editorjs/delimiter';
import Warning from '@editorjs/warning';

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
      if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3' || 
          element.tagName === 'H4' || element.tagName === 'H5' || element.tagName === 'H6') {
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
      } else if (element.tagName === 'DIV' || element.tagName === 'SECTION') {
        // For divs and sections, process their children recursively
        const childBlocks: any[] = [];
        Array.from(element.children).forEach(child => {
          if (child.tagName === 'H1' || child.tagName === 'H2' || child.tagName === 'H3' || 
              child.tagName === 'H4' || child.tagName === 'H5' || child.tagName === 'H6') {
            childBlocks.push({
              type: 'header',
              data: {
                text: child.innerHTML,
                level: parseInt(child.tagName.charAt(1))
              }
            });
          } else if (child.tagName === 'P') {
            childBlocks.push({
              type: 'paragraph',
              data: {
                text: child.innerHTML
              }
            });
          } else if (child.tagName === 'UL' || child.tagName === 'OL') {
            const items = Array.from(child.querySelectorAll('li')).map(li => li.innerHTML);
            childBlocks.push({
              type: 'list',
              data: {
                style: child.tagName === 'OL' ? 'ordered' : 'unordered',
                items: items
              }
            });
          } else if (child.tagName === 'TABLE') {
            const tableData: string[][] = [];
            const rows = child.querySelectorAll('tr');
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
              childBlocks.push({
                type: 'table',
                data: {
                  content: tableData
                }
              });
            }
          } else {
            childBlocks.push({
              type: 'paragraph',
              data: {
                text: child.outerHTML
              }
            });
          }
        });
        
        // Add all child blocks to the main blocks array
        blocks.push(...childBlocks);
        
        // If no child blocks were created, add the div as a paragraph
        if (childBlocks.length === 0) {
          blocks.push({
            type: 'paragraph',
            data: {
              text: element.outerHTML
            }
          });
        }
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
          case 'delimiter':
            htmlContent += '<hr class="ce-delimiter" />';
            break;
          case 'warning':
            htmlContent += `<div class="cdx-warning">
              <div class="cdx-warning__title">${block.data.title}</div>
              <div class="cdx-warning__message">${block.data.message}</div>
            </div>`;
            break;
          case 'image':
            const caption = block.data.caption ? `<figcaption>${block.data.caption}</figcaption>` : '';
            htmlContent += `<figure class="image-tool">
              <img src="${block.data.file.url}" alt="${block.data.caption || 'Image'}" />
              ${caption}
            </figure>`;
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
        levels: [1, 2, 3, 4, 5, 6], // Support all header levels
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
    delimiter: {
      class: Delimiter,
    },
    warning: {
      class: Warning,
      inlineToolbar: true,
      config: {
        titlePlaceholder: 'Title',
        messagePlaceholder: 'Message',
      },
    },
    image: {
      class: Image,
      config: {
        uploader: {
          // This uploader doesn't really upload, just converts image to base64
          uploadByFile(file: File) {
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = function(event) {
                resolve({
                  success: 1,
                  file: {
                    url: event.target?.result
                  }
                });
              };
              reader.readAsDataURL(file);
            });
          }
        }
      }
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

  // Add some styling for better visual representation of blocks
  useEffect(() => {
    // Add CSS to properly style the editor blocks
    const css = `
      .editor-js-wrapper h1 {
        font-size: 2.5rem;
        font-weight: bold;
        margin-top: 1.5rem;
        margin-bottom: 1rem;
      }
      .editor-js-wrapper h2 {
        font-size: 2rem;
        font-weight: bold;
        margin-top: 1.5rem;
        margin-bottom: 1rem;
      }
      .editor-js-wrapper h3 {
        font-size: 1.75rem;
        font-weight: bold;
        margin-top: 1.25rem;
        margin-bottom: 0.75rem;
      }
      .editor-js-wrapper h4 {
        font-size: 1.5rem;
        font-weight: bold;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
      }
      .editor-js-wrapper h5, .editor-js-wrapper h6 {
        font-size: 1.25rem;
        font-weight: bold;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
      }
      .editor-js-wrapper table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
      }
      .editor-js-wrapper th, .editor-js-wrapper td {
        border: 1px solid #ddd;
        padding: 8px;
      }
      .editor-js-wrapper th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .editor-js-wrapper ul, .editor-js-wrapper ol {
        margin: 1rem 0;
        padding-left: 2rem;
      }
      .editor-js-wrapper blockquote {
        margin: 1rem 0;
        padding: 0.5rem 1rem;
        border-left: 4px solid #ddd;
        background-color: #f9f9f9;
        font-style: italic;
      }
      .editor-js-wrapper .ce-block__content {
        max-width: 95%;
        margin: 0 auto;
        padding: 0 25px;
      }
      .editor-js-wrapper .ce-toolbar__content {
        max-width: 95%;
        padding: 0 25px;
      }
      .editor-js-wrapper .ce-header {
        font-weight: bold;
        position: relative;
        padding-top: 10px;
        padding-bottom: 10px;
      }
      .editor-js-wrapper .ce-header--h1 {
        font-size: 2.5rem;
      }
      .editor-js-wrapper .ce-header--h2 {
        font-size: 2rem;
      }
      .editor-js-wrapper .ce-header--h3 {
        font-size: 1.75rem;
      }
      /* Fix toolbar alignment */
      .editor-js-wrapper .ce-toolbar__actions {
        top: 50%;
        transform: translateY(-50%);
      }
      .editor-js-wrapper .ce-toolbar__plus {
        left: -25px;
      }
      /* Add spacing between blocks */
      .editor-js-wrapper .ce-block {
        margin-bottom: 10px;
      }
      .editor-js-wrapper .ce-delimiter {
        line-height: 1.6em;
        width: 100%;
        text-align: center;
      }
      .editor-js-wrapper .ce-delimiter:before {
        display: inline-block;
        content: "***";
        font-size: 30px;
        line-height: 65px;
        height: 30px;
        letter-spacing: 0.2em;
      }
      .editor-js-wrapper .cdx-warning {
        position: relative;
        padding: 20px;
        background: #fffcd3;
        border-radius: 8px;
        margin-bottom: 15px;
      }
      .editor-js-wrapper .cdx-warning__title {
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 10px;
      }
      .editor-js-wrapper .cdx-warning__message {
        font-size: 16px;
      }
      .editor-js-wrapper .image-tool {
        margin: 15px 0;
      }
      .editor-js-wrapper .image-tool img {
        max-width: 100%;
        border-radius: 8px;
      }
      .editor-js-wrapper .image-tool figcaption {
        text-align: center;
        font-style: italic;
        color: #6c757d;
        margin-top: 8px;
      }
    `;
    
    // Create a style element and append it to the head
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    
    // Cleanup on unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
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