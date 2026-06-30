import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite consumir el paquete workspace (TS) directamente desde el dapp.
  transpilePackages: ['@trustbid/stellar-sdk'],
};

export default nextConfig;
