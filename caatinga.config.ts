import { defineConfig } from "@caatinga/core";

export default defineConfig({
  project: "trustbid",
  defaultNetwork: "testnet",
  buildRoot: "./contracts",

  contracts: {
    "fund-tracker": {
      path: "./contracts/contracts/fund-tracker",
      wasm: "./contracts/target/wasm32v1-none/release/fund_tracker.wasm",
    },
    "expense-anchor": {
      path: "./contracts/contracts/expense-anchor",
      wasm: "./contracts/target/wasm32v1-none/release/expense_anchor.wasm",
    },
    "sbt-badge": {
      path: "./contracts/contracts/sbt-badge",
      wasm: "./contracts/target/wasm32v1-none/release/sbt_badge.wasm",
    },
  },

  networks: {
    testnet: {
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
    },
  },

  frontend: {
    framework: "vite-react",
    bindingsOutput: "./packages/soroban-bindings/src/generated",
    envFile: "./apps/api/.env.local",
    env: {
      "fund-tracker": "FUND_TRACKER_CONTRACT_ID",
      "expense-anchor": "EXPENSE_ANCHOR_CONTRACT_ID",
      "sbt-badge": "SBT_BADGE_CONTRACT_ID",
      rpcUrl: "STELLAR_RPC_URL",
      networkPassphrase: "STELLAR_NETWORK_PASSPHRASE",
    },
  },

  postDeploy: [
    {
      contract: "fund-tracker",
      method: "initialize",
      args: { admin: "${source.address}" },
    },
    {
      contract: "expense-anchor",
      method: "initialize",
      args: { admin: "${source.address}" },
    },
    {
      contract: "sbt-badge",
      method: "initialize",
      args: { admin: "${source.address}" },
    },
  ],

  postDeployRead: [
    {
      contract: "fund-tracker",
      method: "get_allocation",
      args: { project_id: "ab" },
      kind: "read",
      expect: { matcher: "equals", value: "null" },
    },
    {
      contract: "expense-anchor",
      method: "get_expense",
      args: { expense_id: "ab" },
      kind: "read",
      expect: { matcher: "equals", value: "null" },
    },
    {
      contract: "sbt-badge",
      method: "get_badges",
      args: { organization: "${source.address}" },
      kind: "read",
      expect: { matcher: "isArray" },
    },
  ],

  smoke: {
    reads: [
      { contract: "fund-tracker", method: "get_allocation", args: { project_id: "ab" }, expect: { matcher: "equals", value: "null" } },
      { contract: "expense-anchor", method: "get_expense", args: { expense_id: "ab" }, expect: { matcher: "equals", value: "null" } },
      { contract: "sbt-badge", method: "get_badges", args: { organization: "${source.address}" }, expect: { matcher: "isArray" } },
    ],
  },
});
