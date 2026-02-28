import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIG FIREBASE ---
// Ganti dengan data asli dari Firebase Console Anda
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "projek-anda.firebaseapp.com",
    databaseURL: "https://projek-anda-default-rtdb.firebaseio.com",
    projectId: "projek-anda",
    storageBucket: "projek-anda.appspot.com",
    appId: "..."
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
    const isOpen = s.val()?.absensi_terbuka || false;
    const btnBuka = document.getElementById('btn-buka');
    const btnTutup = document.getElementById('btn-tutup');
    const statusTxt = document.getElementById('absensi-status');

    if(isOpen) {
        btnBuka?.classList.add('hidden'); 
        btnTutup?.classList.remove('hidden');
        if(statusTxt) {
            statusTxt.innerText = "Sesi Terbuka - Silakan klik nama Anda";
            statusTxt.className = "mt-4 inline-block px-4 py-2 rounded-xl text-sm font-bold bg-orange-100 text-orange-600";
        }
    } else {
        btnBuka?.classList.remove('hidden'); 
        btnTutup?.classList.add('hidden');
        if(statusTxt) {
            statusTxt.innerText = "Sesi ditutup oleh Admin";
            statusTxt.className = "mt-4 inline-block px-4 py-2 rounded-xl text-sm italic bg-gray-100 text-gray-400";
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
    if(!container) return;

    container.innerHTML = data.map(([id, n]) => `
        <div class="bg-white p-6 rounded-[2rem] filament-shadow border border-gray-100">
            <div class="flex justify-between mb-4">
                <span class="bg-orange-500 text-white text-[10px] px-3 py-1 rounded-lg uppercase font-black">${n.materi}</span>
                <button onclick="hapusNotulensi('${id}')" class="text-gray-300 hover:text-red-500"><i data-lucide="trash-2"></i></button>
            </div>
            <p class="text-sm text-gray-600 mb-4">${n.isi}</p>
            <div class="text-[10px] text-gray-400 font-bold uppercase italic">Hadir: ${n.daftar_hadir}</div>
        </div>`).join('');
    lucide.createIcons();
});

// --- FUNCTIONS ---

function switchTab(tab) {
    document.querySelectorAll('section[id^="tab-"]').forEach(s => s.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    if(tab === 'admin') generateQRCode();
    lucide.createIcons();
}

function toggleAbsensi(status) {
    set(ref(db, 'status_absensi'), { absensi_terbuka: status });
}

function absenkanPegawai(nama, jabatan) {
    push(ref(db, 'kehadiran'), { 
        nama, 
        jabatan, 
        waktu: new Date().toISOString() 
    });
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
    const p = document.getElementById('notul-pembicara').value;
    const m = document.getElementById('notul-materi').value;
    const i = document.getElementById('notul-isi').value;

    if(!m || !i) { alert("Materi dan Isi harus diisi!"); return; }

    onValue(ref(db, 'kehadiran'), (s) => {
        const hadir = s.val() ? Object.values(s.val()).map(x => x.nama).join(', ') : "Tidak ada";
        push(ref(db, 'notulensi'), { 
            pembicara: p, 
            materi: m, 
            isi: i, 
            daftar_hadir: hadir, 
            tanggal: new Date().toISOString() 
        });
        remove(ref(db, 'kehadiran'));
        
        // Reset Form
        document.getElementById('notul-pembicara').value = "";
        document.getElementById('notul-materi').value = "";
        document.getElementById('notul-isi').value = "";
        
        alert("Notulensi disimpan & daftar hadir direset!");
    }, { onlyOnce: true });
}

function renderKartuPresensi(listHadir) {
    const container = document.getElementById('grid-presensi-peserta');
    if(!container) return;
    
    const namaHadir = new Set(listHadir.map(h => h.nama));

    onValue(ref(db, 'pegawai'), (s) => {
        const pData = s.val() ? Object.values(s.val()) : [];
        container.innerHTML = pData.map((p, idx) => {
            const isHadir = namaHadir.has(p.nama);
            return `
            <div onclick="${isHadir ? '' : `absenkanPegawai('${p.nama}', '${p.jabatan}')`}" 
                 style="animation-delay: ${idx * 50}ms"
                 class="p-6 rounded-[2rem] border-2 transition-all animate-card
                 ${isHadir ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white border-transparent filament-shadow cursor-pointer hover:border-orange-400'}">
                <p class="font-bold ${isHadir ? 'line-through text-green-700' : ''}">${p.nama}</p>
                <p class="text-[10px] text-gray-400 uppercase font-black tracking-widest">${p.jabatan}</p>
            </div>`;
        }).join('');
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

// Inisialisasi awal
lucide.createIcons();