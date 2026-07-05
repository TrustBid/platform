-- Sprint 9: campos de factura para el flujo "Registrar transacción" (OCR + validación + anclaje)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS invoice_date DATE;
