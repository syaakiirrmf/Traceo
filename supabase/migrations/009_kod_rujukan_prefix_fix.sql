-- =============================================================
-- Migration 009: kod_rujukan prefix follows the dominant live convention
--   jv_syarikat      -> JV-
--   jv_tanah         -> JVT-
--   pinjaman_individu-> PL-
--
--   The sequences are shared per namespace and were seeded to the
--   GREATEST max across both prefix families (JV/JVT -> seq_jv,
--   PI/PL -> seq_pi), so prefixes can differ per kategori with no
--   risk of collision. We only replace next_kod_rujukan's prefix
--   mapping; the seed values in 007 stay valid.
-- =============================================================

CREATE OR REPLACE FUNCTION public.next_kod_rujukan(p_kategori fasiliti_kategori)
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT CASE p_kategori
    WHEN 'jv_syarikat'  THEN 'JV-'  || lpad(nextval('seq_kod_rujukan_jv')::text, 3, '0')
    WHEN 'jv_tanah'     THEN 'JVT-' || lpad(nextval('seq_kod_rujukan_jv')::text, 3, '0')
    ELSE                     'PL-'  || lpad(nextval('seq_kod_rujukan_pi')::text, 3, '0')
  END;
$$;