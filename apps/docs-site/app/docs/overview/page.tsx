import Link from "next/link";
import DataTable from "@/components/docs/DataTable";
import DocHeader, { DocParagraph, SectionHeading } from "@/components/docs/DocHeader";
import { DocPageContent } from "@/components/docs/DocPageContent";

const PAGE_HREF = "/docs/overview";

const TITLE = "What is TrustBid";

const INTRO_PARAGRAPHS = [
  "TrustBid is a financial management platform for social foundations and NGOs. It allows organizations to create fund accounts per project area, execute payments from those accounts with context recorded at the moment of each transaction, and automatically generate auditable reports for donors.",
  "Every payment is anchored on the Stellar network with a publicly verifiable hash. Users interact with a standard web application — the blockchain layer is completely invisible.",
];

const OVERVIEW_HEADERS = ["", ""];
const OVERVIEW_ROWS = [
  ["Product", "Financial management and traceability platform for social organizations"],
  ["Blockchain", "Stellar"],
  ["Frontend", "Next.js"],
  ["Backend", "NestJS + Supabase (PostgreSQL)"],
  ["Wallets", "Privy (embedded — invisible to the user)"],
  ["Disbursements", "Stellar Disbursement Platform (SDP)"],
  ["Key custody", "AWS KMS"],
  ["Fiat off-ramp", "Bitso (CO/CR) · Belo / Lemon Cash (AR)"],
  ["Target users", "Foundations, NGOs, international donors, field coordinators"],
  ["Region", "Latin America — Colombia, Costa Rica, Argentina"],
];

const START_HERE_SECTIONS = [
  {
    href: "/docs/how-it-works",
    title: "How It Works",
    description: "The complete payment flow in 6 steps",
  },
  {
    href: "/docs/architecture",
    title: "Architecture",
    description: "Tech stack, layers, and data flow",
  },
  {
    href: "/docs/roles",
    title: "User Roles",
    description: "What each role can see and do",
  },
  {
    href: "/docs/features",
    title: "Features",
    description: "Full feature list",
  },
  {
    href: "/docs/building-blocks",
    title: "Stellar Building Blocks",
    description: "SDP, Privy, and fiat off-ramp",
  },
  {
    href: "/docs/security",
    title: "Security",
    description: "Key custody, privacy, and data isolation",
  },
  {
    href: "/docs/glossary",
    title: "UI Glossary",
    description: "Web3 terms we avoid and their equivalents",
  },
];

const HEADINGS = ["Start Here"];

export default function OverviewPage() {
  return (
    <DocPageContent currentHref={PAGE_HREF} headings={HEADINGS}>
      <DocHeader title={TITLE} tag="Transparency Infrastructure" />

      {INTRO_PARAGRAPHS.map((paragraph) => (
        <DocParagraph key={paragraph}>{paragraph}</DocParagraph>
      ))}

      <DataTable headers={OVERVIEW_HEADERS} rows={OVERVIEW_ROWS} highlightFirstColumn />

      <SectionHeading>Start Here</SectionHeading>
      <div className="grid gap-4 sm:grid-cols-2">
        {START_HERE_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-lg border border-gray-100 p-5 transition-colors hover:border-[#2B5BFF]/30 hover:bg-gray-50"
          >
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#2B5BFF]">
              {section.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{section.description}</p>
          </Link>
        ))}
      </div>
    </DocPageContent>
  );
}
