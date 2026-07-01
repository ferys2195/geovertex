export const SURAT_TANAH_TEMPLATE: Record<string, string> = {
  // === Identitas Pemilik ===
  pemilik_nama: '',
  pemilik_ttl: '',
  pemilik_nik: '',
  pemilik_jenis_kelamin: '',
  pemilik_alamat: '',
  pemilik_pekerjaan: '',
  pemilik_kewarganegaraan: 'Indonesia',

  // === RT / RW ===
  rt: '',
  rw: '',
  nama_rt: '',

  // === Pejabat ===
  pejabat_kades: '',
  pejabat_camat: '',
  pejabat_nip_camat: '',
  pejabat_pangkat: '',
  pejabat_kasi_pem: '',
  pejabat_petugas_pengukur: '',
  pejabat_mantir: '',

  // === Tanggal ===
  tgl_permohonan: '',
  tgl_surat_tugas: '',
  tgl_pengukuran: '',
  meta_is_hgu: 'false', // Default to string representation for simple input

  // === Tanah ===
  tanah_letak: '',
  tanah_panjang: '',
  tanah_lebar: '',
  tanah_luas: '',
  tanah_peruntukan: '',
  tanah_riwayat: '',

  // === Batas ===
  batas_utara: '',
  batas_timur: '',
  batas_selatan: '',
  batas_barat: '',
};

export const TEMPLATES = {
  'surat_tanah': {
    name: 'Template Surat Tanah',
    data: SURAT_TANAH_TEMPLATE
  }
};
