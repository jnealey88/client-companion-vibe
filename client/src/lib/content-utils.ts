/**
 * This file provides utility functions for content conversion and handling
 * to ensure compatibility with different content formats.
 */

/**
 * Convert EditorJS JSON format to HTML
 * This maintains compatibility with any existing content stored in EditorJS format
 */
export function editorJsToHtml(editorJsContent: any): string {
  try {
    // If the content is a string (JSON), parse it
    const content = typeof editorJsContent === 'string' 
      ? JSON.parse(editorJsContent) 
      : editorJsContent;
    
    // Ensure it has blocks
    if (!content.blocks || !Array.isArray(content.blocks)) {
      return '';
    }
    
    // Convert blocks to HTML
    return content.blocks.map((block: any) => {
      if (!block.type || !block.data) {
        return '';
      }
      
      switch (block.type) {
        case 'header':
          const level = block.data.level || 2;
          return `<h${level}>${block.data.text || ''}</h${level}>`;
          
        case 'paragraph':
          return `<p>${block.data.text || ''}</p>`;
          
        case 'list':
          const listTag = block.data.style === 'ordered' ? 'ol' : 'ul';
          const listItems = block.data.items?.map((item: string) => 
            `<li>${item}</li>`
          ).join('') || '';
          return `<${listTag}>${listItems}</${listTag}>`;
          
        case 'table':
          const rows = block.data.content || [];
          const withHeadings = block.data.withHeadings;
          let tableHtml = '<table>';
          
          rows.forEach((row: string[], rowIndex: number) => {
            tableHtml += '<tr>';
            row.forEach((cell: string) => {
              const cellTag = withHeadings && rowIndex === 0 ? 'th' : 'td';
              tableHtml += `<${cellTag}>${cell}</${cellTag}>`;
            });
            tableHtml += '</tr>';
          });
          
          tableHtml += '</table>';
          return tableHtml;
          
        case 'quote':
          const citation = block.data.caption 
            ? `<cite>${block.data.caption}</cite>` 
            : '';
          return `<blockquote>${block.data.text || ''}${citation}</blockquote>`;
          
        case 'code':
          return `<pre><code>${block.data.code || ''}</code></pre>`;
          
        case 'image':
          const caption = block.data.caption 
            ? `<figcaption>${block.data.caption}</figcaption>` 
            : '';
          return `<figure><img src="${block.data.file?.url || block.data.url || ''}" alt="${block.data.caption || 'Image'}"/>${caption}</figure>`;
          
        default:
          // Handle any text content in the data object
          return block.data.text ? `<p>${block.data.text}</p>` : '';
      }
    }).join('');
  } catch (e) {
    console.error('Error converting EditorJS content to HTML:', e);
    // If conversion fails, return an empty string or the original content as text
    return typeof editorJsContent === 'string' ? editorJsContent : '';
  }
}

/**
 * Detect if content is in EditorJS format
 */
export function isEditorJsFormat(content: string): boolean {
  try {
    if (!content.trim().startsWith('{') || !content.trim().endsWith('}')) {
      return false;
    }
    
    const parsed = JSON.parse(content);
    return !!(parsed.blocks && Array.isArray(parsed.blocks));
  } catch (e) {
    return false;
  }
}

/**
 * Process content for display, converting from EditorJS format if needed
 */
export function processContent(content: string): string {
  if (!content) return '';
  
  if (isEditorJsFormat(content)) {
    return editorJsToHtml(content);
  }
  
  // If it's already HTML or plain text, return as is
  return content;
}