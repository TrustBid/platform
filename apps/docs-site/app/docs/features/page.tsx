import DataTable from "@/components/docs/DataTable";
import DocHeader, { DocList, DocParagraph, SectionHeading } from "@/components/docs/DocHeader";
import { DocPageContent } from "@/components/docs/DocPageContent";

const PAGE_HREF = "/docs/features";

const TITLE = "Features";

const FEATURES = [
  {
    title: "Area accounts with assigned budget",
    body: "The admin creates project areas and assigns a USDC budget to each one. The system generates an independent Stellar wallet per area. The admin sees account names and balances — never wallet addresses or blockchain terminology.",
    criteria:
      "The admin can create an area and see its balance. The system exposes no reference to wallets, Stellar, or USDC.",
  },
  {
    title: "3-field payment form",
    body: (
      <>
        When recording a payment, the coordinator fills in exactly 3 fields:
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Who — Beneficiary (free text with autocomplete)</li>
          <li>What for — Concept (free text, max 120 characters)</li>
          <li>Category — Dropdown with options defined by the admin</li>
        </ol>
        <p className="mt-2">
          Confirmation appears in less than 5 seconds. No field references blockchain.
        </p>
      </>
    ),
  },
  {
    title: "Automatic server-side transaction signing",
    body: "TrustBid signs and submits each transaction to Stellar using custodied keys, without user intervention. A network failure does not block the UI — the payment stays in \"pending\" state and retries automatically.",
  },
  {
    title: "Horizon API indexer",
    body: "A background process that syncs the Stellar network with Supabase every 30 seconds. It captures the txHash, amount, date, and accounts involved for each confirmed transaction, and links the txHash to the payment record via the MEMO field.",
  },
  {
    title: "Administrator dashboard",
    body: (
      <>
        Consolidated view of the foundation for the admin:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Summary of all project accounts with available balance</li>
          <li>Last 10 payments with beneficiary, concept, category, and amount</li>
          <li>Visual indicator for payments without attached receipt</li>
          <li>Quick access to each project area</li>
        </ul>
        <p className="mt-2">
          The screen loads in less than 3 seconds. No blockchain reference in any UI element.
        </p>
      </>
    ),
  },
  {
    title: "Exportable report (PDF and CSV)",
    body: (
      <>
        The admin generates a spending report for an area over a date range. The PDF contains:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Header with foundation name, area, and period</li>
          <li>Table with: date, beneficiary, concept, category, amount, verification code</li>
          <li>Total executed and remaining balance</li>
          <li>Footer: &ldquo;Each payment can be verified at [link to Stellar Expert]&rdquo;</li>
        </ul>
        <p className="mt-2">The report is generated in less than 10 seconds.</p>
      </>
    ),
  },
  {
    title: "Budget control per account",
    body: "The system blocks payments that exceed the available balance in an area account. The coordinator sees a clear message. The admin receives a notification. No transaction reaches Stellar.",
  },
  {
    title: "Optional receipt attachment",
    body: "The coordinator can attach a photo or PDF of an invoice when recording a payment. Payments without a receipt are marked with a visual indicator in the dashboard. The file hash is stored in Supabase — the document does not go on-chain.",
  },
  {
    title: "Per-transaction verification link",
    body: "Each payment in the report and dashboard has a \"Verify\" link that opens Stellar Expert with the original transaction. The donor can verify without having a TrustBid account.",
  },
  {
    title: "Fiat off-ramp",
    body: (
      <>
        When the foundation needs to pay a local vendor in local currency:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Colombia / Costa Rica: Bitso API (USDC to COP / CRC)</li>
          <li>Argentina: Belo or Lemon Cash (USDC to ARS)</li>
        </ul>
        <p className="mt-2">
          The admin enters the destination bank account. In less than 10 minutes the vendor receives in their local currency. The USDC does not leave the wallet if the off-ramp fails.
        </p>
      </>
    ),
  },
];

const RNF_HEADERS = ["Requirement", "Detail"];
const RNF_ROWS = [
  ["Payment confirmation in < 5 seconds", "Web2 UX expectation"],
  ["Private keys never in plain text", "TrustBid custodies real funds"],
  ["Zero Web3 terminology in UI", "Critical for NGO adoption"],
  ["Indexer syncs every 30 seconds", "Updated data without overloading Horizon API"],
  ["Responsive UI — functional on mobile", "Coordinators pay from their phones in the field"],
  ["RLS in Supabase per foundation", "No foundation sees another's data"],
  ["A Stellar failure does not block the UI", "User always sees the last known state"],
];

const HEADINGS = [
  ...FEATURES.map((f) => f.title),
  "Non-functional requirements",
];

export default function FeaturesPage() {
  return (
    <DocPageContent currentHref={PAGE_HREF} headings={HEADINGS}>
      <DocHeader title={TITLE} />

      {FEATURES.map((feature) => (
        <div key={feature.title}>
          <SectionHeading>{feature.title}</SectionHeading>
          <DocParagraph>{feature.body}</DocParagraph>
          {feature.criteria && (
            <p className="my-4 text-sm text-gray-400">
              <strong className="text-gray-800">Acceptance criteria:</strong>{" "}
              {feature.criteria}
            </p>
          )}
        </div>
      ))}

      <SectionHeading>Non-functional requirements</SectionHeading>
      <DataTable headers={RNF_HEADERS} rows={RNF_ROWS} highlightFirstColumn />
    </DocPageContent>
  );
}
