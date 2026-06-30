-- Sprint 7: anchor_tx_hash en reports + proyectos
-- Correr en Neon antes de desplegar el backend con SorobanService en reports.

-- Hash de la tx Soroban que ancló el reporte on-chain (expense-anchor contract).
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS anchor_tx_hash TEXT;

-- Asegura que la columna allocation_tx_hash existe en projects (ya aplicada en sesión anterior,
-- pero incluimos IF NOT EXISTS para idempotencia).
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS allocation_tx_hash TEXT;
