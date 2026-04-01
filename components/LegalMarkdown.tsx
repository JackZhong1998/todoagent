import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  content: string;
};

export const LegalMarkdown: React.FC<Props> = ({ content }) => {
  return (
    <div className="legal-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl sm:text-[2.5rem] font-semibold tracking-tight text-neutral-950 mt-0 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl sm:text-2xl font-semibold text-neutral-950 mt-12 mb-4 scroll-mt-24">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[17px] font-semibold text-neutral-900 mt-8 mb-3">{children}</h3>
          ),
          p: ({ children }) => <p className="text-[17px] text-neutral-600 leading-relaxed mb-4">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-2 text-[17px] text-neutral-600 mb-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-2 text-[17px] text-neutral-600 mb-4">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed [&>p]:mb-2">{children}</li>,
          hr: () => <hr className="my-10 border-neutral-200" />,
          strong: ({ children }) => <strong className="font-semibold text-neutral-800">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[#0071e3] hover:underline underline-offset-2 break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
