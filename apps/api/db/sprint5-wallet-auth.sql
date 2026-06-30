-- Sprint 5: Wallet-only users — relax constraints para auth SEP-10
-- Ejecutar en Neon una sola vez.

-- country: default 'XX' para orgs auto-creadas vía wallet
ALTER TABLE organizations ALTER COLUMN country SET DEFAULT 'XX';

-- email y password_hash opcionales (wallet users no tienen ninguno de los dos)
ALTER TABLE users ALTER COLUMN email     DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
