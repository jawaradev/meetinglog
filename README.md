# 📑 MeetingLog Pro - Attendance & Minutes System

Sistem manajemen absensi dan notulensi rapat berbasis web yang bekerja secara **Real-time** menggunakan Firebase. Dirancang untuk memudahkan instansi dalam mendata kehadiran pegawai melalui scan QR Code dan mengarsipkan hasil rapat secara digital.



## ✨ Fitur Utama
* **Real-time Dashboard**: Pantau kehadiran pegawai secara langsung tanpa refresh halaman.
* **Self-Service Presence**: Pegawai dapat melakukan absensi mandiri melalui portal khusus (`client.html`).
* **QR Code Generator**: Generate QR Code otomatis yang mengarah langsung ke portal pegawai.
* **Digital Minutes (Notulensi)**: Catat poin-poin rapat dan simpan permanen ke database.
* **Employee Management**: Kelola data pegawai (Tambah/Hapus) dengan proteksi password.
* **Modern UI**: Menggunakan Tailwind CSS untuk tampilan yang bersih dan responsif.

## 🚀 Teknologi yang Digunakan
* **Frontend**: HTML5, Tailwind CSS, Lucide Icons.
* **Backend/Database**: Firebase Realtime Database (Serverless).
* **Library**: QRCode.js, Firebase SDK v10.



## 🛠️ Cara Penggunaan

### 1. Sisi Admin (index.html)
1.  Buka tab **Pegawai** untuk mendaftarkan staf (Nama, Username, Password, Jabatan).
2.  Buka tab **Dashboard** dan klik **Buka Presensi**.
3.  Tampilkan QR Code agar scan oleh pegawai atau bagikan link `client.html`.
4.  Setelah rapat selesai, isi form **Notulensi** dan klik **Simpan & Reset**.

### 2. Sisi Pegawai (client.html)
1.  Scan QR Code atau buka link portal.
2.  Login menggunakan **Username** dan **Password** yang diberikan Admin.
3.  Klik tombol **"Saya Hadir"** (Hanya muncul jika sesi dibuka oleh Admin).
4.  Lihat **Riwayat Hasil Rapat** di bagian bawah untuk melihat poin-poin rapat sebelumnya.

## 📦 Cara Instalasi
1.  Clone repository ini atau download file ZIP.
2.  Buat proyek baru di [Firebase Console](https://console.firebase.google.com/).
3.  Aktifkan **Realtime Database** dan set Rules ke `true`.
4.  Copy API Config Firebase Anda ke dalam file `app.js` dan `client.html`.
5.  Buka `index.html` di browser Anda!

---
*Dibuat dengan ❤️ untuk efisiensi koordinasi tim.*
