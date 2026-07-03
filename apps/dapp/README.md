# TrustBid dApp

Frontend para TrustBid — plataforma de transparencia y trazabilidad de fondos para ONGs en Stellar.

## Descripción Rápida

- **Framework:** Next.js 15+ (React) con TypeScript
- **Wallet:** Stellar Wallets Kit + Privy (auth/wallet embebida)
- **Blockchain:** Stellar testnet/mainnet via horizon + Soroban
- **Deploy:** Cloudflare Pages (via wrangler)

## Getting Started

### 1. Setup de Variables de Entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus valores:
# - NEXT_PUBLIC_API_URL: URL del backend API
# - NEXT_PUBLIC_PRIVY_APP_ID: App ID de Privy dashboard (opcional, desactiva email login si falta)
# - NEXT_PUBLIC_STELLAR_NETWORK: testnet o public
```

### 2. Instalar Dependencias

```bash
npm install
# o yarn/pnpm install
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/public/       # API routes para portal público
│   ├── dashboard/        # Dashboard autenticado
│   ├── login/            # SEP-10 login flow
│   ├── register/         # Registro de org
│   └── layout.tsx
├── components/           # Componentes React reutilizables
├── hooks/                # Custom React hooks (useCurrentUser, useOrg, etc.)
├── lib/
│   ├── auth/sep10.ts     # SEP-10 challenge/auth
│   ├── config.ts         # Config centralizada (API_URL, STELLAR_NETWORK)
│   ├── wallet/           # Wallet adapter + Stellar SDK
│   └── countries.ts      # Datos estáticos
└── types/                # TypeScript types compartidas
```

## Configuración Clave

### API URL (Centralizado)

Todas las llamadas al backend usan `API_URL` de [`lib/config.ts`](src/lib/config.ts):

```typescript
import { API_URL } from '@/lib/config';
const res = await fetch(`${API_URL}/api/endpoint`);
```

### Wallet Integration

- **Stellar Wallets Kit:** Detecta y maneja múltiples wallets
- **Privy (opcional):** Login con email/OTP para usuarios no-cripto
- **SEP-10:** Challenge-based auth con la wallet del usuario

### Soroban Contracts

Consultas read-only on-chain desde el frontend (sin firmar):

```typescript
import { horizon, contract } from '@stellar/js-sdk';
// Ver src/server/public/repository.ts para servidor-side reads
```

## Build y Deploy

### Build Local

```bash
npm run build
```

### Deploy a Cloudflare Pages

```bash
npm run deploy
# o wrangler deploy
```

**Requiere configuración en Cloudflare:**

```toml
# wrangler.toml
[env.production]
vars = { ENVIRONMENT = "production" }
```

## Variables de Entorno

| Variable | Tipo | Descripción | Ejemplo |
|----------|------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Público | Backend API URL | `https://api.trustbid.com` |
| `BACKEND_URL` | Privado (SSR) | Override server-side | `http://api:3001` |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Público | Privy app ID | `clxxxxx` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Público | testnet o public | `testnet` |
| `NEXT_PUBLIC_HORIZON_URL` | Público | Horizon RPC | `https://horizon-testnet.stellar.org` |

Ver [`.env.example`](.env.example) para configuración completa.

## Problemas Comunes

**❌ "API connection failed"**
- Verificar `NEXT_PUBLIC_API_URL` apunta a backend correcto
- Revisar CORS en backend (debe permitir tu origin)

**❌ "Wallet not detected"**
- Instalar extensión Freighter, Ledger, etc.
- Verificar que el sitio es HTTPS en producción

**❌ "Privy not configured"**
- Opcional — sin PRIVY_APP_ID, el login por email no aparece
- Ver [Privy Dashboard](https://dashboard.privy.io) para crear app

## Desarrollo

### Agregar Componente Nuevo

```bash
# Crear en src/components/
touch src/components/MyComponent.tsx
```

### Agregar Hook Custom

```bash
# Crear en src/hooks/
touch src/hooks/useMyData.ts
```

### Agregar Página

```bash
# Next.js app router
mkdir -p src/app/mi-ruta
touch src/app/mi-ruta/page.tsx
```

## Deployment Checklist

- [ ] `NEXT_PUBLIC_API_URL` apunta a backend en producción
- [ ] `NEXT_PUBLIC_PRIVY_APP_ID` configurado (o desactiv email login)
- [ ] CORS en backend permite origin de dApp
- [ ] `NEXT_PUBLIC_STELLAR_NETWORK` = `public` para mainnet
- [ ] Build sin errores: `npm run build`
- [ ] Testear login en testnet antes de mainnet

## Links Útiles

- [Next.js Docs](https://nextjs.org/docs)
- [Stellar SDK Docs](https://developers.stellar.org/docs)
- [Soroban Docs](https://developers.stellar.org/docs/learn/soroban)
- [Privy Docs](https://docs.privy.io)
- [Stellar Wallets Kit](https://github.com/stellar/js-stellar-wallets-kit)

## Contribuir

1. Fork el repo
2. Crear branch (`git checkout -b feature/xyz`)
3. Commit cambios (`git commit -am 'Add xyz'`)
4. Push a branch (`git push origin feature/xyz`)
5. Crear Pull Request

