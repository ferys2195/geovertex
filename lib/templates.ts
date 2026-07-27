export const TEMPLATES = {
  legalitas: {
    name: 'Legalitas & Hak Tanah',
    data: {
      no_sertifikat: '',
      nama_pemilik: '',
      jenis_hak: 'SHM',
      tanggal_terbit: '',
      nib: '',
    },
  },
  perpajakan: {
    name: 'Perpajakan & Valuasi',
    data: {
      nop_pbb: '',
      njop_per_m2: '',
      est_nilai_lahan: '',
    },
  },
  zonasi: {
    name: 'Tata Ruang & Zonasi',
    data: {
      zonasi: '',
      kdb_persen: '',
      klb_ratio: '',
      peruntukan: '',
    },
  },
  survei: {
    name: 'Survei Lapangan',
    data: {
      penggunaan_lahan: '',
      kondisi_fisik: '',
      akses_jalan: '',
      surveyor: '',
    },
  },
} as const;

