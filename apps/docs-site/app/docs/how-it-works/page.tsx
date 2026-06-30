import CodeBlock from "@/components/docs/CodeBlock";
import DocHeader, { DocParagraph, SectionHeading } from "@/components/docs/DocHeader";
import { DocPageContent } from "@/components/docs/DocPageContent";
import StepList from "@/components/docs/StepList";

const PAGE_HREF = "/docs/how-it-works";

const TITLE = "How It Works";

const INTRO =
  "TrustBid covers the complete lifecycle of a social fund — from receiving donor contributions to generating a verifiable report.";

const STEPS = [
  {
    number: 1,
    title: "The foundation registers",
    body: "The admin creates the foundation in TrustBid. The system automatically generates a master Stellar wallet for the organization. The admin never sees it.",
  },
  {
    number: 2,
    title: "The admin creates project areas",
    body: 'The admin defines the areas of the project (Logistics, Payroll, Programs, etc.) and assigns a USDC budget to each one. TrustBid generates a Stellar sub-wallet per area. The admin sees "Logistics Account — $2,400" and nothing more.',
  },
  {
    number: 3,
    title: "The donor sends funds",
    body: 'The international donor sends USDC directly to the foundation\'s master wallet. No intermediary banks, no conversion friction. The foundation sees "Funds received: $10,000" in their dashboard.',
  },
  {
    number: 4,
    title: "The area coordinator executes a payment",
    body: (
      <>
        The coordinator logs into TrustBid, sees their account balance, and fills in 3 fields:
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Who — Beneficiary (free text with autocomplete from payment history)</li>
          <li>What for — Concept (free text, max 120 characters)</li>
          <li>Category — Label defined by the admin when creating the area</li>
        </ol>
        <p className="mt-2">
          They confirm the payment. In less than 5 seconds: &ldquo;Transfer recorded.&rdquo;
        </p>
      </>
    ),
    note: "In the background: TrustBid signed the transaction on Stellar, submitted it, the indexer captured the txHash, and linked it to the 3 fields the coordinator filled in.",
  },
  {
    number: 5,
    title: "The admin views the dashboard and exports the report",
    body: (
      <>
        The admin sees all project accounts, balances, and the complete payment history with full context. They select a date range and click &ldquo;Export report.&rdquo; In seconds, a PDF is generated containing:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Date and time of each payment</li>
          <li>Beneficiary, concept, and category</li>
          <li>Amount in USDC</li>
          <li>Verification code (the txHash, presented in readable format)</li>
          <li>&ldquo;Verify&rdquo; link that opens Stellar Expert with the original transaction</li>
        </ul>
        <p className="mt-3">
          That PDF is the accountability report for the donor. Independently verifiable. No weeks of manual work.
        </p>
      </>
    ),
  },
  {
    number: 6,
    title: "Fiat payment (when applicable)",
    body: "When the foundation needs to pay a local vendor in Colombian pesos, Costa Rican colones, or Argentine pesos, TrustBid handles the conversion automatically via Bitso (CO/CR) or Belo (AR). The admin enters the destination bank account, and in less than 10 minutes the vendor receives payment in their local currency.",
  },
];

const ROLE_FLOW_DIAGRAM = `INTERNATIONAL DONOR
 |  Transfers USDC to the project
 v
FOUNDATION ADMIN
 |  Creates project + defines areas + assigns budgets
 |  Invites area coordinators
 v
AREA COORDINATOR
 |  Executes payments from their area
 |  Fills in: beneficiary + concept + category
 |  Attaches receipt (optional)
 v
TRUSTBID (automatic, invisible)
 |  Signs and sends tx to Stellar
 |  Captures txHash via Horizon API
 |  Updates the dashboard
 v
FOUNDATION ADMIN
 |  Views real-time dashboard
 |  Exports PDF report
 |  Shares it with the donor
 v
INTERNATIONAL DONOR
 |  Receives the PDF
 |  Verifies the transaction codes on Stellar Expert
 └  Without weeks of waiting. Without Excel. Without review meetings.`;

const HEADINGS = ["Full role flow"];

export default function HowItWorksPage() {
  return (
    <DocPageContent currentHref={PAGE_HREF} headings={HEADINGS}>
      <DocHeader title={TITLE} />
      <DocParagraph>{INTRO}</DocParagraph>
      <StepList steps={STEPS} />
      <SectionHeading>Full role flow</SectionHeading>
      <CodeBlock language="text">{ROLE_FLOW_DIAGRAM}</CodeBlock>
    </DocPageContent>
  );
}
