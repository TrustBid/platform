// Re-exports populated by `npm run contracts:generate` (Caatinga).
export * as FundTracker from "./generated/fund-tracker/src/index";
export * as ExpenseAnchor from "./generated/expense-anchor/src/index";
export * as SbtBadge from "./generated/sbt-badge/src/index";

export {
  getContractIdsFromArtifacts,
  type ContractIds,
} from "./artifacts";
