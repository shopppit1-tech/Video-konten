# SubtitleAI - Terjemahan & Subtitle Otomatis Video dengan Gemini AI

Aplikasi web modern berbasis AI untuk mentranskripsi, menerjemahkan, dan menempelkan (*burn*) subtitle bergaya viral ke video pendek vertikal (TikTok, Instagram Reels, YouTube Shorts). Didukung oleh Google Gemini AI untuk akurasi tinggi dan sinkronisasi presisi.

Dapat diinstal langsung di HP Android / iOS sebagai aplikasi mandiri (PWA / Progressive Web App).

---

## ✨ Fitur Unggulan

- **Otomatis dengan Gemini AI**: Transkripsi audio, penerjemahan antar bahasa (Indonesia, Inggris, Jepang, Mandarin, Arab, dll.), serta penyusunan caption media sosial secara otomatis.
- **Sinkronisasi Presisi Subtitle**: Pemetaan detik dan milidetik yang akurat dengan animasi kata aktif (*word-by-word highlight*).
- **Koleksi Template Subtitle Viral**: Pilihan gaya subtitle siap pakai:
  - *MrBeast Bold*: Teks kuning-hitam tebal dengan pop animasi.
  - *Alex Hormozi*: Huruf kapital kuning neon dengan penekanan kata kunci.
  - *Ali Abdaal Clean*: Tipografi minimalis modern berlatar belakang semi-transparan.
  - *Neon Cyberpunk*, *Aesthetic Vlog*, *TikTok Viral*, dan lainnya.
- **Penyesuaian Fleksibel**: Atur ukuran font (18px - 64px), posisi (Bawah, Tengah, Atas), offset sinkronisasi waktu, dan teks terjemahan secara bebas.
- **Unduhan Cepat & Lengkap**:
  - Unduh video dengan subtitle tertempel langsung (MP4 / WebM)
  - Unduh video asli
  - Ekspor file teks `.SRT` dan `.VTT`
- **PWA (Progressive Web App)**: Bisa diinstal di layar utama smartphone Android & iOS layaknya aplikasi native (APK).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons, Canvas API, MediaRecorder API
- **Backend**: Node.js, Express, TypeScript (`tsx`)
- **AI Engine**: Google Gemini API (`@google/genai`)
- **PWA**: `vite-plugin-pwa`, Service Workers, Web App Manifest

---

## 🚀 Panduan Memulai (Local Setup)

### 1. Kloning Repositori
```bash
git clone <URL_REPO_GITHUB_ANDA>
cd <NAMA_FOLDER>
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable
Salin `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan masukkan API Key Gemini Anda:
```env
GEMINI_API_KEY=AIzaSy...
PORT=3000
```
> Catatan: Dapatkan API Key Gemini secara gratis di [Google AI Studio](https://aistudio.google.com/).

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka peramban di `http://localhost:3000`.

---

## 📦 Build untuk Produksi
```bash
# Build bundle frontend
npm run build

# Menjalankan server produksi
npm start
```

---

## 📱 Cara Instal Sebagai APK / PWA di HP

1. Buka tautan web app di browser Chrome (Android) atau Safari (iOS).
2. Di Chrome: Ketuk tombol **Install APK** atau menu titik tiga `⋮` > **Tambahkan ke Layar Utama** (*Install App*).
3. Di Safari: Ketuk tombol **Bagikan** (*Share icon*) > **Tambahkan ke Layar Utama** (*Add to Home Screen*).
4. Aplikasi akan terpasang di menu HP Anda dan dapat dibuka tanpa bar navigasi browser.

---

## 📄 Lisensi
MIT License
