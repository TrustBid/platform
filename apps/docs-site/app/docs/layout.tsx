import { ReactNode } from "react";
import DocsLayoutClient from "@/components/docs/DocsLayoutClient";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsLayoutClient>{children}</DocsLayoutClient>;
}
