import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getDatabase, ref, set, push, onValue, query, limitToLast, remove, update 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIG FIREBASE ---
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

// --- FUNCTIONS ---

// Fungsi Cek Login
// Tambahkan listener untuk tombol Enter pada input password
document.getElementById('admin-password')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAdminLogin();
});

window.checkAdminLogin = function() {
    const inputPass = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');

    onValue(ref(db, 'admin_config'), (snapshot) => {
        const adminData = snapshot.val();
        const correctPass = adminData ? adminData.password : "@jawara1";

        if (inputPass === correctPass) {
            sessionStorage.setItem('isAdmin', 'true');
            document.getElementById('login-overlay').classList.add('hidden');
            errorMsg.classList.add('hidden'); // Sembunyikan error jika sebelumnya gagal
        } else {
            errorMsg.classList.remove('hidden');
            document.getElementById('admin-password').value = "";
            document.getElementById('admin-password').focus();
        }
    }, { onlyOnce: true });
};

// Cek status login saat halaman dimuat
function initAuth() {
    const isLoggedIn = sessionStorage.getItem('isAdmin');
    if (isLoggedIn === 'true') {
        const overlay = document.getElementById('login-overlay');
        if (overlay) overlay.classList.add('hidden');
    }
}

function switchTab(tab) {
    document.querySelectorAll('section[id^="tab-"]').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.remove('bg-orange-500', 'text-white', 'shadow-lg');
        btn.classList.add('text-gray-400');
    });

    const activeBtn = document.getElementById(`nav-${tab}-d`) || document.getElementById(`nav-${tab}-m`);
    if (activeBtn) activeBtn.classList.add('bg-orange-500', 'text-white', 'shadow-lg');

    // --- TAMBAHKAN LOGIKA AUTOFOCUS DI SINI ---
    if (tab === 'admin') {
        const inputPembicara = document.getElementById('notul-pembicara');
        if (inputPembicara) {
            // Beri sedikit delay agar transisi CSS selesai dulu baru fokus
            setTimeout(() => {
                inputPembicara.focus();
            }, 100);
        }
    }

    if(tab === 'admin') generateQRCode();
    lucide.createIcons();
}

function toggleAbsensi(status) {
    update(ref(db, 'status_absensi'), { absensi_terbuka: status });
}

// Fungsi Absen (Ditambahkan kembali karena sebelumnya hilang)
function absenkanPegawai(nama, jabatan) {
    onValue(ref(db, 'status_absensi'), (snapshot) => {
        const isOpen = snapshot.val()?.absensi_terbuka || false;
        if (!isOpen) {
            alert("⚠️ Maaf, sesi presensi sudah ditutup oleh Admin.");
            return;
        }
        push(ref(db, 'kehadiran'), { 
            nama, 
            jabatan, 
            waktu: new Date().toISOString() 
        }).then(() => {
            alert(`✅ Kehadiran ${nama} berhasil dicatat.`);
        });
    }, { onlyOnce: true });
}

function batalRapat() {
    if (confirm("Apakah Anda yakin ingin membatalkan rapat? Seluruh daftar hadir real-time akan dihapus.")) {
        update(ref(db, 'status_absensi'), { absensi_terbuka: false });
        remove(ref(db, 'kehadiran')).then(() => {
            alert("Rapat dibatalkan & feed dibersihkan.");
        });
    }
}

function generateQRCode() {
    const container = document.getElementById('qrcode-container');
    const urlDisplay = document.getElementById('client-url-text');
    const clientUrl = "https://jawaradev.github.io/meetinglog/";
    
    if(urlDisplay) urlDisplay.innerText = "Scan untuk Masuk";
    if(container) {
        container.innerHTML = "";
        new QRCode(container, { 
            text: clientUrl, 
            width: 150, 
            height: 150, 
            colorDark: "#f97316",
            correctLevel: QRCode.CorrectLevel.H 
        });
    }
}

function simpanPegawai() {
    const fields = ['p-nama', 'p-username', 'p-password', 'p-jabatan'];
    const data = {};
    fields.forEach(id => data[id.replace('p-', '')] = document.getElementById(id).value);

    if(!data.nama || !data.username || !data.password || !data.jabatan) {
        return alert("⚠️ Mohon lengkapi semua data pegawai!");
    }

    push(ref(db, 'pegawai'), data).then(() => {
        alert("✅ Pegawai berhasil ditambahkan!");
        fields.forEach(id => document.getElementById(id).value = "");
    });
}

function simpanNotulensi() {
    const m = document.getElementById('notul-materi').value;
    const i = document.getElementById('notul-isi').value;
    if(!m || !i) return alert("⚠️ Materi dan Isi Pembahasan wajib diisi!");

    onValue(ref(db, 'kehadiran'), (s) => {
        const dataHadir = s.val() ? Object.values(s.val()) : [];
        const hadirStr = dataHadir.length > 0 ? dataHadir.map(x => x.nama).join(', ') : "Tidak ada peserta";
        
        push(ref(db, 'notulensi'), { 
            pembicara: document.getElementById('notul-pembicara').value || "Anonim",
            materi: m,
            isi: i,
            keputusan: document.getElementById('notul-keputusan').value || "",
            daftar_hadir: hadirStr,
            tanggal: new Date().toISOString() 
        }).then(() => {
            ['notul-pembicara', 'notul-materi', 'notul-isi', 'notul-keputusan'].forEach(id => document.getElementById(id).value = "");
            remove(ref(db, 'kehadiran'));
            alert("✅ Notulensi Berhasil Disimpan & Feed Direset!");

            // Autofocus kembali ke atas
            document.getElementById('notul-pembicara').focus();
        });
    }, { onlyOnce: true });
}

function renderKartuPresensi(listHadir) {
    const container = document.getElementById('grid-presensi-peserta');
    if (!container) return;
    const namaHadir = new Set(listHadir.map(h => h.nama));

    onValue(ref(db, 'pegawai'), (s) => {
        const pData = s.val() ? Object.values(s.val()) : [];
        container.innerHTML = pData.map(p => {
            const isHadir = namaHadir.has(p.nama);
            // Admin bisa klik kartu untuk mengabsenkan pegawai secara manual
            return `
            <div onclick="${!isHadir ? `absenkanPegawai('${p.nama}', '${p.jabatan}')` : ''}" 
                 class="p-6 rounded-[2rem] border-2 transition-all cursor-pointer 
                 ${isHadir ? 'bg-green-50 border-green-200' : 'bg-white border-transparent filament-shadow hover:border-orange-200'}">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold ${isHadir ? 'text-green-700 line-through' : 'text-gray-800'}">${p.nama}</p>
                        <p class="text-[10px] text-gray-400 uppercase font-black tracking-widest">${p.jabatan}</p>
                    </div>
                    ${isHadir ? '<i data-lucide="check-circle" class="text-green-500 w-5 h-5"></i>' : ''}
                </div>
            </div>`;
        }).join('');
        lucide.createIcons();
    }, { onlyOnce: true });
}

// --- LISTENERS (REALTIME) ---

onValue(ref(db, 'status_absensi'), (s) => {
    const isOpen = s.val()?.absensi_terbuka || false;
    const btnBuka = document.getElementById('btn-buka');
    const btnTutup = document.getElementById('btn-tutup');
    const statusTxt = document.getElementById('absensi-status');

    if (btnBuka) btnBuka.style.display = isOpen ? 'none' : 'inline-block';
    if (btnTutup) btnTutup.style.display = isOpen ? 'inline-block' : 'none';
    
    if (statusTxt) {
        statusTxt.innerText = isOpen ? "Sesi Terbuka - Menunggu Peserta..." : "Sesi ditutup oleh Admin";
        statusTxt.className = `mt-4 inline-block px-4 py-2 rounded-xl text-sm font-bold ${isOpen ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-black'}`;
    }
});

onValue(ref(db, 'kehadiran'), (s) => {
    const data = s.val() ? Object.values(s.val()) : [];
    const countEl = document.getElementById('count-hadir');
    if(countEl) countEl.innerText = data.length;
    renderKartuPresensi(data);
});

// --- EXPOSE TO WINDOW (Pindahkan ke bawah agar fungsi terdeteksi) ---
window.switchTab = switchTab;
window.toggleAbsensi = toggleAbsensi;
window.absenkanPegawai = absenkanPegawai;
window.simpanNotulensi = simpanNotulensi;
window.simpanPegawai = simpanPegawai;
window.batalRapat = batalRapat;
window.hapusPegawai = (id) => { if(confirm("Hapus pegawai ini?")) remove(ref(db, `pegawai/${id}`)); };
window.hapusNotulensi = (id) => { if(confirm("Hapus notulensi ini?")) remove(ref(db, `notulensi/${id}`)); };
window.clearDatabase = () => {
    if(confirm("⚠️ PERHATIAN: Hapus semua data permanen?")) {
        Promise.all([
            remove(ref(db, 'kehadiran')),
            remove(ref(db, 'notulensi')),
            set(ref(db, 'status_absensi'), { absensi_terbuka: false })
        ]).then(() => alert("Database dibersihkan."));
    }
};

// 3. Monitor Master Data Pegawai (Tambahkan ini)
onValue(ref(db, 'pegawai'), (s) => {
    const data = s.val() ? Object.entries(s.val()) : [];
    const container = document.getElementById('list-master-pegawai');
    if(!container) return;
    
    if(data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 opacity-40">
                <i data-lucide="users" class="mx-auto w-12 h-12 mb-2"></i>
                <p class="text-sm">Bel  um ada data pegawai</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    container.innerHTML = data.map(([id, p]) => `
        <div class="bg-white p-5 rounded-[2rem] filament-shadow border border-gray-50 flex justify-between items-center group transition-all">
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

// 4. Monitor Riwayat Notulensi (Tambahkan ini)
onValue(ref(db, 'notulensi'), (s) => {
    const rawData = s.val();
    const data = rawData ? Object.entries(rawData).reverse() : [];
    
    // --- 1. UPDATE JUMLAH DATA (COUNTER) ---
    // Pastikan ID ini sesuai dengan yang ada di HTML dashboard Anda
    const countNotulEl = document.getElementById('count-notulensi');
    if (countNotulEl) {
        countNotulEl.innerText = data.length;
    }

    const container = document.getElementById('container-notulensi');
    if(!container) return;

    // Tampilkan pesan jika data kosong
    if (data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20 opacity-30">
                <i data-lucide="book-open" class="mx-auto w-16 h-16 mb-4"></i>
                <p>Belum ada riwayat notulensi rapat.</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    // --- 2. RENDER LIST DATA ---
    container.innerHTML = data.map(([id, n]) => `
        <div class="bg-white rounded-[2.5rem] p-8 filament-shadow border border-gray-100 mb-6 relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
            <div class="flex justify-between items-start mb-4">
                <div>
                    <span class="bg-orange-100 text-orange-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">${n.materi}</span>
                    <h4 class="text-xl font-extrabold text-gray-800 mt-2">${n.pembicara}</h4>
                </div>
                <button onclick="hapusNotulensi('${id}')" class="text-gray-300 hover:text-red-500 transition-all">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
            <div class="bg-gray-50 p-4 rounded-2xl mb-4 text-sm text-gray-600 leading-relaxed">${n.isi}</div>
            ${n.keputusan ? `<div class="bg-green-50 p-4 rounded-2xl border border-green-100 text-green-800 font-bold text-sm">💡 ${n.keputusan}</div>` : ''}
            <div class="mt-6 pt-4 border-t border-dashed border-gray-100 text-[10px] text-gray-400 italic flex justify-between">
                <span>Hadir: ${n.daftar_hadir}</span>
                <span>${n.tanggal ? new Date(n.tanggal).toLocaleDateString('id-ID') : ''}</span>
            </div>
        </div>`).join('');
    
    lucide.createIcons();
});

// Fungsi Logout
function adminLogout() {
    if(confirm("Keluar dari Panel Admin?")) {
        // 1. Hapus session
        sessionStorage.removeItem('isAdmin');
        
        // 2. Tampilkan kembali overlay login
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            document.getElementById('admin-password').value = "";
        }
        
        // 3. Refresh untuk membersihkan state internal
        window.location.reload();
    }
}

// Ekspos ke window
window.adminLogout = adminLogout;

// --- INITIALIZE ---
window.onload = () => {
    initAuth();
    switchTab('dashboard'); // Membuka dashboard saat pertama kali load
    lucide.createIcons();
};
