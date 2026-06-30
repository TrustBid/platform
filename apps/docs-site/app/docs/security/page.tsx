import DocHeader, { DocList, DocParagraph, SectionHeading } from "@/components/docs/DocHeader";
import { DocPageContent } from "@/components/docs/DocPageContent";

const PAGE_HREF = "/docs/security";

const TITLE = "Security";

const KMS_DESC =
  "When an area is created, the system generates the Stellar key pair and encrypts the private key in KMS. Only the backend can request decryption to sign transactions. Each signing request is logged in KMS audit logs. Private keys never appear in logs, the database, or code. A Supabase breach does not expose private keys.";

const PRIVACY_DESC =
  "Sensitive data (beneficiaries, contracts, documents) stays off-chain in Supabase. On-chain only: transaction hash + amount + internal payment ID in the MEMO field. Attached receipts are stored in Supabase Storage — only their SHA-256 hash goes to Supabase, not the document content on-chain. The donor can verify document integrity without seeing its contents.";

const APPEND_ONLY_DESC =
  "Recorded payments cannot be modified — only new records are added. Errors are corrected with new entries, never by deleting history. This guarantees non-repudiation and verifiable temporal integrity.";

const RLS_ITEMS = [
  "Row Level Security (RLS) in Supabase ensures every database query is automatically filtered by foundation",
  "Independent Stellar wallets per foundation",
  "Middleware validates the user's JWT token before any operation",
  "No user can access another foundation's data through any route or endpoint",
];

const HEADINGS = [
  "Key custody (AWS KMS)",
  "Privacy by design",
  "Append-only model",
  "Multi-tenant isolation",
];

export default function SecurityPage() {
  return (
    <DocPageContent currentHref={PAGE_HREF} headings={HEADINGS}>
      <DocHeader title={TITLE} />

      <SectionHeading>Key custody (AWS KMS)</SectionHeading>
      <DocParagraph>{KMS_DESC}</DocParagraph>

      <SectionHeading>Privacy by design</SectionHeading>
      <DocParagraph>{PRIVACY_DESC}</DocParagraph>

      <SectionHeading>Append-only model</SectionHeading>
      <DocParagraph>{APPEND_ONLY_DESC}</DocParagraph>

      <SectionHeading>Multi-tenant isolation</SectionHeading>
      <DocList items={RLS_ITEMS} />
    </DocPageContent>
  );
}
