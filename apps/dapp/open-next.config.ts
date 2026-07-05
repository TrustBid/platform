import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Configuración OpenNext → Cloudflare Workers para la dapp (Next.js dinámica:
// route handlers /api/public/*, Privy, Stellar wallets → requiere SSR worker).
// Caches en "dummy" por ahora (sin ISR/R2). Migrar a R2/KV cuando haga falta.
export default defineCloudflareConfig({});
