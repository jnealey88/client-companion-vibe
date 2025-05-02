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
        
        try {
          // This might fail in ES modules environment due to 'require'
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
        } catch (requireError) {
          console.error('Error loading editor due to require not defined:', requireError);
          // Set a flag to indicate we should use fallback
          setIsLoaded(false);
        }
      } catch (error) {
        console.error('Error loading editor:', error);
        // We set isLoaded to false to ensure the UI knows to use a fallback
        setIsLoaded(false);
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
      } else if (element.tagName === 'PRE') {
        // Get the code element
        const codeElement = element.querySelector('code');
        if (codeElement) {
          // Get the language class if it exists
          const languageClass = Array.from(codeElement.classList).find(cl => cl.startsWith('language-'));
          const language = languageClass ? languageClass.replace('language-', '') : '';
          
          blocks.push({
            type: 'code',
            data: {
              code: codeElement.innerHTML,
              language: language
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
        Array.from(element.children).forEach(child => {
          // Process children similar to main processing logic...
          // This is simplified for brevity - in a full implementation
          // you would apply the same rules as above
          
          if (child.tagName === 'P') {
            blocks.push({
              type: 'paragraph',
              data: {
                text: child.innerHTML
              }
            });
          }
          // Process other types as needed...
        });
      }
    });
    
    // If no blocks were created, try to create at least one paragraph from the text
    if (blocks.length === 0 && cleanedHtml) {
      blocks.push({
        type: 'paragraph',
        data: {
          text: cleanedHtml
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
      .editor-js-wrapper table td, .editor-js-wrapper table th {
        border: 1px solid #ddd;
        padding: 8px;
      }
      .editor-js-wrapper table tr:nth-child(even) {
        background-color: #f2f2f2;
      }
      .editor-js-wrapper table th {
        padding-top: 12px;
        padding-bottom: 12px;
        text-align: left;
        background-color: #f8f9fa;
        color: #333;
      }
      .editor-js-wrapper blockquote {
        border-left: 3px solid #ccc;
        margin: 1.5em 0;
        padding: 0.5em 10px;
        quotes: "\201C""\201D""\2018""\2019";
        font-style: italic;
        color: #555;
      }
      .editor-js-wrapper pre {
        background-color: #f4f4f4;
        border-radius: 3px;
        padding: 1em;
        overflow: auto;
      }
      .editor-js-wrapper code {
        font-family: monospace;
      }
      .editor-js-wrapper ul, .editor-js-wrapper ol {
        margin: 1em 0;
        padding-left: 40px;
      }
      .editor-js-wrapper li {
        margin-bottom: 0.5em;
      }
      .editor-js-wrapper .checklist {
        list-style-type: none;
        padding-left: 0;
      }
      .editor-js-wrapper .checklist li {
        display: flex;
        align-items: center;
      }
      .editor-js-wrapper .checklist li:before {
        content: '☐';
        margin-right: 10px;
      }
      .editor-js-wrapper .checklist li.checked:before {
        content: '☑';
      }
      .editor-js-wrapper .image-tool {
        margin: 1rem 0;
      }
      .editor-js-wrapper .image-tool img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 0 auto;
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
  
  // Import the fallback editor when needed
  const FallbackEditor = React.lazy(() => import('./rich-text-editor').then(mod => ({ default: mod.RichTextEditor })));
  
  // Render editor with loading state and fallback
  return (
    <div className={`editor-js-wrapper ${className}`}>
      {!isLoaded && !editorComponentRef.current && (
        <Suspense fallback={
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
        }>
          <FallbackEditor 
            content={content} 
            onChange={onChange} 
            readOnly={readOnly} 
            placeholder={placeholder} 
            className={className} 
          />
        </Suspense>
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