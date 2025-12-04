-- Migration: add scheduled_at column to commissions
-- Safe: uses IF NOT EXISTS so it can be run multiple times
BEGIN;

ALTER TABLE IF EXISTS commissions
  ADD COLUMN IF NOT EXISTS scheduled_at timestamp;

COMMIT;
