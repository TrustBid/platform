import DataTable from "@/components/docs/DataTable";
import DocHeader, { DocParagraph, SectionHeading } from "@/components/docs/DocHeader";
import { DocPageContent } from "@/components/docs/DocPageContent";

const PAGE_HREF = "/docs/glossary";

const TITLE = "UI Glossary";

const INTRO =
  "TrustBid uses plain operational language throughout the interface. The following terms are avoided entirely to ensure adoption by non-technical teams.";

const GLOSSARY_HEADERS = ["Avoid", "Use instead"];
const GLOSSARY_ROWS = [
  ["Wallet", "Area account"],
  ["USDC / Blockchain", "Available funds"],
  ["Hash / On-chain", "Verification code"],
  ["Smart contract", "(not mentioned — invisible)"],
  ["Stellar / Soroban", "(not mentioned — invisible)"],
  ["Private key", "(not mentioned — invisible)"],
  ["Transaction", "Transfer / Payment"],
  ["Confirm on-chain", "Recorded"],
];

const WHY_IMPORTS =
  "Social organizations do not have technical teams. If a user sees the word \"wallet\" or \"blockchain,\" they abandon the product. Total abstraction of blockchain terminology is what makes adoption possible in the NGO sector.";

const HEADINGS = ["Why this matters"];

export default function GlossaryPage() {
  return (
    <DocPageContent currentHref={PAGE_HREF} headings={HEADINGS}>
      <DocHeader title={TITLE} />
      <DocParagraph>{INTRO}</DocParagraph>

      <DataTable headers={GLOSSARY_HEADERS} rows={GLOSSARY_ROWS} highlightFirstColumn />

      <SectionHeading>Why this matters</SectionHeading>
      <DocParagraph>{WHY_IMPORTS}</DocParagraph>
    </DocPageContent>
  );
}
