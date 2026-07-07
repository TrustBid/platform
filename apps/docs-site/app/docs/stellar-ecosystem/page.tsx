import CodeBlock from "@/components/docs/CodeBlock";
import DataTable from "@/components/docs/DataTable";
import DocHeader, {
  DocList,
  DocParagraph,
  SectionHeading,
} from "@/components/docs/DocHeader";
import { DocPageContent } from "@/components/docs/DocPageContent";

const PAGE_HREF = "/docs/stellar-ecosystem";

const TITLE = "Ecosystem Strategy";

const INTRO =
  'How TrustBid moves from being an app that verifies NGOs to being trust infrastructure that other projects, protocols, and Stellar developers consume.';

const APP_TO_PROTOCOL = [
  'The tagline says it: "transparency infrastructure." Infrastructure is not used alone — others build on top of it.',
  "TrustBid is not the final destination of the data. It is the source of truth that others query: on-chain record + standard schema + open contracts/SDK/API.",
  "That turns TrustBid from an app into a protocol — and that is where the defensible moat is.",
  "Analogy: on Ethereum, EAS / Verax (Ethereum Attestation Service) are infrastructure that hundreds of apps query. TrustBid can be the impact attestation and fund traceability registry for Stellar. Whoever defines the schema, defines the standard.",
];

const ATTESTATION_DIAGRAM = `+-----------------------------------------------+
|  TrustBid: issues verifiable attestations     |
|  (KYB, completed milestones, executed funds)  |
+----------------------+------------------------+
                       | on-chain, standard schema
+----------------------+------------------------+
|          Public read layer                    |
+------+--------+--------+--------+-------------+
       |        |        |        |
   wallets  anchors   DeFi/   grants/    watchdogs
                    lending   DAOs      auditors`;

const ATTESTATION_INTRO =
  "TrustBid badges/ACTAs (Soulbound Tokens on Soroban) and their proofs live on-chain, with a public and standard schema. That makes them queryable by anyone, without asking TrustBid for permission.";

const CONSUMER_HEADERS = ["Consumer", "How they use TrustBid"];
const CONSUMER_ROWS = [
  [
    "Wallets (Freighter, Lobstr)",
    'Display a native "TrustBid Verified" badge next to the account',
  ],
  [
    "LATAM anchors",
    "Accept TrustBid's KYB for their ramps — reusable KYC",
  ],
  [
    "DeFi / lending (Soroban)",
    "Use the attestation as trust collateral for under-collateralized loans to verified NGOs",
  ],
  [
    "Grants / DAOs",
    "Restrict disbursement to orgs with a TrustBid seal",
  ],
  [
    "Watchdogs / auditors / press",
    "Query the verifiable fund history independently",
  ],
];

const COMPOSABLE_ITEMS = [
  "Attestation registry (public read): verify_org(address) -> Status, get_badges(address)",
  "Milestone escrow: releases funds when a TrustBid attestation confirms a milestone — any crowdfunding/grant plugs in without building their own verification logic",
  "Reusable ZK verifier (Groth16 / BLS12-381): a planned primitive so others could prove compliance without exposing data",
];

const SDK_DESC = [
  'JS SDK + REST/GraphQL — a developer adds "TrustBid Verified" to their app in a few lines. Webhooks when an attestation is issued or revoked.',
  "Monetization with MPP: the API charges per query (pay-per-verification), settled in USDC on Soroban.",
];

const SDP_LAYER = [
  "The Stellar Disbursement Platform moves money outward; no one certifies it arrived and worked. TrustBid is that proof layer.",
  'One-line positioning: "the accountability layer on top of SDP." This is a framing the Stellar Development Foundation understands immediately.',
];

const STANDARD_ITEMS = [
  'Propose a SEP / schema for "impact attestations and fund traceability"',
  "Being the reference implementation = being the standard",
  "Open-source the attestation contracts → developer adoption → TrustBid tooling becomes the ecosystem default",
];

const GTE_SCF =
  "Building a public good for financial transparency in LatAm is exactly what the SDF funds and promotes. Provides funding + distribution + credibility.";

const GTE_PARTNERSHIPS =
  "Integrating the badge in 1–2 wallets and 1 regional anchor creates the first network effect.";

const GTE_COMPLEMENT =
  "Positioning alongside the SDP (not against it) opens the door to direct collaboration with the SDF.";

const MOAT_ITEMS = [
  "Standard: whoever defines the attestation schema wins ecosystem lock-in.",
  "Network effect: every wallet/anchor/protocol that reads TrustBid increases the value of being TrustBid-verified.",
  "Data: the audited fund history is a cumulative asset that is hard to replicate.",
];

const NEXT_STEPS = [
  "Define and publish the attestation schema (fields, version, revocation)",
  "Deploy the attestation registry on Soroban (Testnet) + public read contract",
  "Publish a minimal SDK (verify_org, get_badges) and developer documentation",
  "Get 1 wallet + 1 anchor to display/consume the badge (proof of network)",
  'Apply to SCF with the "accountability layer on top of SDP" framing',
];

const RELATION =
  "Stellar Integrations covers the technical what — SEPs and Stellar tools mapped to TrustBid's processes. This document covers the strategic how — turning those integrations into a layer the ecosystem consumes.";

export default function StellarEcosystemPage() {
  return (
    <DocPageContent currentHref={PAGE_HREF}>
      <DocHeader title={TITLE} />
      <DocParagraph>{INTRO}</DocParagraph>

      <SectionHeading>1. From app to protocol</SectionHeading>
      {APP_TO_PROTOCOL.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading>2. The model — attestation layer</SectionHeading>
      <DocParagraph>{ATTESTATION_INTRO}</DocParagraph>
      <CodeBlock>{ATTESTATION_DIAGRAM}</CodeBlock>

      <SectionHeading>3. Integration surfaces</SectionHeading>
      <SectionHeading level={3}>Attestations as a public good (read layer)</SectionHeading>
      <DataTable headers={CONSUMER_HEADERS} rows={CONSUMER_ROWS} highlightFirstColumn />

      <SectionHeading level={3}>Composable primitives on Soroban</SectionHeading>
      <p className="mb-4 text-[15px] leading-relaxed text-gray-600">
        <em>Roadmap — planned primitives, not yet deployed.</em> Contracts that
        others would call from their own contracts:
      </p>
      <DocList items={COMPOSABLE_ITEMS} />

      <SectionHeading level={3}>SDK + API for developers</SectionHeading>
      {SDK_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading level={3}>Accountability layer on top of SDP</SectionHeading>
      {SDP_LAYER.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading>4. Standard strategy</SectionHeading>
      <DocParagraph>
        Composability requires shared schemas. If TrustBid defines the schema,
        TrustBid becomes the de facto standard.
      </DocParagraph>
      <DocList items={STANDARD_ITEMS} />

      <SectionHeading>5. Go-to-ecosystem</SectionHeading>
      <SectionHeading level={3}>Stellar Community Fund (SCF)</SectionHeading>
      <DocParagraph>{GTE_SCF}</DocParagraph>

      <SectionHeading level={3}>Read partnerships</SectionHeading>
      <DocParagraph>{GTE_PARTNERSHIPS}</DocParagraph>

      <SectionHeading level={3}>Complement, not compete</SectionHeading>
      <DocParagraph>{GTE_COMPLEMENT}</DocParagraph>

      <SectionHeading>6. Defensible moat</SectionHeading>
      <DocList items={MOAT_ITEMS} />

      <SectionHeading>7. Next steps</SectionHeading>
      <ol className="mb-4 list-decimal space-y-2 pl-6 text-[15px] leading-relaxed text-gray-600">
        {NEXT_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <DocParagraph>
        <strong className="text-gray-800">Relation to other docs:</strong>{" "}
        {RELATION}
      </DocParagraph>
    </DocPageContent>
  );
}
