-- Sprint review: blockchain anchor status for projects and reports
-- Values: pending | anchored | failed | null (not applicable)

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS blockchain_status VARCHAR(32);

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS blockchain_status VARCHAR(32);

UPDATE projects
  SET blockchain_status = 'anchored'
  WHERE allocation_tx_hash IS NOT NULL AND blockchain_status IS NULL;

UPDATE reports
  SET blockchain_status = 'anchored'
  WHERE anchor_tx_hash IS NOT NULL AND blockchain_status IS NULL;
