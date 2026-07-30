import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite consumir el paquete workspace (TS) directamente desde el dapp.
  transpilePackages: ['@trustbid/stellar-sdk'],
  // OpenNext → Cloudflare Workers no cablea el optimizador /_next/image, así que
  // `<Image>` rompía al intentar optimizar (logo del dashboard, posters, etc.).
  // Servimos las imágenes importadas sin optimizar para que carguen en cualquier host.
  images: { unoptimized: true },
};

export default nextConfig;
