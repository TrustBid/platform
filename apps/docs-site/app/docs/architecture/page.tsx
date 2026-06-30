import CodeBlock from "@/components/docs/CodeBlock";
import DataTable from "@/components/docs/DataTable";
import DocHeader, { DocList, SectionHeading } from "@/components/docs/DocHeader";
import { DocPageContent } from "@/components/docs/DocPageContent";

const PAGE_HREF = "/docs/architecture";

const TITLE = "Architecture";

const STACK_HEADERS = ["Layer", "Technology", "Role"];
const STACK_ROWS = [
  ["Frontend", "Next.js (App Router)", "Web2 UI — no crypto terminology"],
  ["Backend / API", "NestJS", "Orchestrates the complete flow"],
  ["Database", "Supabase (PostgreSQL) + RLS", "Payment metadata, users, projects"],
  ["Invisible wallets", "Privy (embedded wallets)", "Wallet per coordinator — email login"],
  ["Disbursements", "Stellar Disbursement Platform (SDP)", "USDC disbursements to area wallets"],
  ["Key custody", "AWS KMS", "Encrypted private keys — never in plain text"],
  ["Blockchain", "Stellar", "Immutable transaction record"],
  ["Indexer", "Horizon API (polling every 30s)", "Syncs on-chain data with Supabase"],
  ["Fiat off-ramp", "Bitso (CO/CR) · Belo / Lemon Cash (AR)", "USDC to local currency"],
  ["File storage", "Supabase Storage", "Attachments (invoices, photos) — off-chain"],
  ["Frontend deploy", "Vercel", ""],
  ["API / workers deploy", "Railway", ""],
  ["Cloud DB", "Neon (Postgres) + Upstash (Redis)", ""],
];

const ARCHITECTURE_DIAGRAM = `+------------------------------------------+
|           FRONTEND (Next.js)             |  <- User sees: accounts, payments, reports
+------------------------------------------+
|            API (NestJS)                  |  <- Orchestrates: SDP, Privy, off-ramp, KMS
+------------+----------+------------------+
|  Supabase  |  AWS KMS |  Horizon Indexer |  <- Data + Keys + On-chain sync
| (off-chain |  (private|  (every 30 sec)  |
|  metadata) |   keys)  |                  |
+------------+----------+------------------+
|         STELLAR NETWORK                  |  <- Immutable txHash record
|   SDP · Privy Wallets · Soroban          |
+------------------------------------------+
|         OFF-RAMP (Bitso / Belo)          |  <- USDC -> COP / CRC / ARS
+------------------------------------------+`;

const ISOLATION_ITEMS = [
  "Row Level Security (RLS) in Supabase — every query is automatically filtered by foundation",
  "Independent Stellar wallets per foundation",
  "Middleware validates the user token before any query",
  "A user from one foundation cannot access data from another under any circumstance",
];

const HEADINGS = [
  "Tech stack by layer",
  "System layers",
  "Multi-tenant data isolation",
];

export default function ArchitecturePage() {
  return (
    <DocPageContent currentHref={PAGE_HREF} headings={HEADINGS}>
      <DocHeader title={TITLE} />

      <SectionHeading>Tech stack by layer</SectionHeading>
      <DataTable headers={STACK_HEADERS} rows={STACK_ROWS} highlightFirstColumn />

      <SectionHeading>System layers</SectionHeading>
      <CodeBlock language="text">{ARCHITECTURE_DIAGRAM}</CodeBlock>

      <SectionHeading>Multi-tenant data isolation</SectionHeading>
      <DocList items={ISOLATION_ITEMS} />
    </DocPageContent>
  );
}
