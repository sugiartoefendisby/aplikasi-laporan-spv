const scriptURL = 'https://script.google.com/macros/s/AKfycbxcFu98N9gaEU8TEN0OMqDopNbm0xfIfGCoF-R1a6v3JdXA0PbU3m_cfMywU2AVfs9Paw/exec';
const form = document.forms['report-form'];

form.addEventListener('submit', e => {
  e.preventDefault();
  fetch(scriptURL, { method: 'POST', body: new FormData(form)})
    .then(response => {
      alert("Laporan berhasil dikirim");
      form.reset();
    })
    .catch(error => {
      console.error('Error!', error.message);
    });
});