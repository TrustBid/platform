import CodeBlock from "@/components/docs/CodeBlock";
import DataTable from "@/components/docs/DataTable";
import DocHeader, { DocParagraph, SectionHeading } from "@/components/docs/DocHeader";
import { DocPageContent } from "@/components/docs/DocPageContent";

const PAGE_HREF = "/docs/building-blocks";

const TITLE = "Stellar Building Blocks";

const INTRO = "TrustBid integrates three building blocks from the Stellar ecosystem.";

const SDP_DESC =
  "SDP manages traceable USDC disbursements to multiple wallets.";
const SDP_USAGE =
  "Each project area maps to a disbursement group in SDP. Each area coordinator maps to a receiver. The NestJS API orchestrates SDP to trigger each disbursement, propagating the foundation ID in every call to maintain multi-tenant isolation.";

const PRIVY_DESC =
  "Privy generates wallets automatically when a user creates an account by email — without the user seeing any crypto interface.";
const PRIVY_USAGE =
  "The area coordinator signs up with only their email. Privy automatically generates their embedded wallet. That wallet's public address becomes the disbursement destination in SDP. The coordinator never sees the words \"wallet,\" \"private key,\" or \"Stellar.\"";

const OFFRAMP_DESC =
  "Converts USDC to local currency (COP, CRC, ARS) directly to the vendor's bank account.";
const OFFRAMP_USAGE =
  "The admin requests a local payment, the system requests a quote, the admin confirms, USDC leaves the area wallet, and the vendor receives payment in their bank within 10 minutes. The SEP protocols used: SEP-10 (auth), SEP-12 (KYC), SEP-38 (quote), SEP-6/24 (withdrawal).";

const COMPOSITION_DIAGRAM = `Donor -> [USDC on-chain] -> Foundation master wallet
                                    |
                       SDP disbursement -> Area wallet (Privy)
                                    |
                  Coordinator records payment (3 fields)
                                    |
                  NestJS signs tx -> Stellar Network
                                    |
                  Horizon indexer captures txHash
                                    |
                  Admin dashboard updated
                                    | (if fiat needed)
                  Off-ramp Anchor -> Vendor bank account (COP/CRC/ARS)`;

const COMPARE_HEADERS = ["Dimension", "Ethereum", "Stellar"];
const COMPARE_ROWS = [
  ["Transaction speed", "Minutes", "~5 seconds"],
  ["Cost per tx", "$2–50", "$0.00001"],
  ["Native USDC", "Via bridges", "Native"],
  ["LATAM off-ramp", "Limited", "MoneyGram, Bitso"],
];

const HEADINGS = [
  "Stellar Disbursement Platform (SDP)",
  "Privy (Embedded Wallets)",
  "Fiat Off-ramp Anchor (Bitso / Belo)",
  "Full composition flow",
  "Why Stellar and not Ethereum",
];

export default function BuildingBlocksPage() {
  return (
    <DocPageContent currentHref={PAGE_HREF} headings={HEADINGS}>
      <DocHeader title={TITLE} />
      <DocParagraph>{INTRO}</DocParagraph>

      <SectionHeading>Stellar Disbursement Platform (SDP)</SectionHeading>
      <DocParagraph>{SDP_DESC}</DocParagraph>
      <DocParagraph>
        <strong className="text-gray-800">How TrustBid uses it:</strong>{" "}
        {SDP_USAGE}
      </DocParagraph>

      <SectionHeading>Privy (Embedded Wallets)</SectionHeading>
      <DocParagraph>{PRIVY_DESC}</DocParagraph>
      <DocParagraph>
        <strong className="text-gray-800">How TrustBid uses it:</strong>{" "}
        {PRIVY_USAGE}
      </DocParagraph>

      <SectionHeading>Fiat Off-ramp Anchor (Bitso / Belo)</SectionHeading>
      <DocParagraph>{OFFRAMP_DESC}</DocParagraph>
      <DocParagraph>
        <strong className="text-gray-800">How TrustBid uses it:</strong>{" "}
        {OFFRAMP_USAGE}
      </DocParagraph>

      <SectionHeading>Full composition flow</SectionHeading>
      <CodeBlock language="text">{COMPOSITION_DIAGRAM}</CodeBlock>

      <SectionHeading>Why Stellar and not Ethereum</SectionHeading>
      <DataTable headers={COMPARE_HEADERS} rows={COMPARE_ROWS} />
    </DocPageContent>
  );
}
