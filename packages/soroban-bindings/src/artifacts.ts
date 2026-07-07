import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ContractIds = {
  fundTracker: string;
  expenseAnchor: string;
  sbtBadge: string;
};

type ArtifactsFile = {
  networks?: Record<
    string,
    { contracts?: Record<string, { contractId?: string }> }
  >;
};

function loadArtifacts(): ArtifactsFile | null {
  const path = join(__dirname, "../../../caatinga.artifacts.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ArtifactsFile;
  } catch {
    return null;
  }
}

export function getContractIdsFromArtifacts(
  network: string = "testnet",
): ContractIds | null {
  const artifacts = loadArtifacts();
  const net = artifacts?.networks?.[network];
  if (!net?.contracts) return null;
  const ft = net.contracts["fund-tracker"]?.contractId;
  const ea = net.contracts["expense-anchor"]?.contractId;
  const sb = net.contracts["sbt-badge"]?.contractId;
  if (!ft || !ea || !sb) return null;
  return { fundTracker: ft, expenseAnchor: ea, sbtBadge: sb };
}
