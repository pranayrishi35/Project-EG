import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function LegalMarkdown({ content }: { content: string }) {
  // Pre-process GitHub alerts to simple bold labels for standard Markdown blockquotes
  const processedContent = content
    .replace(/> \[!WARNING\]/g, '> **WARNING:**')
    .replace(/> \[!IMPORTANT\]/g, '> **IMPORTANT:**')
    .replace(/> \[!CAUTION\]/g, '> **CAUTION:**')
    .replace(/> \[!TIP\]/g, '> **TIP:**')
    .replace(/> \[!NOTE\]/g, '> **NOTE:**');

  return (
    <div className="prose prose-indigo max-w-none 
      prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 
      prose-a:text-indigo-600 hover:prose-a:text-indigo-500
      prose-strong:text-gray-900 prose-strong:font-semibold
      prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/50 prose-blockquote:py-2 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-700
      prose-hr:border-gray-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
