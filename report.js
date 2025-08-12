document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form'); // ambil form pertama di halaman

  // URL Google Apps Script (sudah disisipkan)
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxcFu98N9gaEU8TEN0OMqDopNbm0xfIfGCoF-R1a6v3JdXA0PbU3m_cfMywU2AVfs9Paw/exec";

  form.addEventListener('submit', e => {
    e.preventDefault();

    const reportData = {
      name: document.querySelector('#name') ? document.querySelector('#name').value : '',
      date: document.querySelector('#date') ? document.querySelector('#date').value : '',
      description: document.querySelector('#description') ? document.querySelector('#description').value : ''
    };

    if (navigator.onLine) {
      // Kirim langsung ke Google Apps Script
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(reportData),
        headers: { 'Content-Type': 'application/json' }
      }).then(() => {
        alert('Laporan berhasil dikirim.');
        form.reset();
      }).catch((err) => {
        console.error('Kirim online gagal:', err);
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