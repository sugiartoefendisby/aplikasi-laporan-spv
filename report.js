// report.js

// URL Google Apps Script yang telah di-deploy sebagai Web App.
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyIzLo-rMlB70_eGXFTiRTWjNeW4vbZdINzjMsSyNLUXeKlFob-Z6lbis5wxCtvlOFeoQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  const spvNameElement = document.getElementById("spvName");
  const jobPackageSectionsContainer =
    document.getElementById("jobPackageSections");
  const reportForm = document.getElementById("reportForm");
  const reportMessage = document.getElementById("reportMessage");
  const logoutBtn = document.getElementById("logoutBtn");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const reportDateInput = document.getElementById("reportDate");
  const displayReportDateSpan = document.getElementById("displayReportDate");
  const reportContent = document.getElementById("reportContent");
  const reportSummary = document.getElementById("reportSummary");

  const loggedInUsername = localStorage.getItem("loggedInUsername");

  if (!loggedInUsername) {
    window.location.href = "index.html";
    return;
  } else {
    spvNameElement.textContent = `Login sebagai: ${loggedInUsername}`;
    // Fetch data saat halaman dimuat
    fetchAndRenderReportSections(loggedInUsername);
  }

  // Fungsi untuk mengambil data paket pekerjaan dari Google Sheet dan merender form
  async function fetchAndRenderReportSections(spvName) {
    reportContent.style.display = "block";
    reportSummary.style.display = "none";

    if (loadingIndicator) {
      loadingIndicator.style.display = "flex";
    }

    try {
      const url = `${APPS_SCRIPT_URL}?action=getWorkData&spvName=${spvName}`;
      const response = await fetch(url);
      const packages = await response.json();

      if (packages && packages.length > 0) {
        jobPackageSectionsContainer.innerHTML = "";
        packages.forEach((pkg, index) => {
          const section = document.createElement("div");
          section.classList.add("job-package-section");
          section.dataset.akhirKontrak = pkg.akhirKontrak;
          section.innerHTML = `
            <h3>${pkg.jobPackage || ""}</h3>
            <div class="job-details">
              <p>Penyedia: <span>${pkg.provider || ""}</span></p>
              <p>Nilai: <span>${pkg.nilai || "Belum diisi"}</span></p>
              <p>Sisa Waktu: <span class="remaining-time" id="remainingTime_${index}">-</span></p>
            </div>
            <div class="table-container">
              <table class="job-package-table">
                <thead>
                  <tr>
                    <th>Minggu Lalu</th>
                    <th>Minggu Ini</th>
                    <th>Rencana</th>
                    <th>Deviasi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <input type="number" name="lastWeek_${index}" class="last-week-input" required step="0.01" />
                    </td>
                    <td>
                      <input type="number" name="thisWeek_${index}" class="this-week-input" data-index="${index}" required step="0.01" />
                    </td>
                    <td>
                      <input type="number" name="plan_${index}" class="plan-input" data-index="${index}" required step="0.01" />
                    </td>
                    <td class="deviasi-cell">
                      <input type="text" name="deviation_${index}" class="deviation-output deviation-positive" readonly value="0.00" />
                    </td>
                  </tr>
                  <tr>
                      <th colspan="4">Kegiatan</th>
                  </tr>
                  <tr>
                      <td colspan="4">
                          <textarea name="activity_${index}" required></textarea>
                      </td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
          jobPackageSectionsContainer.appendChild(section);
        });
      } else {
        jobPackageSectionsContainer.innerHTML =
          "<p>Tidak ada paket pekerjaan untuk SPV ini.</p>";
      }
    } catch (error) {
      console.error("Error fetching work data:", error);
      jobPackageSectionsContainer.innerHTML =
        "<p>Gagal memuat data. Silakan coba refresh halaman.</p>";
    } finally {
      if (loadingIndicator) {
        loadingIndicator.style.display = "none";
      }
    }
  }

  // Menambahkan event listener untuk menghitung deviasi dan sisa waktu
  reportForm.addEventListener("input", (e) => {
    const target = e.target;
    if (
      target.classList.contains("this-week-input") ||
      target.classList.contains("plan-input")
    ) {
      calculateDeviation(target);
    }
  });

  reportDateInput.addEventListener("change", (e) => {
    const reportDateValue = e.target.value;
    calculateRemainingTime(reportDateValue);

    // Format dan tampilkan tanggal laporan
    if (reportDateValue) {
      const dateObj = new Date(reportDateValue);
      const options = { day: "2-digit", month: "short", year: "numeric" };
      const formattedDate = dateObj.toLocaleDateString("id-ID", options);
      displayReportDateSpan.textContent = `(${formattedDate})`;
    } else {
      displayReportDateSpan.textContent = "";
    }
  });

  function calculateDeviation(inputElement) {
    const section = inputElement.closest(".job-package-section");
    if (!section) return;

    const thisWeekInput = section.querySelector(".this-week-input");
    const planInput = section.querySelector(".plan-input");
    const deviationOutput = section.querySelector(".deviation-output");

    const thisWeekValue = parseFloat(thisWeekInput.value) || 0;
    const planValue = parseFloat(planInput.value) || 0;

    const deviation = thisWeekValue - planValue;

    // Format deviasi menjadi 2 desimal
    const formattedDeviation = deviation.toFixed(2);
    deviationOutput.value = formattedDeviation;

    // Ubah warna berdasarkan nilai
    if (deviation < 0) {
      deviationOutput.classList.remove("deviation-positive");
      deviationOutput.classList.add("deviation-negative");
    } else {
      deviationOutput.classList.remove("deviation-negative");
      deviationOutput.classList.add("deviation-positive");
    }
  }

  function calculateRemainingTime(reportDateStr) {
    if (!reportDateStr) {
      const sections = jobPackageSectionsContainer.querySelectorAll(
        ".job-package-section"
      );
      sections.forEach((section, index) => {
        const remainingTimeSpan = document.getElementById(
          `remainingTime_${index}`
        );
        remainingTimeSpan.textContent = "-";
        remainingTimeSpan.classList.remove(
          "remaining-negative",
          "remaining-positive"
        );
      });
      return;
    }
    const reportDate = new Date(reportDateStr);
    const sections = jobPackageSectionsContainer.querySelectorAll(
      ".job-package-section"
    );

    sections.forEach((section, index) => {
      const akhirKontrakStr = section.dataset.akhirKontrak;
      const remainingTimeSpan = document.getElementById(
        `remainingTime_${index}`
      );

      if (akhirKontrakStr) {
        const akhirKontrak = new Date(akhirKontrakStr);
        const timeDiff = akhirKontrak.getTime() - reportDate.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (dayDiff >= 0) {
          remainingTimeSpan.textContent = `${dayDiff} hari`;
          remainingTimeSpan.classList.remove("remaining-negative");
          remainingTimeSpan.classList.add("remaining-positive");
        } else {
          remainingTimeSpan.textContent = `Melebihi Kontrak ${Math.abs(
            dayDiff
          )} hari`;
          remainingTimeSpan.classList.remove("remaining-positive");
          remainingTimeSpan.classList.add("remaining-negative");
        }
      } else {
        remainingTimeSpan.textContent = "-";
      }
    });
  }

  reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const reportDate = document.getElementById("reportDate").value;
    if (!reportDate) {
      reportMessage.textContent = "Silakan pilih tanggal laporan.";
      reportMessage.style.color = "#ff6347";
      reportMessage.style.display = "block";
      return;
    }

    if (loadingIndicator) {
      loadingIndicator.style.display = "flex";
    }

    const spvName = loggedInUsername;
    const packages = await fetchWorkData(spvName);
    const sections = jobPackageSectionsContainer.querySelectorAll(
      ".job-package-section"
    );

    const reportData = [];
    sections.forEach((section, index) => {
      const lastWeekInput = section.querySelector(".last-week-input");
      const thisWeekInput = section.querySelector(".this-week-input");
      const planInput = section.querySelector(".plan-input");
      const deviationOutput = section.querySelector(".deviation-output");
      const activityTextarea = section.querySelector("textarea");

      reportData.push({
        spv: spvName,
        jobPackage: packages[index].jobPackage,
        provider: packages[index].provider,
        nilai: packages[index].nilai || "",
        reportDate: reportDate,
        lastWeekProgress: lastWeekInput.value || 0,
        thisWeekProgress: thisWeekInput.value || 0,
        plan: planInput.value || 0,
        deviation: deviationOutput.value || 0,
        activity: activityTextarea.value || "",
      });
    });

    try {
      // Menambahkan real-time timestamp dari komputer saat ini
      const timestamp = new Date().toLocaleString();
      const payload = {
        action: "saveReport",
        data: reportData.map((item) => ({ ...item, timestamp: timestamp })),
      };

      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Tampilkan ringkasan laporan
      displayReportSummary(reportData);
    } catch (error) {
      console.error("Error submitting report:", error);
      reportMessage.textContent = "Gagal mengirim laporan. Silakan coba lagi.";
      reportMessage.style.color = "#ff6347";
      reportMessage.style.display = "block";
    } finally {
      if (loadingIndicator) {
        loadingIndicator.style.display = "none";
      }
    }
  });

  // Fungsi untuk menampilkan ringkasan laporan setelah dikirim
  function displayReportSummary(reportData) {
    reportContent.style.display = "none";
    reportSummary.style.display = "block";

    let summaryHtml = `
      <h2>Ringkasan Laporan Berhasil Dikirim</h2>
      <button class="new-report-btn" id="newReportBtn">Buat Laporan Baru</button>
      <div class="summary-details">
        <p>Tanggal Laporan: <span>${new Date(
          reportData[0].reportDate
        ).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}</span></p>
      </div>
    `;

    reportData.forEach((item) => {
      summaryHtml += `
        <div class="summary-details">
          <h3>${item.jobPackage}</h3>
          <p>Penyedia: <span>${item.provider}</span></p>
          <p>Nilai: <span>${item.nilai || "Belum diisi"}</span></p>
          <p>Progres Minggu Lalu: <span>${item.lastWeekProgress}%</span></p>
          <p>Progres Minggu Ini: <span>${item.thisWeekProgress}%</span></p>
          <p>Rencana: <span>${item.plan}%</span></p>
          <p>Deviasi: <span class="${
            item.deviation < 0 ? "deviation-negative" : "deviation-positive"
          }">${item.deviation}</span></p>
          <p>Kegiatan: <span>${item.activity}</span></p>
        </div>
      `;
    });

    reportSummary.innerHTML = summaryHtml;

    // Tambahkan event listener untuk tombol "Buat Laporan Baru"
    document.getElementById("newReportBtn").addEventListener("click", () => {
      fetchAndRenderReportSections(loggedInUsername);
    });
  }

  // Fungsi helper untuk mengambil data pekerjaan
  async function fetchWorkData(spvName) {
    const url = `${APPS_SCRIPT_URL}?action=getWorkData&spvName=${spvName}`;
    const response = await fetch(url);
    return response.json();
  }

  // Tambahkan event listener untuk tombol Keluar
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUsername");
      window.location.href = "index.html";
    });
  }
});
