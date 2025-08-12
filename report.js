// report.js

// URL Google Apps Script yang telah di-deploy sebagai Web App.
const APPS_SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbxcFu98N9gaEU8TEN0OMqDopNbm0xfIfGCoF-R1a6v3JdXA0PbU3m_cfMywU2AVfs9Paw/exec";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#form-laporan');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const reportData = {
      nama: document.querySelector('#nama').value,
      tanggal: document.querySelector('#tanggal').value,
      deskripsi: document.querySelector('#deskripsi').value
    };

    if (navigator.onLine) {
      // Kirim langsung ke Google Apps Script
      fetch('https://script.google.com/macros/s/AKfycbxcFu98N9gaEU8TEN0OMqDopNbm0xfIfGCoF-R1a6v3JdXA0PbU3m_cfMywU2AVfs9Paw/exec', {
        method: 'POST',
        body: JSON.stringify(reportData),
        headers: { 'Content-Type': 'application/json' }
      }).then(() => {
        alert('Laporan berhasil dikirim.');
        form.reset();
      }).catch(() => {
        alert('Gagal mengirim laporan.');
      });
    } else {
      // Simpan offline via Service Worker
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SAVE_REPORT',
          payload: reportData
        });
        alert('Tidak ada koneksi. Laporan disimpan sementara dan akan dikirim saat online.');
        form.reset();
      } else {
        alert('Service worker tidak aktif, tidak bisa menyimpan offline.');
      }
    }
  });

});
