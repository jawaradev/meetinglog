import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIG FIREBASE ---
// Ganti dengan data asli dari Firebase Console Anda
const firebaseConfig = {
    apiKey: "AIzaSyAGuucmAX4S-RDGAFQ46ZXBDLy8BMP4o4A",
    authDomain: "meetinglog-7fb47.firebaseapp.com",

    databaseURL: "https://meetinglog-7fb47-default-rtdb.asia-southeast1.firebasedatabase.app", 
    projectId: "meetinglog-7fb47",
    storageBucket: "meetinglog-7fb47.firebasestorage.app",
    messagingSenderId: "831186403206",
    appId: "1:831186403206:web:93a6cb0ba052973261b607"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- EXPOSE TO WINDOW ---
// Agar fungsi dapat dipanggil dari atribut onclick di HTML
window.switchTab = switchTab;
window.toggleAbsensi = toggleAbsensi;
window.absenkanPegawai = absenkanPegawai;
window.simpanNotulensi = simpanNotulensi;
window.simpanPegawai = simpanPegawai;
window.hapusPegawai = (id) => { if(confirm("Hapus pegawai ini?")) remove(ref(db, `pegawai/${id}`)); };
window.hapusNotulensi = (id) => { if(confirm("Hapus notulensi ini?")) remove(ref(db, `notulensi/${id}`)); };

// --- LISTENERS (REALTIME) ---

// 1. Monitor Status Buka/Tutup Absensi
onValue(ref(db, 'status_absensi'), (s) => {
    const data = s.val();
    const isOpen = data ? data.absensi_terbuka : false;
    
    const btnBuka = document.getElementById('btn-buka');
    const btnTutup = document.getElementById('btn-tutup');
    const statusTxt = document.getElementById('absensi-status');

    if (isOpen) {
        // Mode: Sesi Terbuka
        if (btnBuka) btnBuka.style.display = 'none'; // Pastikan hilang
        if (btnTutup) btnTutup.style.display = 'inline-block'; // Pastikan muncul
        
        if (statusTxt) {
            statusTxt.innerText = "Sesi Terbuka - Silakan klik nama Anda";
            statusTxt.className = "mt-4 inline-block px-4 py-2 rounded-xl text-sm font-bold bg-green-100 text-green-600";
        }
    } else {
        // Mode: Sesi Tertutup
        if (btnBuka) btnBuka.style.display = 'inline-block';
        if (btnTutup) btnTutup.style.display = 'none';
        
        if (statusTxt) {
            statusTxt.innerText = "Sesi ditutup oleh Admin";
            statusTxt.className = "mt-4 inline-block px-4 py-2 rounded-xl text-sm font-bold bg-gray-100 text-black animate-pulse";
        }
    }
});

// 2. Monitor Kehadiran Realtime
onValue(ref(db, 'kehadiran'), (s) => {
    const data = s.val() ? Object.values(s.val()) : [];
    const countEl = document.getElementById('count-hadir');
    if(countEl) countEl.innerText = data.length;
    
    const list = document.getElementById('list-kehadiran');
    if(list) {
        list.innerHTML = data.map(p => `
            <div class="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center animate-card">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-primary"><i data-lucide="user"></i></div>
                    <div><p class="font-bold text-sm">${p.nama}</p><p class="text-[10px] text-gray-400">${new Date(p.waktu).toLocaleTimeString()}</p></div>
                </div>
                <i data-lucide="check-circle" class="text-green-500 w-5 h-5"></i>
            </div>`).join('');
    }
    
    renderKartuPresensi(data);
    lucide.createIcons();
});

// 3. Monitor Master Data Pegawai
onValue(ref(db, 'pegawai'), (s) => {
    const data = s.val() ? Object.entries(s.val()) : [];
    const container = document.getElementById('list-master-pegawai');
    if(!container) return;

    container.innerHTML = data.map(([id, p]) => `
        <div class="bg-white p-5 rounded-[2rem] filament-shadow border border-gray-50 flex justify-between items-center group transition-all duration-300">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-primary">
                    <i data-lucide="user"></i>
                </div>
                <div>
                    <p class="font-bold text-gray-800">${p.nama}</p>
                    <p class="text-[10px] text-gray-400 uppercase font-black tracking-widest">${p.jabatan}</p>
                    <p class="text-[9px] text-orange-300 font-mono">User: ${p.username}</p>
                </div>
            </div>
            <button onclick="hapusPegawai('${id}')" class="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
        </div>`).join('');
    lucide.createIcons();
});

// 4. Monitor Notulensi
onValue(ref(db, 'notulensi'), (s) => {
    const data = s.val() ? Object.entries(s.val()).reverse() : [];
    const container = document.getElementById('container-notulensi');
    const countEl = document.getElementById('count-notulensi');
    
    if(countEl) countEl.innerText = `Total: ${data.length} Records`;
    if(!container) return;

    if(data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 opacity-40">
                <i data-lucide="folder-open" class="mx-auto w-12 h-12 mb-2"></i>
                <p class="text-sm">Belum ada riwayat pembahasan</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    container.innerHTML = data.map(([id, n]) => {
        // Format tanggal agar lebih manusiawi (Misal: 28 Feb 2026)
        const tgl = n.tanggal ? new Date(n.tanggal).toLocaleDateString('id-ID', { 
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        }) : '-';

        return `
        <div class="bg-white rounded-[2.5rem] p-8 filament-shadow border border-gray-100 mb-6 relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
            
            <div class="flex justify-between items-start mb-4">
                <div>
                    <span class="bg-orange-100 text-orange-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
                        ${n.materi}
                    </span>
                    <h4 class="text-xl font-extrabold text-gray-800 mt-2">Pembicara: ${n.pembicara}</h4>
                </div>
                <button onclick="hapusNotulensi('${id}')" class="text-gray-300 hover:text-red-500 transition-colors">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>

            <div class="space-y-4">
                <div class="bg-gray-50 p-4 rounded-2xl">
                    <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Isi Pembahasan:</p>
                    <p class="text-sm text-gray-600 leading-relaxed">${n.isi}</p>
                </div>

                ${n.keputusan ? `
                <div class="bg-green-50 p-4 rounded-2xl border border-green-100">
                    <p class="text-[10px] font-bold text-green-600 uppercase mb-1 flex items-center gap-1">
                        <i data-lucide="check-circle" class="w-3 h-3"></i> Keputusan Akhir:
                    </p>
                    <p class="text-sm text-green-800 font-bold">${n.keputusan}</p>
                </div>
                ` : ''}
            </div>

            <div class="mt-6 pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                <p class="text-[10px] text-gray-400 font-medium italic">Hadir: ${n.daftar_hadir}</p>
                <p class="text-[10px] text-gray-300">${new Date(n.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
        </div>`;
    }).join('');
    
    lucide.createIcons();
});

// --- FUNCTIONS ---

function switchTab(tab) {
    // 1. Sembunyikan semua section konten tab
    document.querySelectorAll('section[id^="tab-"]').forEach(s => s.classList.add('hidden'));
    
    // 2. Tampilkan section tab yang dipilih
    const targetSection = document.getElementById(`tab-${tab}`);
    if (targetSection) targetSection.classList.remove('hidden');

    // 3. Logika Navigasi (Warna Orange hanya pada yang aktif)
    // Ambil semua elemen navigasi (pastikan tombol nav Anda punya class 'nav-link')
    document.querySelectorAll('.nav-link').forEach(btn => {
        // Reset semua ke gaya default (abu-abu/tidak aktif)
        btn.classList.remove('bg-orange-500', 'text-white', 'shadow-lg', 'shadow-orange-200');
        btn.classList.add('text-gray-400', 'bg-transparent');
    });

    // 4. Berikan warna orange pada tombol yang ID-nya cocok (misal: nav-dashboard)
    const activeBtn = document.getElementById(`nav-${tab}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400', 'bg-transparent');
        activeBtn.classList.add('bg-orange-500', 'text-white', 'shadow-lg', 'shadow-orange-200');
    }

    // Fungsi tambahan Anda sebelumnya
    if(tab === 'admin') generateQRCode();
    lucide.createIcons();
}

function toggleAbsensi(status) {
    set(ref(db, 'status_absensi'), { absensi_terbuka: status });
}

async function absenkanPegawai(nama, jabatan) {
    // 1. Ambil status terbaru dari database secara manual (sekali saja)
    const statusRef = ref(db, 'status_absensi/absensi_terbuka');
    
    // Kita gunakan onValue dengan onlyOnce untuk cek status sebelum push data
    onValue(ref(db, 'status_absensi'), (snapshot) => {
        const isOpen = snapshot.val()?.absensi_terbuka || false;

        if (!isOpen) {
            alert("⚠️ Maaf, sesi presensi sudah ditutup oleh Admin.");
            return;
        }

        // 2. Jika terbuka, baru proses simpan kehadiran
        push(ref(db, 'kehadiran'), { 
            nama, 
            jabatan, 
            waktu: new Date().toISOString() 
        }).then(() => {
            alert(`✅ Terima kasih ${nama}, kehadiran Anda telah dicatat.`);
        }).catch((err) => {
            alert("Gagal melakukan absensi: " + err.message);
        });

    }, { onlyOnce: true });
}

function simpanPegawai() {
    const nama = document.getElementById('p-nama').value;
    const username = document.getElementById('p-username').value;
    const password = document.getElementById('p-password').value;
    const jabatan = document.getElementById('p-jabatan').value;

    if(!nama || !username || !password || !jabatan) {
        alert("⚠️ Mohon lengkapi semua kolom data pegawai!");
        return;
    }

    push(ref(db, 'pegawai'), {
        nama,
        username,
        password,
        jabatan,
        createdAt: new Date().toISOString()
    }).then(() => {
        alert("✅ Pegawai berhasil ditambahkan!");
        ["p-nama", "p-username", "p-password", "p-jabatan"].forEach(id => {
            document.getElementById(id).value = "";
        });
    });
}

function simpanNotulensi() {
    // 1. Ambil semua input termasuk keputusan
    const p = document.getElementById('notul-pembicara').value;
    const m = document.getElementById('notul-materi').value;
    const i = document.getElementById('notul-isi').value;
    const k = document.getElementById('notul-keputusan').value; // <--- INI TAMBAHANNYA

    // 2. Validasi input wajib
    if(!m || !i) { 
        alert("⚠️ Materi dan Isi Pembahasan harus diisi!"); 
        return; 
    }

    // 3. Ambil daftar hadir dari Firebase 'kehadiran'
    onValue(ref(db, 'kehadiran'), (s) => {
        const dataHadir = s.val() ? Object.values(s.val()) : [];
        const hadir = dataHadir.length > 0 ? dataHadir.map(x => x.nama).join(', ') : "Tidak ada peserta";
        
        // 4. Kirim data lengkap ke Firebase 'notulensi'
        push(ref(db, 'notulensi'), { 
            pembicara: p || "Anonim", 
            materi: m, 
            isi: i, 
            keputusan: k || "", // <--- DATA KEPUTUSAN MASUK KE DATABASE DI SINI
            daftar_hadir: hadir, 
            tanggal: new Date().toISOString() 
        }).then(() => {
            // 5. Reset Form agar bersih kembali
            document.getElementById('notul-pembicara').value = "";
            document.getElementById('notul-materi').value = "";
            document.getElementById('notul-isi').value = "";
            document.getElementById('notul-keputusan').value = ""; // <--- RESET INPUT KEPUTUSAN
            
            // 6. Hapus daftar hadir sementara (reset untuk rapat baru)
            remove(ref(db, 'kehadiran'));
            
            alert("✅ Notulensi & Keputusan berhasil disimpan!");
        });
    }, { onlyOnce: true });
}

function renderKartuPresensi(listHadir) {
    const container = document.getElementById('grid-presensi-peserta');
    if (!container) return;
    
    const namaHadir = new Set(listHadir.map(h => h.nama));

    // Ambil status absensi untuk menentukan apakah kartu bisa diklik
    onValue(ref(db, 'status_absensi'), (statusSnap) => {
        const isOpen = statusSnap.val()?.absensi_terbuka || false;

        onValue(ref(db, 'pegawai'), (s) => {
            const pData = s.val() ? Object.values(s.val()) : [];
            container.innerHTML = pData.map((p, idx) => {
                const isHadir = namaHadir.has(p.nama);
                
                // Logika: Jika sudah hadir ATAU sesi tutup, kartu tidak bisa diklik
                const canClick = !isHadir && isOpen;

                return `
                <div onclick="${canClick ? `absenkanPegawai('${p.nama}', '${p.jabatan}')` : ''}" 
                     style="animation-delay: ${idx * 50}ms"
                     class="p-6 rounded-[2rem] border-2 transition-all animate-card
                     ${isHadir ? 'bg-green-50 border-green-200 opacity-60' : 
                       isOpen ? 'bg-white border-transparent filament-shadow cursor-pointer hover:border-orange-400' : 
                       'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'}">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold ${isHadir ? 'line-through text-green-700' : 'text-gray-800'}">${p.nama}</p>
                            <p class="text-[10px] text-gray-400 uppercase font-black tracking-widest">${p.jabatan}</p>
                        </div>
                        ${isHadir ? '<i data-lucide="check-circle" class="text-green-500 w-5 h-5"></i>' : ''}
                    </div>
                </div>`;
            }).join('');
            lucide.createIcons();
        }, { onlyOnce: true });
    }, { onlyOnce: true });
}

function generateQRCode() {
    const container = document.getElementById('qrcode-container');
    if(!container) return;
    
    const url = window.location.href;
    const urlDisplay = document.getElementById('client-url-text');
    if(urlDisplay) urlDisplay.innerText = url;
    
    container.innerHTML = "";
    new QRCode(container, { text: url, width: 120, height: 120, colorDark: "#f97316" });
}

window.clearDatabase = () => {
    if(confirm("⚠️ PERHATIAN: Semua data kehadiran dan notulensi akan dihapus permanen. Lanjutkan?")) {
        Promise.all([
            remove(ref(db, 'kehadiran')),
            remove(ref(db, 'notulensi')),
            set(ref(db, 'status_absensi'), { absensi_terbuka: false })
        ]).then(() => alert("Database berhasil direset."));
    }
};

// Inisialisasi awal
lucide.createIcons();
