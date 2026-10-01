const STORAGE_KEY = "dty-static-app-v1";
const SESSION_KEY = "dty-static-session";
const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };
const MAX_SKD_FILE_SIZE = 1024 * 1024;
const seedEmployees = [
  { id: "1", nik: "DTY001", nama: "Andi Saputra", jenis_kelamin: "Laki-laki", departemen: "Produksi DTY", jabatan: "Operator Produksi", status: "Aktif" },
  { id: "2", nik: "DTY002", nama: "Siti Nurhaliza", jenis_kelamin: "Perempuan", departemen: "Quality Control", jabatan: "Staff QC", status: "Aktif" },
  { id: "3", nik: "DTY003", nama: "Budi Santoso", jenis_kelamin: "Laki-laki", departemen: "Maintenance", jabatan: "Teknisi", status: "Aktif" },
  { id: "4", nik: "DTY004", nama: "Rina Marlina", jenis_kelamin: "Perempuan", departemen: "Warehouse", jabatan: "Staff Gudang", status: "Aktif" },
  { id: "5", nik: "DTY005", nama: "Dedi Kurniawan", jenis_kelamin: "Laki-laki", departemen: "Produksi DTY", jabatan: "Operator Produksi", status: "Aktif" },
  { id: "6", nik: "DTY006", nama: "Ayu Lestari", jenis_kelamin: "Perempuan", departemen: "Administrasi", jabatan: "Staff Administrasi", status: "Aktif" },
  { id: "7", nik: "DTY007", nama: "Fajar Ramadhan", jenis_kelamin: "Laki-laki", departemen: "Produksi DTY", jabatan: "Supervisor Produksi", status: "Aktif" },
  { id: "8", nik: "DTY008", nama: "Nina Anggraini", jenis_kelamin: "Perempuan", departemen: "Quality Control", jabatan: "Staff QC", status: "Aktif" }
];

const sections = {
  dashboard: "RINGKASAN",
  attendance: "ABSENSI",
  employees: "KARYAWAN",
  history: "RIWAYAT"
};
const root = document.querySelector("#view-root");
const dialog = document.querySelector("#employee-dialog");
const form = document.querySelector("#employee-form");
const sickDialog = document.querySelector("#sick-dialog");
const sickForm = document.querySelector("#sick-form");
const appShell = document.querySelector("#app-shell");
const loginScreen = document.querySelector("#login-screen");
const loginForm = document.querySelector("#login-form");
let currentView = "dashboard";
let toastTimer;

function signedInUser() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function normalizeAttendance(records) {
  return records.map(record => ({ ...record, persetujuan: record.persetujuan || "Menunggu" }));
}

function loadStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.employees) && Array.isArray(saved.attendance)) {
      return { ...saved, attendance: normalizeAttendance(saved.attendance) };
    }
  } catch (error) {
    console.warn("Data lokal tidak dapat dibaca.", error);
  }
  return { employees: seedEmployees, attendance: [] };
}

let store = loadStore();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    showToast("Penyimpanan browser penuh atau tidak tersedia.");
    console.error(error);
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function skdEvidenceLink(record) {
  const evidence = record.bukti_skd;
  if (typeof evidence?.data !== "string" || !/^data:(application\/pdf|image\/png|image\/jpeg);base64,[A-Za-z0-9+/=]+$/.test(evidence.data)) return "";
  return `<a class="button button-quiet button-small evidence-link" href="${evidence.data}" target="_blank" rel="noopener noreferrer">Lihat SKD</a>`;
}

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function todayAttendance() {
  return store.attendance.filter(record => record.tanggal === localDate());
}

function personName(id) {
  return store.employees.find(person => person.id === id)?.nama ?? "Karyawan dihapus";
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function attendanceRows(records, actions = false) {
  if (!records.length) return `<tr><td colspan="${actions ? 8 : 7}"><div class="empty-state"><strong>Belum ada catatan kehadiran</strong>Catatan akan tampil setelah karyawan mengirim pengajuan kehadiran.</div></td></tr>`;
  return records.map(record => {
    const person = store.employees.find(item => item.id === record.karyawan_id) ?? {};
    const badge = record.status === "Terlambat" ? "tag late" : "tag";
    const approval = record.persetujuan || "Menunggu";
    const approvalBadge = approval === "Menunggu" ? "tag late" : approval === "Ditolak" ? "tag inactive" : "tag";
    const attendanceBadge = record.status === "Sakit" ? "tag inactive" : record.status === "Terlambat" ? "tag late" : "tag";
    return `<tr>
      <td>${escapeHtml(formatDate(record.tanggal))}</td>
      <td><div class="person-cell"><strong>${escapeHtml(person.nama ?? "Data karyawan tidak tersedia")}</strong><small>${escapeHtml(person.nik ?? "-")}</small>${record.keterangan ? `<small>Keterangan: ${escapeHtml(record.keterangan)}</small>` : ""}${skdEvidenceLink(record)}</div></td>
      <td>${escapeHtml(person.departemen ?? "-")}</td><td>${escapeHtml(record.jam_masuk || "-")}</td>
      <td>${escapeHtml(record.jam_pulang || "-")}</td><td><span class="${record.status === "Sakit" ? attendanceBadge : badge}">${escapeHtml(record.status)}</span></td>
      <td><span class="${approvalBadge}">${escapeHtml(approval)}</span></td>
      ${actions ? `<td>${approval === "Menunggu" ? `<div class="row-actions"><button class="button button-primary button-small" data-approve-attendance="${escapeHtml(record.id)}">Setujui</button><button class="button button-danger button-small" data-reject-attendance="${escapeHtml(record.id)}">Tolak</button></div>` : "<span class='muted-cell'>Selesai ditinjau</span>"}</td>` : ""}
    </tr>`;
  }).join("");
}

function dashboardView() {
  const today = todayAttendance();
  const active = store.employees.filter(person => person.status === "Aktif").length;
  const approved = today.filter(record => (record.persetujuan || "Menunggu") === "Disetujui");
  const pending = today.filter(record => record.persetujuan === "Menunggu").length;
  const presentIds = new Set(approved.filter(record => record.status !== "Sakit").map(record => record.karyawan_id));
  const submittedIds = new Set(today.map(record => record.karyawan_id));
  const latest = [...today].sort((a, b) => (b.jam_masuk || "").localeCompare(a.jam_masuk || "")).slice(0, 6);
  const now = new Date();
  return `<div class="page-heading"><div><span class="eyebrow">PUSAT KENDALI / ${escapeHtml(formatDate(localDate()))}</span><h1>Ringkasan operasional</h1><p>Pantau kehadiran tim dan aktivitas shift hari ini.</p></div><div class="heading-meta"><span class="date-mark"></span>${escapeHtml(new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(now))}</div></div>
    <section class="hero-band"><div class="hero-copy"><span class="eyebrow">PRODUKSI DTY / SHIFT AKTIF</span><h2>Produksi berjalan,<br>tim siap bekerja.</h2><p>Ringkasan kehadiran karyawan DTY hari ini.</p></div><div class="hero-number"><strong>${String(now.getHours()).padStart(2, "0")}<span style="display:inline;color:#fff;font-size:32px">:${String(now.getMinutes()).padStart(2, "0")}</span></strong><span>WAKTU PERANGKAT</span></div></section>
    <section class="metrics">
      <article class="metric"><div class="metric-top"><span>Karyawan aktif</span><span class="metric-icon">01</span></div><strong>${active}<small>orang</small></strong></article>
      <article class="metric"><div class="metric-top"><span>Pengajuan masuk</span><span class="metric-icon">02</span></div><strong>${today.length}<small>orang</small></strong></article>
      <article class="metric"><div class="metric-top"><span>Disetujui</span><span class="metric-icon">03</span></div><strong>${approved.length}<small>orang</small></strong></article>
      <article class="metric"><div class="metric-top"><span>Menunggu tinjauan</span><span class="metric-icon">04</span></div><strong>${pending}<small>orang</small></strong></article>
    </section>
    <section class="content-grid"><article class="panel"><div class="panel-heading"><div><h2>Aktivitas kehadiran</h2><p>Pengajuan terbaru hari ini</p></div><button class="panel-link" data-navigate="attendance">TINJAU ABSENSI →</button></div><div class="table-wrap"><table><thead><tr><th>KARYAWAN</th><th>DEPARTEMEN</th><th>MASUK</th><th>PULANG</th><th>STATUS</th><th>PERSETUJUAN</th></tr></thead><tbody>${latest.length ? latest.map(record => { const person = store.employees.find(item => item.id === record.karyawan_id) ?? {}; const approval = record.persetujuan || "Menunggu"; return `<tr><td><div class="person-cell"><strong>${escapeHtml(person.nama ?? "Karyawan dihapus")}</strong><small>${escapeHtml(person.nik ?? "-")}</small></div></td><td>${escapeHtml(person.departemen ?? "-")}</td><td>${escapeHtml(record.jam_masuk || "-")}</td><td>${escapeHtml(record.jam_pulang || "-")}</td><td><span class="${record.status === "Sakit" ? "tag inactive" : record.status === "Terlambat" ? "tag late" : "tag"}">${escapeHtml(record.status)}</span></td><td><span class="${approval === "Menunggu" ? "tag late" : approval === "Ditolak" ? "tag inactive" : "tag"}">${escapeHtml(approval)}</span></td></tr>`; }).join("") : `<tr><td colspan="6"><div class="empty-state"><strong>Belum ada pengajuan absensi</strong>${active - presentIds.size} karyawan belum tercatat hadir.</div></td></tr>`}</tbody></table></div></article>
    <aside class="panel shift-panel"><div class="panel-heading"><div><h2>Status shift</h2><p>Ringkasan cepat lini kerja</p></div></div><div class="shift-clock"><strong>${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}</strong><span>WAKTU SAAT INI<br>${escapeHtml(formatDate(localDate()))}</span></div><ul class="shift-list"><li><span>Belum mengajukan</span><strong>${Math.max(0, active - submittedIds.size)} orang</strong></li><li><span>Belum disetujui</span><strong>${Math.max(0, active - presentIds.size)} orang</strong></li><li><span>Menunggu tinjauan</span><strong>${pending} orang</strong></li><li><span>Batas masuk</span><strong>08:00</strong></li></ul><p class="panel-note">Waktu masuk setelah pukul 08:00 ditandai terlambat. Pengajuan dihitung hadir setelah disetujui admin.</p></aside></section>`;
}

function employeeView() {
  const query = new URLSearchParams(location.hash.split("?")[1] || "").get("q")?.toLocaleLowerCase("id") ?? "";
  const people = [...store.employees].filter(person => Object.values(person).some(value => String(value).toLocaleLowerCase("id").includes(query))).sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
  return `<div class="page-heading"><div><span class="eyebrow">KARYAWAN / SUMBER DAYA MANUSIA</span><h1>Data karyawan</h1><p>Kelola daftar personel dan informasi departemen.</p></div><div class="heading-meta"><span class="date-mark"></span>${store.employees.length} PERSONEL</div></div>
    <section class="panel"><div class="toolbar"><div class="toolbar-group"><input id="employee-search" type="search" value="${escapeHtml(query)}" placeholder="Cari nama, NIK, departemen..." aria-label="Cari karyawan"></div><div class="toolbar-group"><button class="button button-quiet" data-backup>↓ Cadangkan</button><label class="button button-quiet backup-label">↑ Pulihkan<input id="restore-backup" type="file" accept="application/json,.json" aria-label="Pilih file cadangan"></label><button class="button button-primary" data-add-employee>＋ Tambah karyawan</button></div></div>
    <div class="table-wrap"><table><thead><tr><th>NIK</th><th>NAMA</th><th>DEPARTEMEN</th><th>JABATAN</th><th>ID PENGGUNA</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>${people.length ? people.map(person => `<tr><td><strong>${escapeHtml(person.nik)}</strong></td><td>${escapeHtml(person.nama)}<div class="muted-cell">${escapeHtml(person.jenis_kelamin)}</div></td><td>${escapeHtml(person.departemen)}</td><td>${escapeHtml(person.jabatan)}</td><td><strong>${escapeHtml(person.nik)}</strong></td><td><span class="${person.status === "Aktif" ? "tag" : "tag inactive"}">${escapeHtml(person.status)}</span></td><td><div class="row-actions"><button class="button button-quiet button-small" data-edit-employee="${escapeHtml(person.id)}">Edit</button><button class="button button-danger button-small" data-delete-employee="${escapeHtml(person.id)}">Hapus</button></div></td></tr>`).join("") : `<tr><td colspan="7"><div class="empty-state"><strong>Tidak ada data ditemukan</strong>Silakan periksa kembali kata kunci pencarian.</div></td></tr>`}</tbody></table></div></section>
    <p class="panel-note">NIK karyawan digunakan sebagai ID pengguna. Data tersimpan secara lokal pada browser ini. Gunakan fitur Cadangkan dan Pulihkan untuk memindahkan data.</p>`;
}

function attendanceView() {
  const today = [...todayAttendance()].sort((a, b) => a.jam_masuk.localeCompare(b.jam_masuk));
  const pending = today.filter(record => record.persetujuan === "Menunggu").length;
  return `<div class="page-heading"><div><span class="eyebrow">SHIFT OPERASIONAL / PERSETUJUAN</span><h1>Tinjau absensi</h1><p>Tinjau pengajuan kehadiran dan tetapkan status persetujuannya.</p></div><div class="heading-meta"><span class="date-mark"></span>${escapeHtml(formatDate(localDate()))}</div></div>
    <section class="panel"><div class="panel-heading"><div><h2>Pengajuan hari ini</h2><p>${pending} menunggu persetujuan · waktu masuk setelah 08:00 ditandai terlambat</p></div></div><div class="table-wrap"><table><thead><tr><th>TANGGAL</th><th>KARYAWAN</th><th>DEPARTEMEN</th><th>MASUK</th><th>PULANG</th><th>STATUS</th><th>PERSETUJUAN</th><th>AKSI</th></tr></thead><tbody>${attendanceRows(today, true)}</tbody></table></div></section>`;
}

function employeeAttendanceView(user) {
  const person = store.employees.find(item => item.id === user.employeeId);
  const record = todayAttendance().filter(item => item.karyawan_id === person.id).slice(-1)[0];
  const canSubmit = !record || record.persetujuan === "Ditolak";
  const action = canSubmit
    ? `<form id="checkin-form" class="attendance-form"><input type="hidden" name="employee" value="${escapeHtml(person.id)}"><p>${record ? "Pengajuan sebelumnya ditolak. Anda dapat mengajukan kembali." : "Silakan catat kehadiran atau ajukan izin sakit."}</p><button class="button button-primary" type="submit">Absen masuk</button><button class="button button-quiet" type="button" data-employee-sick="${escapeHtml(person.id)}">Ajukan izin sakit</button><button class="button button-dark" type="button" disabled>Absen pulang</button><small>Tersedia setelah pengajuan kehadiran disetujui administrator.</small></form>`
    : record.persetujuan === "Menunggu"
      ? `<div class="attendance-form"><p>Pengajuan ${record.status === "Sakit" ? "izin sakit" : `absen masuk pukul <strong>${escapeHtml(record.jam_masuk)}</strong>`} sedang menunggu persetujuan administrator.</p>${record.status === "Sakit" ? "" : `<button class="button button-dark" type="button" disabled>Absen pulang</button><small>Tersedia setelah pengajuan kehadiran disetujui administrator.</small>`}</div>`
      : record.status === "Sakit"
        ? `<div class="attendance-form"><p>Pengajuan sakit telah disetujui admin.</p></div>`
        : record.jam_pulang
          ? `<div class="attendance-form"><p>Absensi hari ini sudah lengkap.</p></div>`
          : `<div class="attendance-form"><p>Absen masuk tercatat pukul <strong>${escapeHtml(record.jam_masuk)}</strong>.</p><button class="button button-dark" data-checkout="${escapeHtml(record.id)}">Absen pulang</button></div>`;
  const records = [...store.attendance].filter(item => item.karyawan_id === person.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return `<div class="page-heading"><div><span class="eyebrow">PORTAL KARYAWAN / ${escapeHtml(person.nik)}</span><h1>Absensi saya</h1><p>${escapeHtml(person.nama)} · ${escapeHtml(person.departemen)} · ${escapeHtml(person.jabatan)}</p></div><div class="heading-meta"><span class="date-mark"></span>${escapeHtml(formatDate(localDate()))}</div></div>
    <section class="panel"><div class="panel-heading"><div><h2>Absensi hari ini</h2><p>Jam masuk setelah pukul 08:00 tercatat terlambat.</p></div></div>${action}
      <div class="panel-heading"><div><h2>Riwayat kehadiran</h2><p>${records.length} catatan milik Anda</p></div></div><div class="table-wrap"><table><thead><tr><th>TANGGAL</th><th>KARYAWAN</th><th>DEPARTEMEN</th><th>MASUK</th><th>PULANG</th><th>STATUS</th><th>PERSETUJUAN</th></tr></thead><tbody>${attendanceRows(records)}</tbody></table></div></section>`;
}

function historyView() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const selectedDate = params.get("date") || localDate();
  const query = params.get("q") || "";
  const filtered = store.attendance.filter(record => record.tanggal === selectedDate).filter(record => {
    const person = store.employees.find(item => item.id === record.karyawan_id);
    return !query || [person?.nama, person?.nik, person?.departemen, person?.jabatan].some(value => String(value ?? "").toLocaleLowerCase("id").includes(query.toLocaleLowerCase("id")));
  }).sort((a, b) => a.jam_masuk.localeCompare(b.jam_masuk));
  const approved = filtered.filter(record => (record.persetujuan || "Menunggu") === "Disetujui");
  const onTime = approved.filter(record => record.status === "Hadir").length;
  const late = approved.filter(record => record.status === "Terlambat").length;
  return `<div class="page-heading"><div><span class="eyebrow">ARSIP / LAPORAN KEHADIRAN</span><h1>Riwayat absensi</h1><p>Telusuri catatan kehadiran dan unduh laporan CSV.</p></div><div class="heading-meta"><span class="date-mark"></span>${filtered.length} CATATAN</div></div>
    <section class="panel"><div class="toolbar"><div class="toolbar-group"><input id="history-date" type="date" value="${escapeHtml(selectedDate)}" aria-label="Filter tanggal"><input id="history-search" type="search" value="${escapeHtml(query)}" placeholder="Cari nama atau NIK..." aria-label="Cari riwayat"></div><div class="toolbar-group"><button class="button button-dark" data-export-csv>↓ Ekspor CSV</button></div></div>
    <div class="metrics"><article class="metric"><div class="metric-top"><span>Total catatan</span><span class="metric-icon">01</span></div><strong>${filtered.length}<small>orang</small></strong></article><article class="metric"><div class="metric-top"><span>Hadir tepat waktu</span><span class="metric-icon">02</span></div><strong>${onTime}<small>orang</small></strong></article><article class="metric"><div class="metric-top"><span>Terlambat</span><span class="metric-icon">03</span></div><strong>${late}<small>orang</small></strong></article><article class="metric"><div class="metric-top"><span>Tanggal dipilih</span><span class="metric-icon">04</span></div><strong style="font-size:18px;margin-top:15px">${escapeHtml(formatDate(selectedDate))}</strong></article></div>
    <div class="table-wrap"><table><thead><tr><th>TANGGAL</th><th>KARYAWAN</th><th>DEPARTEMEN</th><th>MASUK</th><th>PULANG</th><th>STATUS</th><th>PERSETUJUAN</th></tr></thead><tbody>${attendanceRows(filtered)}</tbody></table></div></section>`;
}

function render() {
  let user = signedInUser();
  if (user?.role === "employee" && !store.employees.some(person => person.id === user.employeeId && person.status === "Aktif")) {
    sessionStorage.removeItem(SESSION_KEY);
    user = null;
  }
  loginScreen.hidden = Boolean(user);
  appShell.hidden = !user;
  if (!user) return;
  if (user.role === "employee") currentView = "attendance";
  const employee = user.role === "employee" ? store.employees.find(person => person.id === user.employeeId) : null;
  document.querySelector("#signed-in-user").textContent = employee?.nama ?? "Administrator";
  document.querySelector(".user-label small").textContent = employee ? "Portal karyawan" : "Panel operasional";
  document.querySelector(".avatar").textContent = (employee?.nama ?? user.username).slice(0, 2).toUpperCase();
  document.querySelector("#current-section").textContent = sections[currentView];
  document.querySelectorAll(".nav-link").forEach(link => {
    link.hidden = user.role === "employee" && link.dataset.view !== "attendance";
    link.classList.toggle("is-active", link.dataset.view === currentView);
  });
  root.innerHTML = user.role === "employee" ? employeeAttendanceView(user) : currentView === "dashboard" ? dashboardView() : currentView === "employees" ? employeeView() : currentView === "attendance" ? attendanceView() : historyView();
}

loginForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm).entries());
  const error = document.querySelector("#login-error");
  const username = data.username.trim();
  let user = null;
  if (username.toLocaleLowerCase("id") === ADMIN_CREDENTIALS.username && data.password === ADMIN_CREDENTIALS.password) {
    user = { role: "admin", username: ADMIN_CREDENTIALS.username };
  } else {
    const employee = store.employees.find(person => person.status === "Aktif" && person.nik.toLocaleLowerCase("id") === username.toLocaleLowerCase("id"));
    if (employee && data.password.toLocaleLowerCase("id") === employee.nik.toLocaleLowerCase("id")) {
      user = { role: "employee", username: employee.nik, employeeId: employee.id };
    }
  }
  if (!user) {
    error.hidden = false;
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  error.hidden = true;
  loginForm.reset();
  currentView = user.role === "employee" ? "attendance" : "dashboard";
  render();
});

function navigate(view, query = "") {
  if (signedInUser()?.role === "employee") view = "attendance";
  currentView = sections[view] ? view : "dashboard";
  location.hash = query ? `${currentView}?${query}` : currentView;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openEmployeeDialog(person = null) {
  form.reset();
  document.querySelector("#dialog-title").textContent = person ? "Edit karyawan" : "Tambah karyawan";
  for (const [key, value] of Object.entries(person ?? {})) {
    if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value;
  }
  dialog.showModal();
}

function downloadFile(filename, content, type) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(new Blob([content], { type }));
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCsv() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const date = params.get("date") || localDate();
  const query = (params.get("q") || "").toLocaleLowerCase("id");
  const records = store.attendance.filter(record => record.tanggal === date).filter(record => {
    const person = store.employees.find(item => item.id === record.karyawan_id);
    return !query || [person?.nama, person?.nik, person?.departemen, person?.jabatan].some(value => String(value ?? "").toLocaleLowerCase("id").includes(query));
  });
  const cells = [["No", "Tanggal", "NIK", "Nama", "Departemen", "Jabatan", "Jam Masuk", "Jam Pulang", "Status", "Persetujuan"]];
  records.forEach((record, index) => {
    const person = store.employees.find(item => item.id === record.karyawan_id) ?? {};
    cells.push([index + 1, record.tanggal, person.nik ?? "", person.nama ?? "Karyawan dihapus", person.departemen ?? "", person.jabatan ?? "", record.jam_masuk, record.jam_pulang || "", record.status, record.persetujuan || "Menunggu"]);
  });
  const csv = "\ufeff" + cells.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  downloadFile(`laporan_absensi_${date}.csv`, csv, "text/csv;charset=utf-8");
}

function exportBackup() {
  const backup = { schemaVersion: 1, createdAt: new Date().toISOString(), ...store };
  downloadFile(`cadangan_dty_${localDate()}.json`, JSON.stringify(backup, null, 2), "application/json");
  showToast("Cadangan data berhasil diunduh.");
}

async function restoreBackup(file) {
  try {
    const backup = JSON.parse(await file.text());
    const data = backup?.schemaVersion === 1 ? backup : null;
    if (!data || !Array.isArray(data.employees) || !Array.isArray(data.attendance)) throw new Error("Format cadangan tidak sesuai.");
    const validEmployees = data.employees.every(person => person && typeof person.id === "string" && typeof person.nik === "string" && typeof person.nama === "string");
    const validAttendance = data.attendance.every(record => record && typeof record.id === "string" && typeof record.karyawan_id === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.tanggal));
    if (!validEmployees || !validAttendance) throw new Error("Isi file cadangan tidak valid.");
    if (!confirm("Pulihkan cadangan? Data yang tersimpan pada browser ini akan diganti.")) return;
    store = { employees: data.employees, attendance: normalizeAttendance(data.attendance) };
    persist(); render(); showToast("Cadangan berhasil dipulihkan.");
  } catch (error) {
    showToast(error instanceof SyntaxError ? "File JSON tidak dapat dibaca." : error.message || "Pemulihan gagal.");
  }
}

function changeHistoryFilter() {
  const date = document.querySelector("#history-date")?.value || localDate();
  const query = document.querySelector("#history-search")?.value.trim() || "";
  navigate("history", new URLSearchParams({ date, q: query }));
}

document.addEventListener("click", event => {
  if (event.target.closest("[data-logout]")) {
    sessionStorage.removeItem(SESSION_KEY);
    location.hash = "";
    render();
    return;
  }
  const nav = event.target.closest("[data-view], [data-navigate]");
  if (nav) navigate(nav.dataset.view || nav.dataset.navigate);
  if (event.target.closest("[data-add-employee]")) openEmployeeDialog();
  if (event.target.closest("[data-close-dialog]")) dialog.close();
    if (event.target.closest("[data-close-sick]")) sickDialog.close();
  if (event.target.closest("[data-export-csv]")) exportCsv();
  if (event.target.closest("[data-backup]")) exportBackup();
  const editButton = event.target.closest("[data-edit-employee]");
  if (editButton) openEmployeeDialog(store.employees.find(person => person.id === editButton.dataset.editEmployee));
  const deleteButton = event.target.closest("[data-delete-employee]");
  if (deleteButton) {
    const person = store.employees.find(item => item.id === deleteButton.dataset.deleteEmployee);
    if (person && confirm(`Hapus ${person.nama}? Riwayat absensinya tetap tersimpan.`)) {
      store.employees = store.employees.filter(item => item.id !== person.id);
      persist(); render(); showToast("Data karyawan dihapus.");
    }
  }
  const checkoutButton = event.target.closest("[data-checkout]");
  if (checkoutButton) {
    const record = store.attendance.find(item => item.id === checkoutButton.dataset.checkout);
    const user = signedInUser();
    if (record && !record.jam_pulang && (record.persetujuan || "Disetujui") === "Disetujui" && (user?.role !== "employee" || record.karyawan_id === user.employeeId)) {
      record.jam_pulang = new Date().toTimeString().slice(0, 8);
      persist(); render(); showToast(`Absen pulang ${personName(record.karyawan_id)} dicatat.`);
    }
  }
  const sickButton = event.target.closest("[data-employee-sick]");
  if (sickButton) {
    const user = signedInUser();
    const employeeId = sickButton.dataset.employeeSick;
    if (user?.role !== "employee" || user.employeeId !== employeeId) return;
    if (todayAttendance().some(record => record.karyawan_id === employeeId && record.persetujuan !== "Ditolak")) return showToast("Pengajuan hari ini sudah tercatat.");
    sickForm.reset();
    sickForm.elements.namedItem("employee").value = employeeId;
    sickDialog.showModal();
  }
  const approvalButton = event.target.closest("[data-approve-attendance], [data-reject-attendance]");
  if (approvalButton && signedInUser()?.role === "admin") {
    const recordId = approvalButton.dataset.approveAttendance || approvalButton.dataset.rejectAttendance;
    const record = store.attendance.find(item => item.id === recordId);
    if (record && record.persetujuan === "Menunggu") {
      record.persetujuan = approvalButton.dataset.approveAttendance ? "Disetujui" : "Ditolak";
      persist(); render();
      showToast(record.persetujuan === "Disetujui" ? "Absensi disetujui." : "Pengajuan absensi ditolak.");
    }
  }
});

sickForm.addEventListener("submit", async event => {
  event.preventDefault();
  const user = signedInUser();
  const data = Object.fromEntries(new FormData(sickForm).entries());
  if (user?.role !== "employee" || user.employeeId !== data.employee) return;
  const file = sickForm.elements.namedItem("bukti_skd").files?.[0];
  if (!file) return showToast("Unggah bukti SKD terlebih dahulu.");
  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return showToast("Bukti harus berupa PDF, JPG, atau PNG.");
  if (file.size > MAX_SKD_FILE_SIZE) return showToast("Ukuran bukti SKD maksimal 1 MB.");
  if (todayAttendance().some(record => record.karyawan_id === data.employee && record.persetujuan !== "Ditolak")) {
    sickDialog.close();
    return showToast("Pengajuan hari ini sudah tercatat.");
  }
  try {
    const bukti = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("File bukti tidak dapat dibaca."));
      reader.readAsDataURL(file);
    });
    store.attendance.push({ id: crypto.randomUUID(), karyawan_id: data.employee, tanggal: localDate(), jam_masuk: "", jam_pulang: "", status: "Sakit", persetujuan: "Menunggu", keterangan: data.keterangan.trim(), bukti_skd: { name: file.name, type: file.type, data: bukti } });
    persist(); sickDialog.close(); render(); showToast("Pengajuan sakit dan bukti SKD berhasil dikirim.");
  } catch (error) {
    showToast(error.message || "Bukti SKD gagal diunggah.");
  }
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const duplicate = store.employees.some(person => person.nik.toLowerCase() === data.nik.trim().toLowerCase() && person.id !== data.id);
  if (duplicate) return showToast("NIK sudah terdaftar.");
  if (data.id) {
    const index = store.employees.findIndex(person => person.id === data.id);
    store.employees[index] = { ...store.employees[index], ...data, nik: data.nik.trim(), nama: data.nama.trim() };
  } else {
    store.employees.push({ ...data, id: crypto.randomUUID(), nik: data.nik.trim(), nama: data.nama.trim() });
  }
  persist(); dialog.close(); render(); showToast("Data karyawan tersimpan.");
});

document.addEventListener("submit", event => {
  if (event.target.id !== "checkin-form") return;
  event.preventDefault();
  const employeeId = new FormData(event.target).get("employee");
  if (!employeeId) return showToast("Pilih karyawan terlebih dahulu.");
  const user = signedInUser();
  if (user?.role !== "employee" || user.employeeId !== employeeId) return showToast("Absensi hanya dapat diajukan dari akun karyawan.");
  if (todayAttendance().some(record => record.karyawan_id === employeeId && record.persetujuan !== "Ditolak")) return showToast("Pengajuan hari ini sudah tercatat.");
  const time = new Date().toTimeString().slice(0, 8);
  const record = { id: crypto.randomUUID(), karyawan_id: employeeId, tanggal: localDate(), jam_masuk: time, jam_pulang: "", status: time <= "08:00:00" ? "Hadir" : "Terlambat", persetujuan: "Menunggu" };
  store.attendance.push(record); persist(); render(); showToast(`Absen masuk ${personName(employeeId)} dicatat.`);
});

document.addEventListener("input", event => {
  if (event.target.id === "employee-search") {
    const query = event.target.value.trim();
    const selectionStart = event.target.selectionStart;
    navigate("employees", query ? new URLSearchParams({ q: query }) : "");
    const input = document.querySelector("#employee-search");
    input.focus(); input.setSelectionRange(selectionStart, selectionStart);
  }
  if (event.target.id === "history-search") changeHistoryFilter();
});
document.addEventListener("change", event => { if (event.target.id === "history-date") changeHistoryFilter(); });
document.addEventListener("change", event => {
  if (event.target.id === "restore-backup" && event.target.files?.[0]) {
    restoreBackup(event.target.files[0]);
    event.target.value = "";
  }
});
window.addEventListener("hashchange", () => {
  const [view] = location.hash.slice(1).split("?");
  if (sections[view] && currentView !== view) { currentView = view; render(); }
});
window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY) {
    store = loadStore();
    render();
  }
});

const initialView = location.hash.slice(1).split("?")[0];
if (sections[initialView]) currentView = initialView;
persist();
render();