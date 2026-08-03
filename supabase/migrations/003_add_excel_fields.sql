-- =============================================================
-- Migration 003: Add Excel Fields to fasiliti table
-- Traceo — JV Facility & Chronology Management System
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================================

-- Financial fields (from SUMMARY JV columns)
ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS kadar_dividen TEXT;
ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS perkongsian_keuntungan DECIMAL(15,2) NOT NULL DEFAULT 0; -- B for JV2
ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS tunggakan_dividen DECIMAL(15,2) NOT NULL DEFAULT 0;     -- B for JV1, C for JV2
ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS caj_lewat DECIMAL(15,2) NOT NULL DEFAULT 0;             -- C for JV1
ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS bayaran_tambahan DECIMAL(15,2) NOT NULL DEFAULT 0;      -- D for JV1/JV2, B for JV3

-- Collateral / Asset fields
ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS penama_aset TEXT;
ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS status_pindahmilik TEXT;

-- Property / Project fields (JV Tanah & others)
ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS nama_kontraktor TEXT;
ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS harga_jualan TEXT;   -- text to allow "400,000 - BUNGALOW" etc.
ALTER TABLE fasiliti ADD COLUMN IF NOT EXISTS tahun_projek INTEGER;
