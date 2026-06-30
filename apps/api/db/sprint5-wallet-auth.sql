-- Sprint 5: Wallet-only users — relax constraints para auth SEP-10
-- Ejecutar en Neon una sola vez.

-- country: default 'XX' para orgs auto-creadas vía wallet
ALTER TABLE organizations ALTER COLUMN country SET DEFAULT 'XX';

-- email y password_hash opcionales (wallet users no tienen ninguno de los dos)
ALTER TABLE users ALTER COLUMN email     DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- wallet_provider: reflejar la wallet real elegida en el Stellar Wallets Kit (#9).
-- Hasta correr esto, conectar con una wallet distinta de Freighter/Albedo fallará el INSERT.
ALTER TYPE wallet_provider ADD VALUE IF NOT EXISTS 'xbull';
ALTER TYPE wallet_provider ADD VALUE IF NOT EXISTS 'rabet';
ALTER TYPE wallet_provider ADD VALUE IF NOT EXISTS 'lobstr';
ALTER TYPE wallet_provider ADD VALUE IF NOT EXISTS 'hana';
ALTER TYPE wallet_provider ADD VALUE IF NOT EXISTS 'hot-wallet';

-- Privy: wallet embebida gestionada (login email/OTP, no-nativos cripto).
-- Valor propio (no 'custodial') para distinguir el proveedor específico.
ALTER TYPE wallet_provider ADD VALUE IF NOT EXISTS 'privy';
