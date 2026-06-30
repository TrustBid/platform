"use client";

import { useState, ReactNode } from "react";

interface CodeBlockProps {
  children: string;
  language?: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({
  children,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-6">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-4 top-4 z-10 rounded px-2 py-1 text-xs font-medium text-gray-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto rounded-xl bg-gray-950 p-5 font-mono text-sm leading-relaxed text-gray-100">
        <code>
          {children.trimEnd().split("\n").map((line, i) => (
            <div key={i}>
              {showLineNumbers && (
                <span className="mr-4 inline-block w-6 select-none text-right text-gray-600">
                  {i + 1}
                </span>
              )}
              {line || " "}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[13px] text-gray-800">
      {children}
    </code>
  );
}
