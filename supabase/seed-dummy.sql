-- =============================================================
-- TRACEO — DUMMY DATA SEED SCRIPT (PostgreSQL / Supabase)
-- Memasukkan 51 Rekod Fasiliti (JV1, JV Tanah, Personal Loan)
-- + Rekod Pendaftaran Tanah JV + Rekod Kronologi Susulan
-- =============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_fasiliti_id UUID;
BEGIN
  -- Dapatkan id user sedia ada dari jadual users (atau cipta fallback)
  SELECT id INTO v_user_id FROM users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Tiada pengguna dijumpai dalam jadual users. Sila pastikan anda sekurang-kurangnya mempunyai 1 akaun pengguna.';
    RETURN;
  END IF;

  -- -------------------------------------------------------------
  -- 1. SUMMARY JV 1 — Syarikat Usahasama (17 Rekod)
  -- -------------------------------------------------------------

  -- Rekod 1
  INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, kadar_dividen, tunggakan_dividen, caj_lewat, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, catatan_am, dicipta_oleh)
  VALUES ('JV-101', 'jv_syarikat', 'FIRST ALLIED SECURITY SERVICES SDN BHD', 'LEGASI SURIA SEMPURNA SDN BHD', 600000.00, '2023-01-15', 'TANAH BUKIT PAYONG - NILAIAN 4 JUTA', 4000000.00, '35,000/BULAN (420,000/12 BULAN)', 175000.00, 23301.37, 393505.48, 2500000.00, 'tertunggak', 'SEORANG PENAMA ASET', 'LAWYER MINTA BAGI MASA SEHINGGA BULAN 8 2024 UNTUK PROSES CAIRKAN TANAH', 'LAWYER TELAH KELUARKAN SURAT JAMINAN PENYELESAIAN PADA 21.06.2023', v_user_id)
  RETURNING id INTO v_fasiliti_id;

  INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
  (v_fasiliti_id, '2023-02-10', 'Perbincangan awal bersama pembiaya berhubung penyerahan geran cagaran.', v_user_id),
  (v_fasiliti_id, '2023-06-21', 'Surat jaminan penyelesaian rasmi diterima daripada pihak peguam.', v_user_id),
  (v_fasiliti_id, '2023-11-15', 'Pemakan dividen memohon pelanjutan masa pembatalan akaun tertunggak.', v_user_id),
  (v_fasiliti_id, '2024-02-01', 'Notis peringatan tunggakan RM 2.5 Juta diserahkan kepada pihak peminjam.', v_user_id);

  -- Rekod 2
  INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, kadar_dividen, tunggakan_dividen, caj_lewat, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, catatan_am, dicipta_oleh)
  VALUES ('JV-102', 'jv_syarikat', 'FARAH NIZAH BINTI JAPILOS', 'LEGASI SURIA SEMPURNA SDN BHD', 600000.00, '2023-03-01', 'TANAH N9 - NILAIAN 1.5 JUTA', 1500000.00, '15,000/BULAN (180,000/12 BULAN)', 90000.00, 18193.15, 0.00, 108193.15, 'tertunggak', 'FARAH NIZAH BINTI JAPILOS', 'PROSES TUKAR NAMA DUKUNGAN PEGUAM', 'TUNGGAKAN 6 BULAN DIVIDEN BERMULA SEP 2023', v_user_id)
  RETURNING id INTO v_fasiliti_id;

  INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
  (v_fasiliti_id, '2023-04-05', 'Bayaran dividen pertama berjaya diselesaikan.', v_user_id),
  (v_fasiliti_id, '2023-09-30', 'Kegagalan bayaran dividen dikesan bagi bulan September.', v_user_id),
  (v_fasiliti_id, '2024-01-10', 'Perbincangan penjadualan semula dividen tertunggak.', v_user_id);

  -- Rekod 3
  INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, kadar_dividen, tunggakan_dividen, caj_lewat, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, catatan_am, dicipta_oleh)
  VALUES ('JV-103', 'jv_syarikat', 'MUAZ MAJU SDN BHD', 'LEGASI SURIA SEMPURNA SDN BHD', 500000.00, '2023-02-01', 'RUMAH SEMI D (PALUH) - NILAIAN 820,000', 820000.00, '8,340/BULAN (100,080/12 BULAN)', 150120.00, 200219.41, 0.00, 850339.00, 'tindakan_guaman', 'MOHD AZRUL BIN ZAKARIA', 'REQUEST MUKA SURAT BELAKANG GERAN DENGAN LAWYER', 'PROSES GUAMAN TELAH DIFALKAN PADA DIS 2023', v_user_id)
  RETURNING id INTO v_fasiliti_id;

  INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
  (v_fasiliti_id, '2023-05-12', 'Semakan status hak milik rumah Semi-D Paluh.', v_user_id),
  (v_fasiliti_id, '2023-12-01', 'Fail tuntutan hukum/guaman diserahkan kepada firma guaman dilantik.', v_user_id),
  (v_fasiliti_id, '2024-03-15', 'Pendengaran kes pertama di Mahkamah Tinggi.', v_user_id);

  -- Rekod 4
  INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, kadar_dividen, tunggakan_dividen, caj_lewat, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, catatan_am, dicipta_oleh)
  VALUES ('JV-104', 'jv_syarikat', 'MUAZ SERVICES SDN BHD', 'LEGASI SURIA SEMPURNA BHD WAHID', 650000.00, '2023-05-01', 'TANAH RECIL 1 LOT BESAR - NILAIAN 1.5 JUTA', 1500000.00, 'BULAN 1-6 RM10k/BULAN, BULAN 7 RM70k LUMP SUM', 0.00, 0.00, 0.00, 650000.00, 'aktif', 'MOHD AZRUL BIN DATO SERI HP ZAKARIA', 'TELAH DIPINDAHMILIK KE ATAS NAMA EN AZRUL', 'MD NAK TUNTUT MODAL SAHAJA RM650K TANPA TUNGGAKAN', v_user_id)
  RETURNING id INTO v_fasiliti_id;

  INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
  (v_fasiliti_id, '2023-06-01', 'Pindah milik tanah berjaya didaftarkan atas nama En Azrul.', v_user_id),
  (v_fasiliti_id, '2024-01-20', 'Persetujuan pelepasan tuntutan dividen; persetujuan pemulangan modal bersih.', v_user_id);

  -- Loop memasukkan Baki Rekod JV1 (Rekod 5 hingga 17)
  FOR i IN 5..17 LOOP
    INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, kadar_dividen, tunggakan_dividen, caj_lewat, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, catatan_am, dicipta_oleh)
    VALUES (
      'JV-10' || i,
      'jv_syarikat',
      'SYARIKAT PEMBIAYA ' || i || ' SDN BHD',
      'PEMINJAM CORPORATE ' || i || ' SDN BHD',
      (300000 + (i * 25000))::DECIMAL,
      ('2023-0' || (i % 9 + 1) || '-10')::DATE,
      'LOT TANAH INDUSTRI ' || i || ' - NILAIAN ' || (500000 + i * 40000) || ' RM',
      (500000 + i * 40000)::DECIMAL,
      (5000 + i * 500) || '/BULAN',
      CASE WHEN i % 3 = 0 THEN (12000 + i * 1000)::DECIMAL ELSE 0.00 END,
      CASE WHEN i % 3 = 0 THEN (1500 + i * 200)::DECIMAL ELSE 0.00 END,
      0.00,
      CASE WHEN i % 3 = 0 THEN (13500 + i * 1200)::DECIMAL ELSE 0.00 END,
      CASE WHEN i % 4 = 0 THEN 'tertunggak'::fasiliti_status WHEN i % 5 = 0 THEN 'tindakan_guaman'::fasiliti_status ELSE 'aktif'::fasiliti_status END,
      'PENAMA ASET ' || i,
      'STATUS HAK MILIK DISAHKAN',
      'Catatan pemantauan berkala bagi rekod syarikat usahasama ' || i,
      v_user_id
    )
    RETURNING id INTO v_fasiliti_id;

    INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
    (v_fasiliti_id, '2023-08-01', 'Pemeriksaan dokumen awal diselesaikan dengan baik.', v_user_id),
    (v_fasiliti_id, '2024-02-15', 'Kemaskini status berkala bayaran dividen.', v_user_id);
  END LOOP;

  -- -------------------------------------------------------------
  -- 2. JV TANAH — Tanah Usahasama (17 Rekod)
  -- -------------------------------------------------------------

  -- Rekod 1
  INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, perkongsian_keuntungan, tunggakan_dividen, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, harga_jualan, catatan_am, dicipta_oleh)
  VALUES ('JVT-201', 'jv_tanah', 'GOLDEN IZZ ENTERPRISE (PBB 3815520811)', 'MF PROPERTIES', 130000.00, '2020-01-10', 'GM 1837 LOT 1979 MUKIM TUK JAMAL', 400000.00, 30000.00, 0.00, 0.00, 0.00, 'selesai', 'NUR AFIFA DAYANA BINTI HASBULLAH', 'SELESAI KEPADA PEMBELI', 400000.00, 'PROFIT: 40% ON GROSS OF SALE. SELESAI AWAL NOV 2020. TOTAL 160K RECEIVED CASH', v_user_id)
  RETURNING id INTO v_fasiliti_id;

  INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
  (v_fasiliti_id, '2020-03-01', 'Pecah lot rumah bungalow dimulakan.', v_user_id),
  (v_fasiliti_id, '2020-11-05', 'Jualan rumah selesai sepenuhnya & pulangan dividen diterima.', v_user_id);

  -- Rekod 2
  INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, perkongsian_keuntungan, tunggakan_dividen, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, harga_jualan, catatan_am, dicipta_oleh)
  VALUES ('JVT-202', 'jv_tanah', 'CASH MD (PETI BESI)', 'MF PROPERTIES', 176000.00, '2021-06-15', 'TANAH MOK KEMAS LOT 20392 & 20393 / GERAN LOT 56820', 350000.00, 70000.00, 0.00, 0.00, 0.00, 'selesai', 'NUR AFIFA DAYANA BINTI HASBULLAH', 'SELESAI KEPADA PEMBELI', 240000.00, 'SELESAI 17/9/2024. PEMBIAYAAN 176K + PROFIT 70K = 246K (MINUS 6K SEDEKAH MASJID)', v_user_id)
  RETURNING id INTO v_fasiliti_id;

  INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
  (v_fasiliti_id, '2021-08-10', 'Kelulusan pecah lot PT 24405 & 24406 diterima.', v_user_id),
  (v_fasiliti_id, '2024-09-17', 'Transaksi akhir penerimaan Tunai MD 240K.', v_user_id);

  -- Loop memasukkan Baki Rekod JV Tanah (Rekod 3 hingga 17)
  FOR i IN 3..17 LOOP
    INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, perkongsian_keuntungan, tunggakan_dividen, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, harga_jualan, catatan_am, dicipta_oleh)
    VALUES (
      'JVT-20' || i,
      'jv_tanah',
      'PEMBIAYA LAND ' || i || ' ENTERPRISE',
      'MF PROPERTIES',
      (150000 + (i * 20000))::DECIMAL,
      ('2022-0' || (i % 9 + 1) || '-01')::DATE,
      'TANAH ALUR LIMBAT LOT ' || (4000 + i) || ' (TANAH SAWIT)',
      (350000 + i * 30000)::DECIMAL,
      (40000 + i * 5000)::DECIMAL,
      CASE WHEN i % 4 = 0 THEN (25000 + i * 2000)::DECIMAL ELSE 0.00 END,
      0.00,
      CASE WHEN i % 4 = 0 THEN (25000 + i * 2000)::DECIMAL ELSE 0.00 END,
      CASE WHEN i % 4 = 0 THEN 'tertunggak'::fasiliti_status ELSE 'aktif'::fasiliti_status END,
      'MOHD FIRDAUS BIN ABD RAHMAN',
      'DALAM PROSES PECAH LOT',
      (300000 + i * 20000) || ' - TERES 2 TINGKAT',
      'Projek pembangunan perumahan lot usahasama tanah ' || i,
      v_user_id
    )
    RETURNING id INTO v_fasiliti_id;

    INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
    (v_fasiliti_id, '2022-10-15', 'Proses pengukuran jurukur tanah di tapak.', v_user_id),
    (v_fasiliti_id, '2023-11-20', 'Kemaskini permohonan kebenaran merancang.', v_user_id);
  END LOOP;

  -- -------------------------------------------------------------
  -- 3. PERSONAL LOAN — Pinjaman Individu (17 Rekod)
  -- -------------------------------------------------------------

  -- Rekod 1
  INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, kadar_dividen, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, catatan_am, dicipta_oleh)
  VALUES ('PL-301', 'pinjaman_individu', 'NELANG SECURITY SDN BHD', 'HAFIZ SHELL (MEGAHJAYA OTOMOBIL)', 300000.00, '2023-01-01', 'GM 9511 LOT 14101 MUKIM BUKIT PAYUNG TERENGGANU', 500000.00, '10% PER ANNUM', 0.00, 300000.00, 'tertunggak', 'FARAH NIZAH BINTI JAPILOS', 'HAK MILIK PN FARAH', 'JIKA RUMAH DIJUAL DALAM MASA 1 TAHUN, 20% HARGA JUALAN SELEPAS HUTANG AKAN DISERAHKAN PADA MD', v_user_id)
  RETURNING id INTO v_fasiliti_id;

  INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
  (v_fasiliti_id, '2023-01-10', 'Pencairan modal pinjaman RM300,000 disahkan.', v_user_id),
  (v_fasiliti_id, '2023-07-15', 'Perbincangan cadangan jualan hartanah cagaran.', v_user_id),
  (v_fasiliti_id, '2024-01-05', 'Notis peringatan tunggakan pinjaman individu diserahkan.', v_user_id);

  -- Rekod 2
  INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, kadar_dividen, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, catatan_am, dicipta_oleh)
  VALUES ('PL-302', 'pinjaman_individu', 'MUAZ SERVICES SDN BHD', 'MUHAMAD AZMIDI BIN ABDULLAH', 80000.00, '2025-12-04', 'NO. HSM 5819 PT 104675', 180000.00, 'TEMPOH 8 TAHUN (80K/TAHUN)', 10000.00, 90000.00, 'aktif', 'MUHAMAD AZMIDI BIN ABDULLAH', 'PENAMA ASAL', 'PINJAMAN AKAN DIBAYAR DALAM TEMPOH 8 TAHUN SEBANYAK RM80K & TAMBAHAN RM10K DENGAN RELA HATI', v_user_id)
  RETURNING id INTO v_fasiliti_id;

  INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
  (v_fasiliti_id, '2025-12-04', 'Pinjaman modal diberi secara rasmi.', v_user_id),
  (v_fasiliti_id, '2026-02-01', 'Penyemakan jadual bayaran balik tahunan.', v_user_id);

  -- Loop memasukkan Baki Rekod Personal Loan (Rekod 3 hingga 17)
  FOR i IN 3..17 LOOP
    INSERT INTO fasiliti (kod_rujukan, kategori, pembiaya_modal, nama_peminjam, jumlah_pembiayaan, tarikh_mula, ringkasan_cagaran, nilai_cagaran, kadar_dividen, bayaran_tambahan, jumlah_tunggakan_semasa, status_fasiliti, penama_aset, status_pindahmilik, catatan_am, dicipta_oleh)
    VALUES (
      'PL-30' || i,
      'pinjaman_individu',
      'MOHD AZRUL BIN ZAKARIA (CASH)',
      'PEMINJAM INDIVIDU ' || i,
      (20000 + (i * 15000))::DECIMAL,
      ('2024-0' || (i % 9 + 1) || '-10')::DATE,
      'GERAN LOT ' || (8000 + i) || ' KUALA TERENGGANU',
      (100000 + i * 15000)::DECIMAL,
      'DIVIDEN RM 1,500/BULAN',
      CASE WHEN i % 3 = 0 THEN 2000.00 ELSE 0.00 END,
      CASE WHEN i % 3 = 0 THEN (22000 + i * 15000)::DECIMAL ELSE 0.00 END,
      CASE WHEN i % 3 = 0 THEN 'tertunggak'::fasiliti_status ELSE 'aktif'::fasiliti_status END,
      'PEMINJAM INDIVIDU ' || i,
      'GERAN CAGARAN PEGUAM',
      'Pinjaman peribadi sahabat dengan komitmen bulanan ' || i,
      v_user_id
    )
    RETURNING id INTO v_fasiliti_id;

    INSERT INTO susulan (fasiliti_id, tarikh_susulan, catatan, dicatat_oleh) VALUES
    (v_fasiliti_id, '2024-05-10', 'Perjanjian pinjaman peribadi ditandatangani.', v_user_id),
    (v_fasiliti_id, '2024-11-25', 'Bayaran balik bulanan disahkan melalui pemindahan bank.', v_user_id);
  END LOOP;

  -- -------------------------------------------------------------
  -- 4. TANAH MD (JV) — Pendaftaran Tanah (15 Rekod Tanah)
  -- -------------------------------------------------------------

  INSERT INTO tanah_jv (negeri, daerah, bandar_mukim, tempat, no_lot, tarikh_daftar, no_hak_milik, luas_meter_persegi, anggaran_nilaian, catatan, dicipta_oleh) VALUES
  ('TERENGGANU', 'HULU TERENGGANU', 'MUKIM TANGGUL', 'BUKIT TOK SETOL', 'LOT 65127', '2021-01-07', '8882', 327.0000, 1500000.00, 'JV EN. WAHID (RM650K)', v_user_id),
  ('TERENGGANU', 'HULU TERENGGANU', 'MUKIM TANGGUL', 'BUKIT TOK SETOL', 'LOT 65128', '2021-01-07', '8883', 130.0000, 1500000.00, 'JV EN. WAHID (RM650K)', v_user_id),
  ('TERENGGANU', 'HULU TERENGGANU', 'MUKIM TANGGUL', 'BUKIT TOK SETOL', 'LOT 65129', '2021-01-07', '8884', 130.0000, 1500000.00, 'JV EN. WAHID (RM650K)', v_user_id),
  ('TERENGGANU', 'HULU TERENGGANU', 'MUKIM TANGGUL', 'BUKIT TOK SETOL', 'LOT 65130', '2021-01-07', '8885', 130.0000, 1500000.00, 'JV EN. WAHID (RM650K)', v_user_id),
  ('TERENGGANU', 'HULU TERENGGANU', 'MUKIM TANGGUL', 'BUKIT TOK SETOL', 'LOT 65131', '2021-01-07', '8886', 130.0000, 1500000.00, 'JV EN. WAHID (RM650K)', v_user_id),
  ('TERENGGANU', 'MARANG', 'MUKIM BUKIT PAYUNG', 'BUKIT PAYUNG', 'LOT 5254', '1972-07-30', '5917', 1158433.5670, 4000000.00, 'JV3 2.5JUTA. BELUM DITUKARKAN KE NAMA EN. AZRUL. SALAH SEORANG PENAMA MENINGGAL', v_user_id),
  ('TERENGGANU', 'MARANG', 'MUKIM RUSILA', 'KAMPUNG RUSILA', 'LOT 1042', '2019-05-14', '7721', 450.0000, 250000.00, 'Pembangunan rumah lot kediaman', v_user_id),
  ('TERENGGANU', 'KUALA TERENGGANU', 'MUKIM KUALA IBAI', 'KUALA IBAI', 'LOT 3091', '2020-08-20', '9102', 820.0000, 680000.00, 'Tanah tepi jalan utama Kuala Ibai', v_user_id),
  ('TERENGGANU', 'KUALA TERENGGANU', 'MUKIM CHENDERING', 'CHENDERING', 'LOT 804', '2022-03-11', '10492', 1250.0000, 950000.00, 'Kawasan perindustrian ringan Chendering', v_user_id),
  ('TERENGGANU', 'MARANG', 'MUKIM BUKIT PAYUNG', 'BUKIT PAYUNG', 'LOT 8901', '2023-01-18', '11029', 650.0000, 380000.00, 'Lot perumahan usahasama', v_user_id);

  RAISE NOTICE 'Berjaya memasukkan 51+ rekod fasiliti, pendaftaran tanah, dan kronologi susulan!';
END $$;
