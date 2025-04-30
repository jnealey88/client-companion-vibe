import React, { useEffect, useRef, useState, Suspense } from 'react';
import type { OutputData } from '@editorjs/editorjs';
import './editor-js-styles.css';

// Define the props interface for our EditorJs component
interface EditorJsProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

// The actual EditorJs component that will be exported
export function EditorJs({
  content = '',
  onChange,
  className = '',
  readOnly = false,
  placeholder = 'Start writing...'
}: EditorJsProps) {
  // Essential state
  const editorCore = useRef(null);
  const [editorData, setEditorData] = useState<OutputData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editorTools, setEditorTools] = useState<any>(null);
  
  // Create references to store the dynamically loaded components
  const editorComponentRef = useRef<any>(null);
  
  // Define callbacks before any other effects or conditionals
  const handleInitialize = React.useCallback((instance: any) => {
    editorCore.current = instance;
    setIsReady(true);
  }, []);

  const handleChange = React.useCallback(async () => {
    if (editorCore.current) {
      try {
        console.log("EDITOR DEBUG - handleChange called - saving editor data");
        const savedData = await (editorCore.current as any).save();
        console.log("EDITOR DEBUG - Editor data saved:", savedData);
        
        setEditorData(savedData);
        
        // We're modifying our approach to be more compatible with structured content editors
        // Instead of converting to HTML, we'll pass the full EditorJS JSON structure
        // This preserves rich content better and makes it easier to work with structured data
        
        const editorJsOutput = JSON.stringify(savedData);
        console.log(`EDITOR DEBUG - Returning Editor.js JSON with ${savedData.blocks.length} blocks`);

        // Save the full Editor.js output directly
        onChange(editorJsOutput);
        
        return;
        
        // The HTML conversion code below is kept but not used
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
        
        console.log("EDITOR DEBUG - Converted to HTML:", htmlContent.substring(0, 100) + "...");
        onChange(htmlContent);
      } catch (error) {
        console.error("EDITOR DEBUG - Error in handleChange:", error);
      }
    } else {
      console.error("EDITOR DEBUG - editorCore.current is null in handleChange");
    }
  }, [onChange]);

  // First load all the necessary libraries dynamically
  useEffect(() => {
    const loadEditor = async () => {
      try {
        // Dynamically import the editor
        const reactEditorJS = await import('react-editor-js');
        const { createReactEditorJS } = reactEditorJS;
        const ReactEditorJS = createReactEditorJS();
        
        // Store the editor component in the ref
        editorComponentRef.current = ReactEditorJS;
        
        // Dynamically import all tools
        const [
          Header, List, Paragraph, Quote, Checklist, LinkTool, 
          Table, Delimiter, Warning, Image, Marker, Code, Embed
        ] = await Promise.all([
          import('@editorjs/header').then(m => m.default),
          import('@editorjs/list').then(m => m.default),
          import('@editorjs/paragraph').then(m => m.default),
          import('@editorjs/quote').then(m => m.default),
          import('@editorjs/checklist').then(m => m.default),
          import('@editorjs/link').then(m => m.default),
          import('@editorjs/table').then(m => m.default),
          import('@editorjs/delimiter').then(m => m.default),
          import('@editorjs/warning').then(m => m.default),
          import('@editorjs/image').then(m => m.default),
          import('@editorjs/marker').then(m => m.default),
          import('@editorjs/code').then(m => m.default),
          import('@editorjs/embed').then(m => m.default)
        ]);

        // Configure the tools
        const tools = {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4, 5, 6],
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
              endpoint: '#',
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

        // Set the editor tools
        setEditorTools(tools);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading editor:', error);
      }
    };

    loadEditor();
  }, []); // Empty dependency array means this runs once on mount

  // Initialize editor data from HTML content
  useEffect(() => {
    // Only load content initially or when content changes from outside
    if (isLoaded && (!isReady || (content && !editorData))) {
      console.log("EDITOR DEBUG - Content received:", content?.substring(0, 50) + "...");
      console.log("EDITOR DEBUG - Content type:", typeof content);
      console.log("EDITOR DEBUG - Content length:", content?.length);
      
      try {
        // Check if content is in JSON format (either Editor.js format or any valid JSON)
        if (content && content.startsWith('{') && content.endsWith('}')) {
          console.log("EDITOR DEBUG - Detected JSON format content");
          
          // Parse the content as JSON
          const parsedContent = JSON.parse(content);
          
          // Check if it's Editor.js format (has blocks array)
          if (parsedContent.blocks) {
            console.log("EDITOR DEBUG - Content is in Editor.js format with", parsedContent.blocks.length, "blocks");
            setEditorData(parsedContent);
          } else {
            console.log("EDITOR DEBUG - Content is JSON but not Editor.js format, converting");
            // It's JSON but not Editor.js format, convert it to text and then to blocks
            const jsonString = JSON.stringify(parsedContent, null, 2);
            const blocks = [{
              type: 'code',
              data: {
                code: jsonString,
                language: 'json'
              }
            }];
            
            setEditorData({
              time: new Date().getTime(),
              blocks: blocks,
              version: "2.22.2"
            });
          }
        } else if (content) {
          console.log("EDITOR DEBUG - Content is HTML or plain text, converting to blocks");
          // Content is in HTML format, convert to blocks
          const blocks = convertHtmlToBlocks(content);
          console.log("EDITOR DEBUG - Created", blocks.length, "blocks from HTML content");
          
          setEditorData({
            time: new Date().getTime(),
            blocks: blocks,
            version: "2.22.2"
          });
        } else {
          console.log("EDITOR DEBUG - No content provided, creating empty editor");
        }
      } catch (error) {
        console.error('EDITOR DEBUG - Error parsing editor content:', error);
        
        // Fallback to simple paragraph 
        console.log("EDITOR DEBUG - Using fallback paragraph with content:", (content || '').substring(0, 50) + "...");
        setEditorData({
          time: new Date().getTime(),
          blocks: [
            {
              type: 'paragraph',
              data: {
                text: content || ''
              }
            }
          ],
          version: "2.22.2"
        });
      }
    }
  }, [content, isReady, isLoaded]);

  // Helper function to convert HTML to EditorJS blocks
  const convertHtmlToBlocks = (html: string) => {
    // Clean up any excessive whitespace at the beginning
    const cleanedHtml = html.trim().replace(/^\s+/, '');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanedHtml, 'text/html');
    
    // Track titles to prevent duplicates
    const titleTracker = new Set<string>();
    const blocks: any[] = [];
    
    // Process each element in the body
    Array.from(doc.body.children).forEach((element) => {
      if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3' || 
          element.tagName === 'H4' || element.tagName === 'H5' || element.tagName === 'H6') {
        
        // Check for duplicate headings
        const headingText = element.innerHTML.trim();
        const headingKey = `${element.tagName}-${headingText}`;
        
        // Skip duplicate headings
        if (titleTracker.has(headingKey)) {
          return;
        }
        
        titleTracker.add(headingKey);
        
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
            
            // Check for duplicate headings
            const headingText = child.innerHTML.trim();
            const headingKey = `${child.tagName}-${headingText}`;
            
            // Skip duplicate headings
            if (titleTracker.has(headingKey)) {
              return;
            }
            
            titleTracker.add(headingKey);
            
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

  // Add some styling for better visual representation of blocks
  useEffect(() => {
    // Add CSS to properly style the editor blocks
    const css = `
      .editor-js-wrapper {
        position: relative;
        min-height: 200px;
        height: auto !important;
      }
      
      .editor-js-wrapper .codex-editor {
        position: static;
        height: auto !important;
        min-height: 400px;
      }
      
      .editor-js-wrapper .codex-editor__redactor {
        padding-bottom: 100px !important;
        overflow: visible !important;
      }
      
      .editor-js-wrapper .ce-block {
        max-width: 100% !important;
      }
      
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
        font-style: italic;
      }
      .editor-js-wrapper .ce-delimiter {
        text-align: center;
        margin: 1.5rem 0;
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
      .editor-js-wrapper .ce-toolbar__plus {
        left: -25px;
      }
      /* Add spacing between blocks */
      .editor-js-wrapper .ce-block {
        margin-bottom: 10px;
        padding: 5px 0;
      }
      /* Fix inline toolbar position */
      .editor-js-wrapper .ce-toolbar__actions {
        right: -5px;
      }
      .editor-js-wrapper .ce-toolbar__settings-btn {
        width: 30px;
        height: 30px;
      }
      .editor-js-wrapper .ce-inline-toolbar {
        padding: 6px;
        border-radius: 6px;
        box-shadow: 0 3px 15px -3px rgba(13, 20, 33, 0.13);
      }
      .editor-js-wrapper .ce-settings {
        border-radius: 6px;
        overflow: hidden;
      }
      .editor-js-wrapper .cdx-checklist__item-checkbox {
        cursor: pointer;
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
  
  // Render editor with loading state
  return (
    <div className={`editor-js-wrapper ${className}`}>
      {!isLoaded && (
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
      )}
      
      {isLoaded && editorComponentRef.current && editorTools && editorData && (
        <Suspense fallback={<div>Loading editor...</div>}>
          {React.createElement(editorComponentRef.current, {
            onInitialize: handleInitialize,
            onChange: handleChange,
            tools: editorTools,
            defaultValue: editorData,
            readOnly: readOnly,
            placeholder: placeholder
          })}
        </Suspense>
      )}
    </div>
  );
}