# OKR Dashboard (ERA, Insurance, Repossession)

Dashboard 2 halaman untuk memantau OKR Operasional:

- **`index.html`** — Halaman utama: ringkasan OKR ERA, Insurance, dan Repossession.
- **`insurance-detail.html`** — Halaman detail Insurance OKR per kategori partner (GRAB - OONA, GRAB - AVRIST, NON GRAB - OONA, NON GRAB - AVRIST, NON GRAB - SINAR MAS, GRAB - ALL RISK, NON GRAB - ALL RISK), lengkap dengan filter tanggal dan filter kategori.

Data dashboard **tidak ditulis di dalam kode HTML**, melainkan dibaca otomatis dari file JSON di folder `data/`. Jadi untuk mengubah/menambah data, Anda cukup edit file JSON di GitHub — tidak perlu sentuh kode sama sekali.

## Struktur folder

```
okr-dashboard/
├── index.html                 ← Halaman 1 (dashboard utama)
├── insurance-detail.html      ← Halaman 2 (detail insurance per partner)
├── assets/
│   ├── style.css              ← styling bersama kedua halaman
│   └── common.js               ← fungsi bantu bersama (perhitungan achievement, chart, dsb.)
└── data/
    ├── era.json                ← Key Result ERA OKR
    ├── insurance.json          ← Key Result Insurance OKR (ringkasan halaman 1)
    ├── repossession.json       ← Key Result Repossession OKR
    └── insurance_detail.json   ← Detail Insurance OKR per tanggal & per kategori partner (halaman 2)
```

## Cara deploy ke GitHub Pages

1. Buat repository baru di GitHub (public atau private, keduanya bisa pakai GitHub Pages — untuk repo private butuh plan GitHub Pro/Team/Enterprise agar Pages aktif).
2. Upload seluruh isi folder ini (pertahankan strukturnya — folder `assets/` dan `data/` harus ikut ter-upload, bukan cuma file `.html`).
   - Termudah: gunakan `git` di terminal:
     ```bash
     git init
     git add .
     git commit -m "Initial OKR dashboard"
     git branch -M main
     git remote add origin https://github.com/USERNAME/NAMA-REPO.git
     git push -u origin main
     ```
   - Atau lewat web GitHub: klik **Add file → Upload files**, lalu drag seluruh folder (`index.html`, `insurance-detail.html`, `assets/`, `data/`) ke area upload.
3. Di repository, buka **Settings → Pages**.
4. Pada **Source**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
5. Tunggu 1–2 menit, GitHub akan memberi URL seperti `https://USERNAME.github.io/NAMA-REPO/`. Buka URL tersebut — halaman `index.html` akan tampil otomatis.

## Cara update data (tanpa sentuh kode)

Setiap kali Anda ingin memperbarui angka OKR:

1. Buka file JSON yang sesuai di folder `data/` langsung di GitHub (klik file → ikon pensil "Edit").
2. Ubah nilai `actual`, `target`, atau `weight` sesuai kebutuhan, atau tambahkan baris baru (misalnya periode/tanggal baru untuk `insurance_detail.json`).
3. Klik **Commit changes**.
4. Refresh halaman dashboard (`index.html` atau `insurance-detail.html`) — data terbaru akan otomatis termuat karena halaman melakukan `fetch()` ke file JSON tersebut setiap kali dibuka.

### Format `era.json` / `insurance.json` / `repossession.json`

Array of object, satu object = satu Key Result:

```json
{
  "id": "ins1",
  "icon": "📋",
  "label": "Reported to Insurer",
  "target": 95,
  "actual": 95,
  "weight": 30,
  "unit": "% OF TOTAL WO",
  "direction": "higher"
}
```

- `direction`: `"higher"` artinya makin besar aktual makin baik (achievement = aktual/target × 100%). `"lower"` artinya makin kecil aktual makin baik, dipakai untuk metrik waktu di ERA (achievement = target/aktual × 100%).
- `weight`: bobot Key Result tersebut dalam grup (total weight idealnya 100 per grup, dipakai untuk menghitung *weighted total achievement* di ring header kartu).

### Format `insurance_detail.json`

Array of object, satu object = satu Key Result untuk satu kombinasi **tanggal + kategori partner**:

```json
{
  "date": "2026-07-01",
  "category": "GRAB_OONA",
  "kr_id": "ins1",
  "label": "Reported to Insurer",
  "icon": "📋",
  "target": 95,
  "actual": 93.5,
  "weight": 30,
  "unit": "% OF TOTAL WO",
  "direction": "higher"
}
```

Nilai `category` yang valid (harus sama persis, huruf besar & underscore):

| category value        | Ditampilkan sebagai        |
|------------------------|-----------------------------|
| `GRAB_OONA`            | GRAB - OONA                |
| `GRAB_AVRIST`          | GRAB - AVRIST               |
| `NON_GRAB_OONA`        | NON GRAB - OONA             |
| `NON_GRAB_AVRIST`      | NON GRAB - AVRIST           |
| `NON_GRAB_SINARMAS`    | NON GRAB - SINAR MAS        |
| `GRAB_ALL_RISK`        | GRAB - ALL RISK             |
| `NON_GRAB_ALL_RISK`    | NON GRAB - ALL RISK         |

Untuk menambah periode baru (misal data bulan berikutnya), cukup **tambahkan baris-baris baru** dengan `date` baru untuk tiap kategori × tiap Key Result (5 Key Result standar: `ins1` Reported to Insurer, `ins2` SPK Issued, `ins3` Invoiced, `ins4` Paid or Disbursed, `ins5` Renewed). Tanggal baru akan otomatis muncul di dropdown filter tanggal pada halaman `insurance-detail.html`.

Jika ingin mengganti daftar kategori (nama/warna), edit array `INSURANCE_CATEGORIES` di `assets/common.js`.

## Catatan penting

- Edit langsung di tabel dashboard (kolom Target/Aktual/Weight) di browser **hanya untuk pratinjau sementara** — tidak tersimpan permanen dan akan hilang saat halaman direfresh. Sumber kebenaran (source of truth) data adalah file JSON di folder `data/`.
- Dashboard ini dibangun dengan HTML/CSS/JS murni (tanpa build step, tanpa backend), jadi bisa langsung dibuka setelah di-hosting sebagai static site (GitHub Pages, Netlify, Vercel, dsb.).
- Jika dibuka langsung dari file lokal (`file://...`) tanpa web server, fetch ke file JSON bisa gagal karena kebijakan browser — di kondisi ini dashboard otomatis jatuh ke data contoh bawaan (fallback) yang ada di dalam kode, supaya halaman tetap tampil.
