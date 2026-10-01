# DTY Works | Sistem Absensi

Aplikasi pencatatan kehadiran dan pengelolaan data karyawan untuk lingkungan manufaktur Drawn Textured Yarn (DTY), dibuat dengan HTML, CSS, dan JavaScript.

## Versi statis

Buka [index.html](index.html) untuk mengakses sistem absensi, termasuk ringkasan operasional, pengelolaan karyawan, pengajuan kehadiran, persetujuan administrator, riwayat, dan ekspor laporan CSV. Aplikasi tidak memerlukan PHP, database, instalasi paket, atau proses build.

Karyawan aktif menggunakan NIK sebagai nama pengguna. Karyawan dapat mencatat kehadiran atau mengajukan izin sakit melalui portal pribadi. Pengajuan izin sakit wajib menyertakan SKD dalam format PDF, JPG, atau PNG dengan ukuran maksimal 1 MB; keterangan bersifat opsional. Administrator dapat menyetujui atau menolak pengajuan pada menu Absensi. Karyawan dapat mencatat waktu pulang setelah pengajuan kehadiran disetujui. Catatan lama tanpa status persetujuan akan ditandai menunggu tinjauan administrator.

Autentikasi berjalan di browser dan belum menggunakan layanan autentikasi server. Data absensi disimpan di `localStorage` pada browser/perangkat masing-masing, tidak tersinkron antar pengguna, dan dapat diubah oleh pengguna perangkat. Jangan gunakan aplikasi ini untuk melindungi data sensitif atau sebagai sistem produksi. Gunakan **Cadangkan** dan **Pulihkan** pada halaman Karyawan untuk memindahkan data dalam format JSON.

## Publikasikan ke GitHub Pages

1. Upload seluruh repository ke GitHub.
2. Buka **Settings → Pages** pada repository.
3. Pada **Build and deployment**, pilih **Deploy from a branch**, lalu pilih branch utama dan folder **/(root)**.
4. Simpan pengaturan dan buka URL Pages yang diberikan GitHub. `index.html` di root menjadi halaman awal.

Untuk mencoba tanpa hosting, buka `index.html` langsung di browser. Setiap tab login secara terpisah; logout mengakhiri sesi tab saat itu.
