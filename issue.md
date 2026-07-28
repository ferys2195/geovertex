# 📋 Laporan Temuan & Maskom (Issues Report)

Dokumen ini berisi daftar temuan masalah, kebutuhan perbaikan UI/UX, dan pengembangan fitur baru pada aplikasi **GeoVertex**.

---

## 1. 📱 Responsivitas Navbar & Padding Button Login pada Mobile Device

### 📌 Ringkasan
Tampilan Navbar pada halaman Login kurang responsif saat diakses melalui perangkat seluler (mobile device). Selain itu, tombol **"Lanjutkan dengan akun Google"** memiliki padding horizontal (kiri-kanan) yang kurang memadai di layar kecil.

### 🔍 Detail Temuan
- **Navbar Mobile**: Elemen navigasi/header pada halaman login tidak tertata rapi saat diakses dari viewport mobile device.
- **Google Sign-In Button**: Padding horizontal (`padding-left` & `padding-right`) pada tombol Google Sign-In terlalu sempit pada layar kecil sehingga memotong visual/kurang proporsional.
- **Cakupan Masalah**: Khusus *Mobile Device*. Tampilan pada Desktop berjalan normal tanpa kendala.

### 🎯 Rencana Perbaikan
1. Perbarui responsivitas komponen Navbar/Header pada halaman login dengan penyesuaian breakpoint CSS/Tailwind (`sm:`, `md:`).
2. Tambahkan padding horizontal yang fleksibel/responsif pada tombol Google Sign-In agar proporsional di mobile.

---

## 2. 📁 Proyek Terbagi (Shared Project) Tidak Muncul di Daftar Proyek Collaborator & Badge Role

### 📌 Ringkasan
Saat seorang pengguna (misalnya Pengguna A) ditambahkan sebagai *collaborator* pada suatu proyek, proyek tersebut tidak muncul di halaman daftar proyek (Project List) milik Pengguna A. Perlu penambahan proyek terbagi ke daftar proyek serta penampil *Badge Role* pada setiap kartu proyek.

### 🔍 Detail Temuan
- **Fetching Project List**: Query/logic pemanggilan daftar proyek saat ini hanya mengambil proyek di mana pengguna adalah *owner*, sehingga proyek di mana pengguna terdaftar sebagai *collaborator* tidak ikut terpanggil.
- **Visual Role Badge**: Belum ada indikator visual (*badge*) yang membedakan peran pengguna pada kartu proyek di halaman daftar proyek.

### 🎯 Rencana Perbaikan
1. **Query Consolidation**: Perbarui logic fetching data proyek agar menggabungkan proyek yang dimiliki (*Owned*) dan proyek yang dibagikan (*Shared/Collaborated*).
2. **UI Role Badge**: Tambahkan komponen Badge pada setiap item/kartu proyek untuk menampilkan role pengguna terhadap proyek tersebut (misalnya: `Owner`, `Editor`, `Viewer`).

---

## 3. 📧 Setup Email Notification untuk Collaborator Baru

### 📌 Ringkasan
Saat ini, tidak ada notifikasi email yang terkirim ke alamat email *collaborator* ketika sebuah proyek dibagikan kepadanya.

### 🔍 Detail Temuan
- Penambahan *collaborator* saat ini hanya menyimpan data di database tanpa memicu integrasi notifikasi email.
- Collaborator tidak mengetahui bahwa dirinya telah diberi akses ke proyek baru kecuali diberi tahu secara manual.

### 🎯 Rencana Perbaikan
1. **Setup Email Service**: Konfigurasi layanan pengiriman email (misalnya Resend, Supabase Edge Functions, atau Nodemailer/SendGrid).
2. **Email Template**: Buat template email pemberitahuan/undangan (menyebutkan judul proyek, nama pemberi akses, role yang diberikan, dan link ke proyek).
3. **Integration**: Integrasikan trigger pengiriman email ke dalam alur (flow) saat berhasil menambahkan *collaborator*.

---

*Status: Open / Ready for Prioritization*
