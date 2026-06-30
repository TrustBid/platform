import DataTable from "@/components/docs/DataTable";
import DocHeader, {
  DocList,
  DocParagraph,
  SectionHeading,
} from "@/components/docs/DocHeader";
import { DocPageContent } from "@/components/docs/DocPageContent";

const PAGE_HREF = "/docs/stellar-integrations";

const TITLE = "Stellar Integrations";

const INTRO =
  "Technical integration map. Maps each piece of the Stellar ecosystem to TrustBid's core processes: reputation, audit, financial management, donations, and anti-impersonation.";

const STELLAR_FITS_ITEMS = [
  "An immutable, live ledger where every fund leaves a trace — Stellar's ledger (~5s, ~$0.00001 per tx)",
  "A stable asset to move real money without volatility — USDC on Stellar (issued by Circle)",
  "Identity and compliance standards already written (the SEPs) — no need to reinvent KYC/KYB, auth, or ramps",
];

const TRUST_LAYER =
  "The trust layer (badges, proofs, reputation) is built on Soroban — Stellar's smart contract platform.";

const INTEGRATION_HEADERS = [
  "TrustBid need",
  "Stellar piece",
  "Type",
  "Priority",
];
const INTEGRATION_ROWS = [
  [
    "Organization identity + anti-impersonation",
    "SEP-1 (stellar.toml)",
    "Standard",
    "Phase 1",
  ],
  [
    "Login that proves account control",
    "SEP-10 (Web Auth) / SEP-45 (Soroban)",
    "Standard",
    "Phase 1",
  ],
  [
    "KYC of individuals and KYB of organizations",
    "SEP-12 + SEP-9",
    "Standard",
    "Phase 1–2",
  ],
  [
    "Donate from the platform (connect wallet)",
    "Stellar Wallets Kit (SAK)",
    "Library",
    "Phase 1",
  ],
  ["Donation links / QR codes", "SEP-7 (URI scheme)", "Standard", "Phase 1"],
  [
    "Donate with card/fiat → USDC",
    "SEP-24 / SEP-6 (ramps)",
    "Standard",
    "Phase 2",
  ],
  [
    "Reputation: verifiable badges",
    "Soroban SBT (Chaincerts pattern)",
    "Smart contract",
    "Phase 2",
  ],
  [
    "Reputation: prove without exposing data",
    "Soroban ZK (BLS12-381 / Groth16)",
    "Smart contract",
    "Phase 3",
  ],
  [
    "Mass disbursement to beneficiaries",
    "Stellar Disbursement Platform (SDP)",
    "Platform",
    "Phase 2",
  ],
  [
    "Approve/regulate each transfer",
    "SEP-8 (regulated assets)",
    "Standard",
    "Optional",
  ],
  [
    "API payments / AI agents (future)",
    "MPP (Machine Payments Protocol)",
    "Protocol",
    "Exploratory",
  ],
  ["Audit and reports", "Horizon API + ledger data", "API", "Phase 1"],
];

const SEP1_DESC = [
  "The organization publishes a file at https://theirdomain.org/.well-known/stellar.toml declaring their identity, accounts/assets, signing keys, and KYC server URL.",
  "In TrustBid: each verified NGO has their stellar.toml. It links the real domain (controlled by the org) with their Stellar accounts. Impersonation would require controlling the domain — the first anti-fraud barrier.",
];

const SEP10_DESC = [
  "Challenge-response login: the server sends a transaction that only the account owner can sign. Upon signing, the user receives a session token (JWT). Proves account control, not just password knowledge.",
  "In TrustBid: authenticates NGOs and wallets before any sensitive action (viewing funds, issuing badges, requesting KYB). Prerequisite for SEP-12.",
  "SEP-45 is the equivalent for Soroban contract accounts.",
];

const SEP12_DESC = [
  "SEP-9 defines the standard field catalog (person and organization: organization.name, registration, address, etc.). SEP-12 is the API (PUT/GET /customer) to submit and query that information in a structured way. Requires SEP-10.",
  "In TrustBid: we run (or integrate) a KYC_SERVER declared in the stellar.toml. For KYB, we collect SEP-9 organization fields and validate them against a business verification provider (Sumsub, Persona, etc.) or manually in Phase 1. The KYB result feeds directly into the reputation badge (section 4).",
  "Anti-impersonation stack: SEP-1 (domain) + SEP-10 (account control) + SEP-12/KYB (validated business) + reputation SBT (section 4). Four layers.",
];

const SBT_DESC = [
  "An SBT is a non-transferable token tied to an account — ideal for credentials: they cannot be sold or faked, and they are verified by reading the chain without calling the issuing entity.",
  "Reference pattern: Chaincerts already issues verifiable non-transferable certifications via Soroban contracts.",
  "In TrustBid: each time an NGO meets an objective (project milestone, correct fund execution, approved audit), TrustBid issues a badge/ACTA as an SBT to their account. A donor views the account and verifies on-chain which goals were met — they see it, not just believe it.",
];

const ZK_DESC = [
  "Since Protocol 22 (CAP-0059), Soroban includes host functions for the BLS12-381 curve, enabling on-chain verification of zk-SNARKs (Groth16). A reference contract exists (groth16_verifier).",
  'In TrustBid: proving claims without exposing private data. Example: "this project spent within budget and met the funder\'s criteria" can be proven and verified on-chain without publishing sensitive financial detail.',
  "Maturity: Phase 3, after SBT and audit are working.",
];

const SAK_DESC = [
  "Library (@creit.tech/stellar-wallets-kit) that connects all Stellar wallets with a single API: Freighter, xBull, Albedo, Rabet, and WalletConnect.",
  'In TrustBid: "Donate" button → donor connects their wallet → signs USDC transfer to the project. The donation is signed by the donor (verifiable) and on the ledger (traceable).',
];

const SEP7_DESC = [
  "Generates web+stellar:pay?... links and QR codes with preset destination, amount, and memo.",
  "In TrustBid: each campaign/project has its donation link and QR (shareable on social media, email, in person). The memo tags the donation to the correct project — automatic traceability.",
];

const SEP24_DESC = [
  "Allow donating by card or bank transfer (fiat) and receiving USDC via an anchor. SEP-24 is interactive flow (hosted); SEP-6 is programmatic.",
  "In TrustBid: Phase 2, for donors without crypto. We integrate a regional LATAM anchor offering USDC on-ramp.",
];

const MPP_DESC =
  "Payment protocol over HTTP (extends 402 code) designed for AI agents and APIs. Relevant for TrustBid in two future cases: (a) monetizing our data/verification API per query, and (b) AI-initiated donations. Not on the critical path.";

const SDP_DESC = [
  "Open-source platform from the Stellar Development Foundation for mass payments: upload a list of recipients and amounts (up to 10,000 payments per batch) and disburse. Natively integrates SEP-10 and SEP-24.",
  "In TrustBid: when an NGO distributes aid to many beneficiaries (subsidies, scholarships, field payments), we use SDP. Each payment lands on the ledger and feeds directly into audit and reports.",
];

const SEP8_DESC = [
  "The asset issuer approves (or rejects) each transfer via an approval server.",
  "In TrustBid: if a funder requires that funds only reach pre-approved recipients, SEP-8 enforces that rule at the protocol level.",
];

const AUDIT_DESC =
  "Horizon API (and/or Soroban data) exposes the complete transaction history of each account/project, live. In TrustBid: we index the movements of each project and generate certified financial reports, segmented by period. Since the source is the immutable ledger, the report is independently verifiable — auditors can cross-check against the chain.";

const TECH_STACK_HEADERS = ["Layer", "Tool"];
const TECH_STACK_ROWS = [
  ["Base SDK (JS/TS)", "@stellar/stellar-sdk"],
  ["Wallet connection", "@creit.tech/stellar-wallets-kit"],
  ["Smart contracts (SBT, ZK, logic)", "Soroban (Rust) + soroban-examples"],
  ["Auth/KYC server", "Anchor Platform (SEP-10/12/24/6)"],
  ["Disbursements", "stellar-disbursement-platform-backend"],
  ["Agentic payments (future)", "@stellar/mpp"],
  ["Data / audit", "Horizon API"],
];

const PHASE1 =
  "SEP-1 + SEP-10 + Stellar Wallets Kit + SEP-7 + USDC + ledger reading for basic audit. Enables: identity, in-platform donations, traceability.";

const PHASE2 =
  "SEP-12/KYB + SDP (disbursements) + SEP-24 ramps + SBT badges. Enables: KYB, fund distribution, verifiable reputation, fiat donations.";

const PHASE3 =
  "ZK proofs (Soroban BLS12-381) + SEP-8 if a funder requires it. Enables: proving compliance without exposing data.";

const EXPLORATORY = "MPP for monetized API / AI agents.";

const SOURCES = [
  {
    label: "MPP on Stellar",
    href: "https://developers.stellar.org/docs/learn/fundamentals/stellar-ecosystem-protocols/machine-payments",
  },
  {
    label: "Stellar Disbursement Platform",
    href: "https://stellar.org/sdp",
  },
  {
    label: "Stellar Wallets Kit",
    href: "https://github.com/Creit-Tech/Stellar-Wallets-Kit",
  },
  {
    label: "SEP-0012 (KYC API)",
    href: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md",
  },
  {
    label: "SEP-0009 (Standard KYC Fields)",
    href: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0009.md",
  },
  {
    label: "Protocol 22 — BLS12-381",
    href: "https://stellar.org/blog/developers/announcing-protocol-22",
  },
  {
    label: "groth16_verifier",
    href: "https://github.com/stellar/soroban-examples",
  },
  {
    label: "Chaincerts SBT on Soroban",
    href: "https://stellar.org/blog/developers/building-on-soroban",
  },
];

export default function StellarIntegrationsPage() {
  return (
    <DocPageContent currentHref={PAGE_HREF}>
      <DocHeader title={TITLE} />
      <DocParagraph>{INTRO}</DocParagraph>

      <SectionHeading>1. How Stellar fits TrustBid</SectionHeading>
      <p className="mb-4 text-[15px] leading-relaxed text-gray-600">
        TrustBid needs three things that Stellar solves natively:
      </p>
      <DocList items={STELLAR_FITS_ITEMS} />
      <DocParagraph>{TRUST_LAYER}</DocParagraph>

      <SectionHeading>2. Integration map</SectionHeading>
      <DataTable headers={INTEGRATION_HEADERS} rows={INTEGRATION_ROWS} highlightFirstColumn />

      <SectionHeading>3. Identity and anti-impersonation</SectionHeading>
      <SectionHeading level={3}>SEP-1 — stellar.toml</SectionHeading>
      {SEP1_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading level={3}>SEP-10 — Stellar Web Authentication</SectionHeading>
      {SEP10_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading level={3}>SEP-12 + SEP-9 — KYC / KYB</SectionHeading>
      {SEP12_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading>4. Verifiable reputation</SectionHeading>
      <SectionHeading level={3}>Badges as Soulbound Tokens (SBT)</SectionHeading>
      {SBT_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading level={3}>Zero-knowledge proofs on Soroban</SectionHeading>
      {ZK_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading>5. Donations and crowdfunding</SectionHeading>
      <SectionHeading level={3}>Stellar Wallets Kit (SAK)</SectionHeading>
      {SAK_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading level={3}>SEP-7 — Payment URI scheme</SectionHeading>
      {SEP7_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading level={3}>SEP-24 / SEP-6 — Ramps (fiat ↔ USDC)</SectionHeading>
      {SEP24_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading level={3}>MPP — Machine Payments Protocol (exploratory)</SectionHeading>
      <DocParagraph>{MPP_DESC}</DocParagraph>

      <SectionHeading>6. Fund disbursement to beneficiaries</SectionHeading>
      <SectionHeading level={3}>Stellar Disbursement Platform (SDP)</SectionHeading>
      {SDP_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading level={3}>SEP-8 — Regulated Assets (optional)</SectionHeading>
      {SEP8_DESC.map((p) => (
        <DocParagraph key={p}>{p}</DocParagraph>
      ))}

      <SectionHeading>7. Audit and traceability</SectionHeading>
      <DocParagraph>{AUDIT_DESC}</DocParagraph>

      <SectionHeading>8. Tech stack</SectionHeading>
      <DataTable headers={TECH_STACK_HEADERS} rows={TECH_STACK_ROWS} highlightFirstColumn />

      <SectionHeading>9. Phased roadmap</SectionHeading>
      <SectionHeading level={3}>Phase 1 — Trust base and donations</SectionHeading>
      <DocParagraph>{PHASE1}</DocParagraph>

      <SectionHeading level={3}>Phase 2 — Compliance and scale</SectionHeading>
      <DocParagraph>{PHASE2}</DocParagraph>

      <SectionHeading level={3}>Phase 3 — Advanced privacy</SectionHeading>
      <DocParagraph>{PHASE3}</DocParagraph>

      <SectionHeading level={3}>Exploratory</SectionHeading>
      <DocParagraph>{EXPLORATORY}</DocParagraph>

      <SectionHeading>Sources</SectionHeading>
      <ul className="mb-4 list-none space-y-2 pl-0">
        {SOURCES.map((source) => (
          <li key={source.href}>
            <a
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] text-[#2B5BFF] hover:underline"
            >
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </DocPageContent>
  );
}
