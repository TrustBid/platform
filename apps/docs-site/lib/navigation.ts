export const navigation = [
  { label: "Overview", href: "/docs/overview" },
  { label: "How It Works", href: "/docs/how-it-works" },
  { label: "Architecture", href: "/docs/architecture" },
  { label: "User Roles", href: "/docs/roles" },
  { label: "Features", href: "/docs/features" },
  { label: "Stellar Building Blocks", href: "/docs/building-blocks" },
  { label: "Security", href: "/docs/security" },
  { label: "UI Glossary", href: "/docs/glossary" },
  { label: "Stellar Integrations", href: "/docs/stellar-integrations" },
  { label: "Ecosystem Strategy", href: "/docs/stellar-ecosystem" },
] as const;

export type NavItem = (typeof navigation)[number];

export function getAdjacentPages(href: string) {
  const index = navigation.findIndex((item) => item.href === href);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? navigation[index - 1] : null,
    next: index < navigation.length - 1 ? navigation[index + 1] : null,
  };
}

export interface SearchEntry {
  title: string;
  href: string;
  section?: string;
}

export const searchIndex: SearchEntry[] = [
  { title: "What is TrustBid", href: "/docs/overview" },
  { title: "Start Here", href: "/docs/overview#start-here", section: "Overview" },
  { title: "How It Works", href: "/docs/how-it-works" },
  { title: "The foundation registers", href: "/docs/how-it-works#step-1-the-foundation-registers", section: "How It Works" },
  { title: "Full role flow", href: "/docs/how-it-works#full-role-flow", section: "How It Works" },
  { title: "Architecture", href: "/docs/architecture" },
  { title: "Tech stack by layer", href: "/docs/architecture#tech-stack-by-layer", section: "Architecture" },
  { title: "System layers", href: "/docs/architecture#system-layers", section: "Architecture" },
  { title: "Multi-tenant data isolation", href: "/docs/architecture#multi-tenant-data-isolation", section: "Architecture" },
  { title: "User Roles", href: "/docs/roles" },
  { title: "Foundation Admin", href: "/docs/roles#foundation-admin", section: "User Roles" },
  { title: "Area Coordinator", href: "/docs/roles#area-coordinator", section: "User Roles" },
  { title: "Donor", href: "/docs/roles#donor-read-only", section: "User Roles" },
  { title: "Permissions matrix", href: "/docs/roles#permissions-matrix", section: "User Roles" },
  { title: "Features", href: "/docs/features" },
  { title: "Area accounts with assigned budget", href: "/docs/features#area-accounts-with-assigned-budget", section: "Features" },
  { title: "Fiat off-ramp", href: "/docs/features#fiat-off-ramp", section: "Features" },
  { title: "Stellar Building Blocks", href: "/docs/building-blocks" },
  { title: "Stellar Disbursement Platform", href: "/docs/building-blocks#stellar-disbursement-platform-sdp", section: "Building Blocks" },
  { title: "Privy", href: "/docs/building-blocks#privy-embedded-wallets", section: "Building Blocks" },
  { title: "Security", href: "/docs/security" },
  { title: "Key custody", href: "/docs/security#key-custody-aws-kms", section: "Security" },
  { title: "Privacy by design", href: "/docs/security#privacy-by-design", section: "Security" },
  { title: "UI Glossary", href: "/docs/glossary" },
  { title: "Why this matters", href: "/docs/glossary#why-this-matters", section: "UI Glossary" },
  { title: "Stellar Integrations", href: "/docs/stellar-integrations" },
  { title: "Integration map", href: "/docs/stellar-integrations#2-integration-map", section: "Stellar Integrations" },
  { title: "Identity and anti-impersonation", href: "/docs/stellar-integrations#3-identity-and-anti-impersonation", section: "Stellar Integrations" },
  { title: "Phased roadmap", href: "/docs/stellar-integrations#9-phased-roadmap", section: "Stellar Integrations" },
  { title: "Ecosystem Strategy", href: "/docs/stellar-ecosystem" },
  { title: "Attestation layer", href: "/docs/stellar-ecosystem#2-the-model-attestation-layer", section: "Ecosystem Strategy" },
  { title: "Integration surfaces", href: "/docs/stellar-ecosystem#3-integration-surfaces", section: "Ecosystem Strategy" },
  { title: "Next steps", href: "/docs/stellar-ecosystem#7-next-steps", section: "Ecosystem Strategy" },
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
