# 🔍 Reporte de Auditoría del Repositorio — TrustBid Platform

**Fecha:** 2026-07-02  
**Revisor:** Automated Code Review  
**Total de Issues:** 23 problemas relevantes

---

## 📊 Resumen Ejecutivo

| Métrica | Resultado |
|---------|-----------|
| Errores de compilación | ✅ Ninguno |
| Issues encontrados | 23 |
| Severidad promedio | MEDIA |
| Áreas críticas | Config de env vars, valores hardcodeados |

**Distribución por severidad:**
- 🔴 **Críticos:** 3 issues
- 🟠 **Altos:** 4 issues
- 🟡 **Medianos:** 10 issues
- 🟢 **Bajos:** 6 issues

---

## 🚨 Issues Críticos (Fix antes de deploy)

### 1. Env Vars de Contratos Soroban Sin Documentación

**Ubicación:** `apps/api/src/modules/soroban/soroban.service.ts` (líneas 27-29)

**Problema:**
Las siguientes variables de entorno son críticas pero NO aparecen en `apps/api/.env.example`:
- `FUND_TRACKER_CONTRACT_ID`
- `EXPENSE_ANCHOR_CONTRACT_ID`
- `SBT_BADGE_CONTRACT_ID`

El servicio lanza error en bootstrap si faltan (`getOrThrow`), pero nadie sabe qué configurar.

**Severidad:** 🔴 CRÍTICA

**Impacto:** API no inicia sin estas variables

**Solución:**
```bash
# Agregar a apps/api/.env.example:
# ── Contratos Soroban ────────────────────────────────────────────────────────
FUND_TRACKER_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPENSE_ANCHOR_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SBT_BADGE_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 2. Public Key de Servidor Stellar Hardcodeado

**Ubicación:** 
- `apps/api/src/modules/projects/projects.service.ts` (línea 218)
- `apps/api/src/modules/reports/reports.service.ts` (línea 105)

**Problema:**
```typescript
const serverPubKey = process.env.STELLAR_SERVER_PUBLIC_KEY ?? 
  'GAOJ53SVIVOVP4O376PZBPTZRWHC5ML5JV4PSV26GT56MQSRR2J25EQO';
```

La public key del servidor Stellar está hardcodeada en el código como fallback. Esto es inseguro:
- Si cambia la arquitectura de keys, requiere recompilación
- Valor expuesto en el repositorio
- No es evidente que es un valor configurable

**Severidad:** 🔴 CRÍTICA

**Impacto:** Arquitectura de keys poco flexible, requiere redeploy si cambia

**Solución:**
```typescript
// En lugar de fallback hardcodeado:
const serverPubKey = this.configService.getOrThrow<string>('STELLAR_SERVER_PUBLIC_KEY');

// Agregar a apps/api/.env.example:
STELLAR_SERVER_PUBLIC_KEY=GAOJ53SVIVOVP4O376PZBPTZRWHC5ML5JV4PSV26GT56MQSRR2J25EQO
```

---

### 3. TODOs Privy Tier 2 sin Asignar

**Ubicación:**
- `apps/api/src/modules/auth/privy-stellar-signer.ts` (línea 5)
- `apps/api/src/modules/auth/privy.service.ts` (línea 10)

**Problema:**
```typescript
// TODO(privy-stellar): Tier 2 — rawSign manual. VALIDAR EN SANDBOX/TESTNET que
// la firma producida es aceptada por Horizon antes de mover fondos reales.

// TODO(privy-stellar): Stellar es soporte Tier 2 en Privy...
```

Estos TODOs están relacionados con **firma de transacciones en Tier 2**, que es crítico para Privy Stellar. 
- No tienen persona asignada
- No está claro si fue validado en testnet
- Blocker para Privy en producción

**Severidad:** 🔴 CRÍTICA

**Impacto:** Blocker para habilitar Privy Stellar en producción

**Solución:**
1. Asignar a desarrollador específico (ej: @dev-name)
2. Crear issues en GitHub con referencias:
   - "Validar firma Privy Tier 2 en testnet"
   - "Validar firma Privy Tier 2 en sandbox"
3. Documentar resultados de validación
4. No desplegar Privy a producción sin completar estos tests
5. Actualizar TODOs con estado:
   ```typescript
   // TODO: [GITHUB-123] Privy Tier 2 - rawSign validation on testnet (assignee: @dev-name)
   ```

---

## 🟠 Issues Altos (Fix pronto)

### 4. API URL Hardcodeada en 11 Archivos de dApp

**Ubicación:** Múltiples archivos en `apps/dapp/src/`:
- `src/app/api/public/*/route.ts` (6 archivos)
- `src/hooks/use*.ts` (5 archivos)
- `src/lib/auth/sep10.ts`
- `src/lib/api/public.ts`
- `src/components/*` (varios)

**Problema:**
URL de API hardcodeada como fallback a `https://api-production-9557.up.railway.app`

```typescript
const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';
```

Issues:
1. URL duplicada en 11+ lugares
2. Production URL expuesta en código fuente
3. Si la URL cambia, requiere cambio de código + rebuild
4. Sin centralización = difícil mantenimiento

**Severidad:** 🟠 ALTA

**Impacto:** Cambios de URL requieren rebuild. URL de producción en repositorio.

**Solución:**

Crear archivo centralizado:
```typescript
// apps/dapp/src/lib/config.ts (NUEVO)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

Reemplazar en todos los archivos:
```typescript
// Antes:
const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';

// Después:
import { API_URL } from '@/lib/config';
const API = API_URL;
```

---

### 5. Env Vars Faltantes en dApp

**Ubicación:** `apps/dapp/.env.example`

**Problema:**
Variables usadas en código pero NO documentadas en `.env.example`:
- `NEXT_PUBLIC_STELLAR_NETWORK` — existe en código, falta en `.env.example`
- `BACKEND_URL` — usado en `src/server/public/repository.ts`, no documentado

**Severidad:** 🟠 ALTA

**Impacto:** Setup confuso. Nuevo desarrollador no sabe qué variables configurar.

**Solución:**
```bash
# Agregar a apps/dapp/.env.example:

# Stellar Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org

# Backend API (server-side, for SSR)
BACKEND_URL=http://localhost:3001
```

---

### 6. Formspree ID Hardcodeado en Landing

**Ubicación:** `apps/landing/src/components/AccessModal.jsx` (línea 6)

**Problema:**
```javascript
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID || 'mdarorkz';
```

Aunque no es "secreto" (no es credencial), es mejor práctica no hardcodearlo.

**Severidad:** 🟠 ALTA

**Impacto:** Si Formspree ID cambia, requiere recompilación. Valor visible en código.

**Solución:**
```javascript
// Actualizar a:
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID || '';

if (!FORMSPREE_ID) {
  console.warn('⚠️ VITE_FORMSPREE_ID not configured - contact form will not work');
}

// Agregar a apps/landing/.env.example:
VITE_FORMSPREE_ID=mdarorkz
```

---

### 7. README de dApp Genérico

**Ubicación:** `apps/dapp/README.md`

**Problema:**
Es el template default de `create-next-app`. Sin información sobre:
- Cómo configurar variables de entorno
- Estructura de carpetas
- Cómo compilar y deployar
- Dependencias clave (Privy, Stellar SDK)
- Setup local

**Severidad:** 🟠 ALTA

**Impacto:** Nuevo desarrollador pierde tiempo en setup. No hay documentación de referencia.

**Solución:**
Reescribir `apps/dapp/README.md` con secciones:
- Getting Started
- Environment Variables
- Project Structure
- Key Dependencies
- Build & Deploy
- Development Tips

---

## 🟡 Issues Medianos (Próximo sprint)

### 8. TypeScript: `noImplicitAny` Desactivado

**Ubicación:** `apps/api/tsconfig.json` (línea 20)

**Problema:**
```json
"noImplicitAny": false,  // ❌ Permite tipos implícitos ANY
```

Compromete seguridad de tipos en NestJS. Encontrados 8+ lugares con `as any` o `Record<string, any>`:
- `apps/api/src/modules/soroban/soroban.service.ts` — Casting de client
- `apps/api/src/common/filters/http-exception.filter.ts` — Tipos genéricos sin especificar

**Severidad:** 🟡 MEDIA

**Impacto:** Errores de tipo no detectados en compile time. Bugs en runtime.

**Solución:**
```json
"noImplicitAny": true,
```

Luego fijar tipos en:
- `soroban.service.ts` (client type)
- `http-exception.filter.ts` (exception response type)

---

### 9. StrictBindCallApply Desactivado

**Ubicación:** `apps/api/tsconfig.json` (línea 21)

**Problema:**
```json
"strictBindCallApply": false,
```

Sin validación de `bind()`, `call()`, `apply()`. Errores de contexto no detectados.

**Severidad:** 🟡 MEDIA

**Solución:**
```json
"strictBindCallApply": true,
```

---

### 10. NoFallthroughCasesInSwitch Desactivado

**Ubicación:** `apps/api/tsconfig.json` (línea 22)

**Problema:**
```json
"noFallthroughCasesInSwitch": false,
```

Switch cases sin break pueden ejecutar código no deseado.

**Severidad:** 🟡 MEDIA

**Solución:**
```json
"noFallthroughCasesInSwitch": true,
```

---

### 11. JWT Secret por Defecto Débil

**Ubicación:** `apps/api/.env.example` (línea 32)

**Problema:**
```
JWT_SECRET=change-me-in-production-min-32-chars
```

El default es muy corto y obvious. En desarrollo podría quedar así accidentalmente.

**Severidad:** 🟡 MEDIA

**Impacto:** Tokens JWT débiles en desarrollo. Posible acceso no autorizado en test.

**Solución:**
```bash
# En apps/api/.env.example:
# Generar con: openssl rand -base64 32
JWT_SECRET=<GENERATE_STRONG_SECRET_HERE>

# En documentación:
# Production: use a strong 32+ character secret
```

---

### 12. Falta Configuración Centralizada de Env Vars

**Ubicación:** Múltiples archivos en `apps/api/src/`

**Problema:**
Variables se leen inline desde `process.env` en lugar de un módulo central. No hay single source of truth para qué env vars se necesitan.

```typescript
// Esparcido en múltiples servicios:
process.env.DATABASE_URL
process.env.STELLAR_SERVER_SECRET
process.env.STELLAR_NETWORK
process.env.PRIVY_APP_ID
// etc...
```

**Severidad:** 🟡 MEDIA

**Impacto:** Difícil mantenimiento. Difícil ver qué env vars son necesarias. Sin validación centralizada.

**Solución:**
Crear módulo centralizado:
```typescript
// apps/api/src/config/env.ts (NUEVO)
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvConfig {
  constructor(private config: ConfigService) {}

  get database() {
    return {
      url: this.config.getOrThrow<string>('DATABASE_URL'),
    };
  }

  get stellar() {
    return {
      serverSecret: this.config.getOrThrow<string>('STELLAR_SERVER_SECRET'),
      serverPublicKey: this.config.getOrThrow<string>('STELLAR_SERVER_PUBLIC_KEY'),
      network: this.config.get<string>('STELLAR_NETWORK', 'testnet'),
    };
  }

  get soroban() {
    return {
      fundTrackerContractId: this.config.getOrThrow<string>('FUND_TRACKER_CONTRACT_ID'),
      expenseAnchorId: this.config.getOrThrow<string>('EXPENSE_ANCHOR_CONTRACT_ID'),
      sbtBadgeId: this.config.getOrThrow<string>('SBT_BADGE_CONTRACT_ID'),
    };
  }

  get privy() {
    return {
      appId: this.config.get<string>('PRIVY_APP_ID'),
      appSecret: this.config.get<string>('PRIVY_APP_SECRET'),
    };
  }

  // ... etc
}
```

---

### 13. Soroban Service es Fire-and-Forget

**Ubicación:** `apps/api/src/modules/reports/reports.service.ts` (líneas 115-130)

**Problema:**
```typescript
this.soroban
  .anchorExpense({...})
  .then((txHash) => {...})
  .catch((e) => this.logger.error('anchorExpense failed for report', e));
```

Es fire-and-forget:
- Si Soroban falla, el report se crea anyway
- No hay retry logic
- Posible inconsistencia entre API y blockchain

**Severidad:** 🟡 MEDIA

**Impacto:** Reportes sin transacciones ancladas. Inconsistencia de datos.

**Solución:**
Documentar explícitamente el comportamiento:
```typescript
// Cambiar comentario a:
/**
 * Create report (best-effort anchor to Soroban).
 * Report creation succeeds even if Soroban call fails.
 * This is intentional — use webhook/polling to check tx status.
 */
async createReport(dto: CreateReportDto) {
  // ... crear report ...
  
  // Best-effort async anchor (no await)
  this.soroban
    .anchorExpense({...})
    .then((txHash) => {
      this.logger.log(`Report ${report.id} anchored: ${txHash}`);
      // Actualizar report con tx hash (si quieres)
    })
    .catch((e) => {
      this.logger.error(`Failed to anchor report ${report.id}:`, e);
      // TODO: implement retry strategy
    });

  return report;
}
```

O cambiar a blocking si es crítico:
```typescript
// Si debe ser síncrono:
const txHash = await this.soroban.anchorExpense({...});
report.txHash = txHash;
```

---

### 14. CORS Hardcodeado a Nivel de Configuración

**Ubicación:** `apps/api/src/main.ts` (líneas 10-15)

**Problema:**
```typescript
const allowed = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
  .split(',')
  .map((u) => u.trim());

app.enableCors({ origin: allowed });
```

Aunque permite múltiples URLs, el fallback es local. En producción, si `FRONTEND_URL` no se configura, CORS falla silenciosamente.

**Severidad:** 🟡 MEDIA

**Impacto:** CORS falla en producción si env var no configurada. Error difícil de debuggear.

**Solución:**
Validar en bootstrap:
```typescript
// En main.ts o app.module.ts:
const frontendUrl = process.env.FRONTEND_URL;
if (!frontendUrl && process.env.NODE_ENV === 'production') {
  throw new Error('FRONTEND_URL must be set in production');
}

const allowed = (frontendUrl || 'http://localhost:3000')
  .split(',')
  .map((u) => u.trim());

app.enableCors({ origin: allowed });
logger.log(`✅ CORS enabled for: ${allowed.join(', ')}`);
```

---

### 15. Privy Sin Validación de Configuración al Startup

**Ubicación:** `apps/api/src/modules/auth/privy.service.ts` (línea 34)

**Problema:**
Privy se inicializa **lazy** (solo cuando se usa). Si `PRIVY_APP_ID` o `PRIVY_APP_SECRET` faltan, el error aparece en runtime, no en bootstrap.

**Severidad:** 🟡 MEDIA

**Impacto:** Errores confusos en runtime si Privy no configurado. No hay validación temprana.

**Solución:**
Validar en `auth.module.ts`:
```typescript
@Module({
  providers: [
    {
      provide: 'PRIVY_CONFIG_VALIDATION',
      useFactory: (config: ConfigService) => {
        const appId = config.get<string>('PRIVY_APP_ID');
        const appSecret = config.get<string>('PRIVY_APP_SECRET');
        
        if (!appId || !appSecret) {
          const msg = 'Privy not configured (optional in dev)';
          if (process.env.NODE_ENV === 'production') {
            throw new Error(msg + ' — REQUIRED in production');
          }
          console.warn('⚠️ ' + msg);
        }
        
        return true;
      },
      inject: [ConfigService],
    },
    PrivyService,
  ],
})
export class AuthModule {}
```

---

### 16. Versiones Inconsistentes de `debug`

**Ubicación:** `package-lock.json`

**Problema:**
15+ instancias de `debug` con versiones diferentes:
- `^4.3.1`, `^4.3.2`, `^4.1.0`, `^4.3.4`, `~4.4.1`, `^3.2.7`, `4.3.4`

Aunque son cambios menores, fragmenta el árbol de dependencias.

**Severidad:** 🟡 MEDIA

**Impacto:** Árbol de deps más grande. Posibles incompatibilidades.

**Solución:**
```bash
npm dedupe
# o si es más grave:
npm ci --force
```

---

## 🟢 Issues Bajos (Nice to have)

### 17. @types/debug Inconsistente

**Ubicación:** `package-lock.json`

**Problema:**
Múltiples versiones de `@types/debug`: `^4.1.7`, `^4.1.13`, etc.

**Severidad:** 🟢 BAJA

**Solución:**
```bash
npm dedupe
```

---

### 18. Package.json del Workspace Sin Metadatos

**Ubicación:** `package.json` (líneas 3-5)

**Problema:**
```json
"description": "",
"author": "",
```

**Severidad:** 🟢 BAJA

**Solución:**
```json
"description": "TrustBid Platform — fund transparency & traceability for NGOs on Stellar",
"author": "TrustBid",
"repository": {
  "type": "git",
  "url": "https://github.com/TrustBid/platform"
}
```

---

### 19. TypeScript Module vs ESNext Inconsistente

**Ubicación:** Múltiples `tsconfig.json`

**Problema:**
- Root `tsconfig.json`: `"module": "ESNext"`
- `apps/api/tsconfig.json`: `"module": "nodenext"`
- `packages/*/tsconfig.json`: `"module": "ESNext"`

Esto es intencional (NestJS requiere nodenext), pero puede causar confusión.

**Severidad:** 🟢 BAJA

**Solución:**
Documentar en comentario en cada `tsconfig.json`:
```json
{
  "compilerOptions": {
    // NestJS requires 'nodenext' for proper Node.js CJS interop
    "module": "nodenext"
  }
}
```

---

### 20. .env.example API Incompleto

**Ubicación:** `apps/api/.env.example`

**Problema:**
- Faltan contract IDs de Soroban
- Faltan comentarios explicativos

**Severidad:** 🟢 BAJA

**Solución:**
Agregar secciones faltantes (ya detallado en issues críticos/altos).

---

### 21. Comentarios Desactualizados

**Ubicación:** `apps/api/src/modules/projects/projects.service.ts` (línea 145)

**Problema:**
```typescript
// Actividad reciente de la organización: últimas transacciones de todos los proyectos.
```

Comentario huérfano sin relación al código siguiente.

**Severidad:** 🟢 BAJA

**Solución:**
Remover o actualizar con descripción correcta del código.

---

### 22. PENDIENTES.md Sin Versionado

**Ubicación:** `apps/landing/PENDIENTES.md`

**Problema:**
Documento manually mantenido sin fecha, versionado o asignaciones. Info de "resueltos" podría quedar desfasada.

**Severidad:** 🟢 BAJA

**Solución:**
Migrar a GitHub Issues o backlog estructurado. Convertir en GitHub Discussion o Project.

---

### 23. Wrangler Config Muy Básico

**Ubicación:** `apps/dapp/wrangler.toml`, `apps/landing/wrangler.toml`

**Problema:**
Archivos sin configuración de secrets o bindings. Si se despliega a Cloudflare, necesitará setup manual.

**Severidad:** 🟢 BAJA

**Solución:**
```toml
# apps/dapp/wrangler.toml
[env.production]
vars = { ENVIRONMENT = "production" }

[env.staging]
vars = { ENVIRONMENT = "staging" }

# [env.production]
# routes = { pattern = "example.com/*", zone_name = "example.com" }
```

**Generado:** 2026-07-02 | **Herramienta:** Automated Code Review
