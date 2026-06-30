import { ReactNode } from "react";
import PrevNextNav from "@/components/docs/PrevNextNav";

interface DocPageContentProps {
  currentHref: string;
  headings?: string[];
  children: ReactNode;
}

export function DocPageContent({
  currentHref,
  children,
}: DocPageContentProps) {
  return (
    <article>
      {children}
      <PrevNextNav currentHref={currentHref} />
    </article>
  );
}
