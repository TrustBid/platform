import CodeBlock from "@/components/docs/CodeBlock";
import DocHeader, {
  BlockQuote,
  DocList,
  DocParagraph,
  SectionHeading,
} from "@/components/docs/DocHeader";
import { DocPageContent } from "@/components/docs/DocPageContent";
import PermissionsMatrix from "@/components/docs/PermissionsMatrix";

const PAGE_HREF = "/docs/roles";

const TITLE = "User Roles";

const INTRO =
  "TrustBid has one design principle for roles: each user sees exactly what they need to do their job and nothing more.";

const ROLE_TREE = `TrustBid (Platform)
└── Foundation / NGO
    ├── Foundation Admin     -> creates and oversees everything
    ├── Area Coordinator     -> executes payments in their area
    └── Donor (read-only)    -> verifies execution of their fund`;

const ADMIN_CAN_DO = [
  "Create and configure projects and areas with assigned budgets",
  "Invite and assign coordinators per area",
  "View the consolidated dashboard of the entire foundation",
  "View the complete payment history across all areas",
  "Export reports in PDF and CSV by area and date range",
  "See which payments have attached receipts and which do not",
  "Request fiat off-ramp (USDC to local currency)",
  "Share the verification link with donors",
];

const ADMIN_CANNOT_DO = [
  "View data from other foundations",
  "Modify payments already recorded (append-only)",
];

const ADMIN_STORY =
  "As a foundation admin, I want to see the execution status of all my active projects in a single screen, so I can respond to my European donor in less than 10 minutes when they request an update.";

const COORDINATOR_CAN_DO = [
  "View the available balance in their area account",
  "Record a payment (3-field form: beneficiary, concept, category)",
  "Attach a receipt (invoice or photo) — optional",
  "View their own payment history",
  "See whether a payment is confirmed or pending",
];

const COORDINATOR_CANNOT_DO = [
  "View other areas' accounts",
  "View the admin's consolidated dashboard",
  "Export reports",
  "Create new areas or invite users",
];

const COORDINATOR_UX =
  "The payment registration screen must work fully on mobile in 3G. If a payment fails due to connectivity, it queues and retries automatically.";

const COORDINATOR_STORY =
  "As a field coordinator, I want to record a payment to a transport vendor in less than 2 minutes from my phone, without having to keep the invoice on paper.";

const DONOR_MVP =
  "The admin shares the PDF report with verification codes. The donor opens Stellar Expert independently.";

const DONOR_FUTURE =
  "A public URL where the donor can monitor execution in real time without needing an account.";

const DONOR_STORY =
  "As an analyst at a donor organization, I want to independently verify that the funds we transferred are being executed correctly, without waiting for a quarterly report.";

const MATRIX_ROLES = [
  { name: "Admin" },
  { name: "Coordinator" },
  { name: "Donor" },
];

const MATRIX_ACTIONS = [
  "Create project area",
  "Assign budget",
  "Invite coordinators",
  "Record payment",
  "View consolidated dashboard",
  "View area payments",
  "Export report",
  "View traceability portal",
  "Verify txHash on-chain",
  "Request fiat off-ramp",
  "Modify recorded payments",
];

const MATRIX_PERMISSIONS: ("yes" | "no")[][] = [
  ["yes", "no", "no"],
  ["yes", "no", "no"],
  ["yes", "no", "no"],
  ["yes", "yes", "no"],
  ["yes", "no", "no"],
  ["yes", "yes", "no"],
  ["yes", "no", "no"],
  ["yes", "yes", "yes"],
  ["yes", "yes", "yes"],
  ["yes", "no", "no"],
  ["no", "no", "no"],
];

const HEADINGS = [
  "Role map",
  "Foundation Admin",
  "Area Coordinator",
  "Donor (Read-only)",
  "Permissions matrix",
];

export default function RolesPage() {
  return (
    <DocPageContent currentHref={PAGE_HREF} headings={HEADINGS}>
      <DocHeader title={TITLE} />
      <DocParagraph>{INTRO}</DocParagraph>

      <SectionHeading>Role map</SectionHeading>
      <CodeBlock language="text">{ROLE_TREE}</CodeBlock>

      <SectionHeading>Foundation Admin</SectionHeading>
      <DocParagraph>
        The director or coordinator of the foundation. Has full visibility of the project and is accountable to the donor.
      </DocParagraph>
      <p className="mb-2 text-sm font-semibold text-gray-700">What they can do:</p>
      <DocList items={ADMIN_CAN_DO} />
      <p className="mb-2 mt-4 text-sm font-semibold text-gray-700">What they cannot do:</p>
      <DocList items={ADMIN_CANNOT_DO} />
      <BlockQuote>{ADMIN_STORY}</BlockQuote>

      <SectionHeading>Area Coordinator</SectionHeading>
      <DocParagraph>
        The field coordinator or technician who executes spending for a specific project area.
      </DocParagraph>
      <p className="mb-2 text-sm font-semibold text-gray-700">What they can do:</p>
      <DocList items={COORDINATOR_CAN_DO} />
      <p className="mb-2 mt-4 text-sm font-semibold text-gray-700">What they cannot do:</p>
      <DocList items={COORDINATOR_CANNOT_DO} />
      <DocParagraph>
        <strong className="text-gray-800">Critical UX requirement:</strong>{" "}
        {COORDINATOR_UX}
      </DocParagraph>
      <BlockQuote>{COORDINATOR_STORY}</BlockQuote>

      <SectionHeading>Donor (Read-only)</SectionHeading>
      <DocParagraph>The international funder who contributed the funds.</DocParagraph>
      <p className="mb-2 text-sm font-semibold text-gray-700">MVP:</p>
      <DocParagraph>{DONOR_MVP}</DocParagraph>
      <p className="mb-2 text-sm font-semibold text-gray-700">Future (public portal):</p>
      <DocParagraph>{DONOR_FUTURE}</DocParagraph>
      <BlockQuote>{DONOR_STORY}</BlockQuote>

      <SectionHeading>Permissions matrix</SectionHeading>
      <PermissionsMatrix
        actions={MATRIX_ACTIONS}
        roles={MATRIX_ROLES}
        permissions={MATRIX_PERMISSIONS}
      />
    </DocPageContent>
  );
}
