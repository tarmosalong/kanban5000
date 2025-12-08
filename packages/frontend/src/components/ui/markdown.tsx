'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-sm prose-invert max-w-none
      prose-headings:text-white prose-headings:font-semibold prose-headings:border-b prose-headings:border-white/10 prose-headings:pb-2
      prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
      prose-p:text-slate-300 prose-p:leading-relaxed
      prose-a:text-primary-400 prose-a:no-underline hover:prose-a:text-primary-300 hover:prose-a:underline
      prose-code:text-primary-300 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
      prose-blockquote:border-l-primary-500 prose-blockquote:text-slate-400 prose-blockquote:bg-white/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
      prose-ul:text-slate-300 prose-ol:text-slate-300
      prose-li:marker:text-slate-500
      prose-strong:text-white
      prose-hr:border-white/10
      prose-table:border prose-table:border-white/10
      prose-th:bg-white/5 prose-th:border prose-th:border-white/10 prose-th:px-3 prose-th:py-2
      prose-td:border prose-td:border-white/10 prose-td:px-3 prose-td:py-2
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 rounded border-slate-500 bg-white/5 text-primary-500 focus:ring-primary-500/50"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
