-- =============================================================
-- Migration 010: fix kod_rujukan truncation in next_kod_rujukan
--
--   lpad(value::text, 3, '0') TRUNCATES values longer than 3
--   digits. Live fasiliti has 4-digit siri (JV-1010, JVT-2010,
--   PL-3010+) and the sequences are seeded to 2017/3017, so from
--   the very first new row the code was emitted truncated
--   (2018 -> '201' -> JV-201). Worse, from sequence 2100, values
--   2100 and 2101 both truncate to '210' -> unique-constraint
--   collision.
--
--   Fix: pad to GREATEST(3, digits) so numbers are never cut.
--   Single nextval per call (called once in the inner subquery).
-- =============================================================

CREATE OR REPLACE FUNCTION public.next_kod_rujukan(p_kategori fasiliti_kategori)
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT (CASE p_kategori
    WHEN 'jv_syarikat'  THEN 'JV-'
    WHEN 'jv_tanah'     THEN 'JVT-'
    ELSE                     'PL-'
  END) || lpad(n::text, GREATEST(3, length(n::text)), '0')
  FROM (
    SELECT CASE p_kategori
      WHEN 'jv_syarikat' THEN nextval('seq_kod_rujukan_jv')
      WHEN 'jv_tanah'    THEN nextval('seq_kod_rujukan_jv')
      ELSE                    nextval('seq_kod_rujukan_pi')
    END AS n
  ) s;
$$;