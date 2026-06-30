import { ReactNode } from "react";
import { slugify } from "@/lib/navigation";

interface DocHeaderProps {
  title: string;
  subtitle?: string;
  tag?: string;
  children?: ReactNode;
}

export default function DocHeader({
  title,
  subtitle,
  tag,
  children,
}: DocHeaderProps) {
  return (
    <header className="mb-8">
      {tag && (
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#2B5BFF]">
          {tag}
        </p>
      )}
      <h1
        id={slugify(title)}
        className="mb-4 text-3xl font-black tracking-tight text-gray-900"
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mb-4 text-[15px] leading-relaxed text-gray-600">{subtitle}</p>
      )}
      {children}
    </header>
  );
}

interface SectionHeadingProps {
  children: string;
  level?: 2 | 3;
}

export function SectionHeading({ children, level = 2 }: SectionHeadingProps) {
  const id = slugify(children);

  if (level === 3) {
    return (
      <h3
        id={id}
        className="mb-2 mt-6 scroll-mt-20 text-base font-semibold text-gray-800"
      >
        {children}
      </h3>
    );
  }

  return (
    <h2
      id={id}
      className="mb-3 mt-10 scroll-mt-20 border-b border-gray-100 pb-2 text-xl font-bold text-gray-900"
    >
      {children}
    </h2>
  );
}

export function DocParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-[15px] leading-relaxed text-gray-600">{children}</p>
  );
}

export function DocList({ items }: { items: string[] }) {
  return (
    <ul className="mb-4 list-disc space-y-2 pl-6 text-[15px] leading-relaxed text-gray-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function BlockQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="my-6 border-l-2 border-gray-200 py-1 pl-5 text-[15px] italic leading-relaxed text-gray-600">
      {children}
    </blockquote>
  );
}
