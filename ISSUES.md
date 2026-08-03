# TrustBid — ISSUES post-merge (develop → main)

> Revisión exhaustiva tras el merge que rompió producción.
> Generado: 2026-07-09. Alcance: `apps/*`, `packages/*`, config de deploy y env.

## Contexto del merge

| Referencia | Commit | Descripción |
|---|---|---|
| Merge sospechoso | `4e235b4` | `Merge branch 'develop'` — por **delfinacorr**, 2026-07-07 |
| main **antes** del merge | `e312285` | `feat: pricing plans a ruta /pricing` |
| develop actual (`HEAD`) | `faeed1e` | `feat(bot): per-project invites + multi-channel` |

**Naturaleza del merge:** `4e235b4` mezcló **develop → main**. develop traía cambios muy grandes (migración de deploy, bot de WhatsApp/Telegram, OCR con Gemini, integración Soroban) que reescribieron dependencias, `wrangler.toml` y variables de entorno. main **no** fue reconfigurado (Railway, Cloudflare, `.env`) para esos cambios. **No quedaron marcadores de conflicto sin resolver** (`<<<<<<<` = 0), así que el problema no es texto corrupto sino **config/entorno desalineado**.

---

## 🔴 P0 — Producción caída (arreglar ya)

### I-1 · "No se pudo conectar con el servidor" (login y registro) = CORS del API
- **Síntoma:** en `app.trustbid.org/login` y `/register` sale *"No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo."*
- **Origen del texto:** [`apps/dapp/src/app/login/page.tsx:57`](apps/dapp/src/app/login/page.tsx#L57) y [`register/page.tsx:55`](apps/dapp/src/app/register/page.tsx#L55) — es el `catch` cuando falla el `fetch` al API.
- **Causa raíz:** el API **está arriba** (HTTP 200), pero su CORS solo permite los orígenes de `FRONTEND_URL` (default `http://localhost:3000`). El allowlist **no incluye `https://app.trustbid.org`**, así que el navegador bloquea la petición.
  - Evidencia: [`apps/api/src/main.ts:10-20`](apps/api/src/main.ts#L10-L20) → `origin` callback rechaza cualquier origen fuera de `FRONTEND_URL`.
  - Preflight `OPTIONS /auth/challenge` con `Origin: https://app.trustbid.org` → **sin** header `access-control-allow-origin`.
- **Fix (en Railway, servicio API):** setear
  ```
  FRONTEND_URL=https://app.trustbid.org,https://trustbid.org
  ```
  (el código hace `split(',')` y `trim()`, así que admite lista separada por comas). Redeploy del API.

### I-2 · Privy caído (login por email/OTP no aparece)
- **Causa raíz:** `NEXT_PUBLIC_PRIVY_APP_ID` es **build-time** (se inyecta al compilar). La dapp **no tiene `.env.local`** (solo `.env.example` con el valor **vacío**), así que el build salió sin App ID → `PRIVY_ENABLED = false` → `PrivyProvider` pasa de largo y el login por email desaparece.
  - Evidencia: [`apps/dapp/src/components/privy-provider.tsx:6-9`](apps/dapp/src/components/privy-provider.tsx#L6-L9) (`const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID`), [`apps/dapp/.env.example`](apps/dapp/.env.example) (`NEXT_PUBLIC_PRIVY_APP_ID=` vacío).
- **Fix (dos partes):**
  1. Crear `apps/dapp/.env.local` con los valores reales **antes** de `npm run deploy`:
     ```
     NEXT_PUBLIC_API_URL=https://api-production-9557.up.railway.app
     NEXT_PUBLIC_PRIVY_APP_ID=<APP_ID real de dashboard.privy.io>
     NEXT_PUBLIC_STELLAR_NETWORK=testnet
     NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
     ```
     Luego `cd apps/dapp && npm run deploy` (rebuild del Worker con las vars).
  2. En **dashboard.privy.io** → tu app → **Allowed origins / domains**: agregar `https://app.trustbid.org` (si estaba el dominio viejo, quedaba rechazando).

---

## 🟠 P1 — Correctitud de deploy (config desalineada por el merge)

### I-3 · La dapp migró de Cloudflare **Pages → Worker** en develop, pero el dominio apuntaba al Pages viejo
- **Qué cambió:** en develop, `apps/dapp/wrangler.toml` pasó de `pages_build_output_dir = ".open-next/assets"` (Pages) a `main = ".open-next/worker.js"` + `[assets]` (Worker). main-antes-del-merge seguía en modelo **Pages**.
  - Evidencia: `git diff e312285 faeed1e -- apps/dapp/wrangler.toml`.
- **Impacto:** el custom domain `app.trustbid.org` había quedado enganchado al **proyecto Pages** `trustbid-dapp` (build viejo, optimizador `/_next/image` roto → logo/imagenes no cargaban). La dapp real se despliega como **Worker** `trustbid-dapp`.
- **Estado:** ✅ **RESUELTO** en esta sesión — repunté `app.trustbid.org` del Pages al Worker (`PUT /workers/domains`), redeploy del Worker con `images.unoptimized`. 
- **Pendiente:** el **proyecto Pages `trustbid-dapp` quedó huérfano** — conviene borrarlo para evitar confusiones futuras. El deploy correcto de la dapp es **siempre** `npm run deploy` (Worker), nunca `wrangler pages deploy`.

### I-4 · El API necesita variables NUEVAS en Railway (Soroban) — sin ellas, se rompe la integración on-chain
- **Qué cambió:** `apps/api/.env.example` sumó variables que antes no existían:
  ```
  STELLAR_RPC_URL=...           (SorobanService la usa; antes solo SOROBAN_RPC_URL)
  STELLAR_SERVER_PUBLIC_KEY=... (además del SECRET)
  FUND_TRACKER_CONTRACT_ID=CC6OJ26655KKLDZB6HXBV2IN4WWU7GMU57IX7WQSF3SKAEJRMAPQVHYS
  EXPENSE_ANCHOR_CONTRACT_ID=CABW2KK4CRLHOB4GATGIT2MDGE3HLTDTI5YZOFOQHGLONQTNU3MYYOAW
  SBT_BADGE_CONTRACT_ID=CCBTM23SCCOEA7Y55DL4ENJNWID7OATWB7RXHAS7MD6CQHW3PMG4CDNK
  ```
  - Evidencia: `git diff e312285 faeed1e -- apps/api/.env.example`.
- **Impacto:** cualquier flujo que ancle gastos / rastree fondos / emita SBT fallará en producción si Railway no tiene estas vars. También `@google/genai` (OCR de facturas con Gemini) requiere su API key.
- **Fix:** en Railway, agregar todas las vars nuevas (contract IDs de testnet, `STELLAR_RPC_URL`, `STELLAR_SERVER_PUBLIC_KEY`, key de Gemini). Verificar contra `apps/api/.env.example` **actual** (develop).

### I-5 · Divergencia de ramas: develop **NO** tiene el trabajo de pricing que está en main
- **Hallazgo:** `git merge-base --is-ancestor e312285 develop` → **NO**. El commit `e312285 "feat: pricing plans a ruta /pricing"` existe **solo en main**.
- **Impacto:** si desplegás desde **develop**, **pierdes la página/planes de `/pricing`**. Si desplegás desde **main**, tienes pricing + todo develop (porque el merge llevó develop → main).
- **Recomendación:** decidir una rama fuente única. Lo más sano: **traer `e312285` a develop** (`git cherry-pick e312285` o merge de main → develop) y desplegar siempre desde una sola rama. Hoy main = develop + pricing.

---

## 🟡 P2 — Higiene / riesgos latentes

### I-6 · 🔴 El build del API en Railway está ROTO desde el merge (Nixpacks sin Python → módulo nativo `usb`)
- **Confirmado:** todos los builds del `api` fallan desde el 7-jul. El que corre en prod es del **6-jul** (`f327fd12`), o sea **el API no puede desplegar el código nuevo del merge** (bot, OCR, Soroban).
- **Causa raíz (build logs):** `npm ci --include=dev` compila el módulo nativo **`usb@2.18.0`** con `node-gyp`, y el entorno **Nixpacks no tiene Python**:
  ```
  npm error path /app/node_modules/usb
  gyp ERR! find Python — Could not find any Python installation to use
  Build Failed: npm ci --include=dev (exit code 1)
  ```
  - `usb` es **transitiva de `@trezor/transport`** (wallet Trezor) → entra por `@creit.tech/stellar-wallets-kit` de la **dapp**. El API no lo necesita, pero el build instala todo el monorepo desde la raíz.
  - Config de build: [`nixpacks.toml`](nixpacks.toml) — falta Python + toolchain nativo (y `libudev` para `usb`).
- **Por qué el CORS igual se aplicó:** se hizo `deploymentRedeploy` de la **imagen buena** del 6-jul (reusa artefacto, no rebuildeja) reiniciándola con la nueva `FRONTEND_URL`. Es un parche — **no arregla el build**.
- **Fix (elegir uno):**
  1. **Nixpacks + Python** — en `nixpacks.toml` agregar fase setup con `python3`, `pkg-config`, `gcc`, `make`, `libudev`/`systemd`. (Lo más directo para que compile `usb`.)
  2. **Podar `usb`/Trezor** — quitar Trezor del wallet-kit de la dapp si no se usa, o marcar `usb` como opcional/omitir su build (`npm ci --omit=optional` no aplica si es dep normal de trezor).
  3. **Dockerfile determinista** (Node 22 + native deps) y forzar el builder a Docker en el servicio `api` de Railway.
- **⚠️ Al arreglar el build se desplegará el código nuevo del API** → antes hay que setear las **vars nuevas** de I-4 en Railway o el API puede fallar en runtime.

### I-7 · `apps/dapp/.env.example` ahora defaultea a `localhost` para el API
- El merge cambió el default de `NEXT_PUBLIC_API_URL` de la URL de Railway a `http://localhost:3001`.
  - Evidencia: `git diff e312285 faeed1e -- apps/dapp/.env.example`.
- **Riesgo:** si alguien copia el example a `.env.local` y hace deploy, la dapp de producción apuntaría a `localhost`. **Siempre** setear la URL real de Railway en prod (ver I-2).

### I-8 · `HOME_DOMAIN=trustbid.app` en el `.env.example` raíz ≠ dominio real `trustbid.org`
- El root `.env.example` trae `HOME_DOMAIN=trustbid.app`. SEP-10 valida el `home_domain` del challenge; si el API en Railway tiene `trustbid.app` (u otro) y la dapp corre en `app.trustbid.org`, la **autenticación por wallet (SEP-10) puede fallar**.
- **Acción:** confirmar `HOME_DOMAIN`/`FRONTEND_URL` reales en Railway y alinearlos al dominio productivo (`trustbid.org` / `app.trustbid.org`).

### I-9 · Gestor de paquetes: es **npm**, no pnpm (como dice el `CLAUDE.md`)
- Real: `packageManager: "npm@11.12.1"` + `package-lock.json` + `workspaces` en el root. El `CLAUDE.md` dice *"Build: Turborepo · pnpm workspaces"* → **doc desactualizada**.
- El merge reescribió `package-lock.json` (~22.000 líneas). **Recomendación:** `rm -rf node_modules && npm install` limpio para asegurar el árbol, y actualizar el `CLAUDE.md`.

---

## ✅ Checklist para restaurar producción

1. **[API/Railway]** `FRONTEND_URL=https://app.trustbid.org,https://trustbid.org` → redeploy. *(arregla I-1)*
2. **[API/Railway]** Agregar vars Soroban nuevas + key Gemini (I-4). Confirmar `HOME_DOMAIN` (I-8).
3. **[dapp]** Crear `apps/dapp/.env.local` con `NEXT_PUBLIC_PRIVY_APP_ID` real + `NEXT_PUBLIC_API_URL` de Railway → `npm run deploy`. *(arregla I-2)*
4. **[Privy]** Agregar `https://app.trustbid.org` a Allowed origins en dashboard.privy.io. *(I-2)*
5. **[git]** Reconciliar develop ↔ main: traer `e312285` (pricing) a develop y unificar rama de deploy. *(I-5)*
6. **[limpieza]** Borrar el proyecto Pages huérfano `trustbid-dapp`; actualizar `CLAUDE.md` (npm, no pnpm). *(I-3, I-9)*

## Referencia — variables por app

| App | Variables requeridas en prod |
|---|---|
| **dapp** (build-time, Worker) | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_HORIZON_URL` |
| **api** (Railway) | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_URL`, `HOME_DOMAIN`, `STELLAR_NETWORK`, `STELLAR_RPC_URL`, `STELLAR_SERVER_SECRET`, `STELLAR_SERVER_PUBLIC_KEY`, `FUND_TRACKER_CONTRACT_ID`, `EXPENSE_ANCHOR_CONTRACT_ID`, `SBT_BADGE_CONTRACT_ID`, key de Gemini, AWS KMS |
| **landing** (Vite, build-time) | `VITE_DAPP_URL` (=`https://app.trustbid.org`), `VITE_FORMSPREE_ID` |
