const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 0;

// Function to create a laporan card
function createLaporanCard(data) {
    const card = document.createElement('div');
    card.className = 'card-style mb-3';

    // Calculate total nilai akhir
    const totalNilaiAkhir = data.barangData.reduce((acc, item) => {
        const nilaiAwal = parseFloat(item.nilaiAwal) || 0;
        const nilaiTambah = parseFloat(item.nilaiTambah) || 0;
        const nilaiKurang = parseFloat(item.nilaiKurang) || 0;
        return acc + nilaiAwal + nilaiTambah - nilaiKurang;
    }, 0);
    
    card.innerHTML = `
        <div class="group-actions dropdown mt-2">
            <button type="button" class="dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fa-solid fa-ellipsis"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
                <li>
                    <a class="dropdown-item" href="laporan.html?id=${data.metadata.created_at}" target="_blank">
                        <i class="fa-solid fa-eye me-2"></i>Laporan
                    </a>
                </li>
                <li>
                    <a class="dropdown-item" type="button" onclick="exportToExcel('${data.metadata.created_at}')">
                        <i class="fa-solid fa-file-export me-2"></i>Excel
                    </a>
                </li>
                <li>
                    <button class="dropdown-item text-danger" onclick="confirmDelete('${data.metadata.created_at}')">
                        <i class="fa-regular fa-trash-can me-2"></i>Hapus
                    </button>
                </li>
            </ul>
        </div>
        <span id="cardContent"></span>
    `;
    
    const compactContent = `
        <div class="sm-pe-4">
            <div class="d-flex flex-column">
                <div class="mb-2">
                    <h6 class="mb-1">
                        <span class="d-inline">Periode: </span>
                        ${dateFormatter(data.metadata.periodeAwal, true)} - 
                        ${dateFormatter(data.metadata.periodeAkhir, true)}
                    </h6>
                    <div>
                        <div class="small text-muted mb-1">
                            <i class="fa-solid fa-boxes-stacked me-1"></i>
                            ${data.barangData.length} Barang
                        </div>
                        <div class="small text-muted">
                            <i class="fa-regular fa-clock me-1"></i>
                            Dibuat: ${dateFormatter(data.metadata.created_at, true)}
                        </div>
                    </div>
                </div>
                <div class="sm-row mb-1">
                    <div class="mt-2">
                        <div class="fw-medium small sm-me-2">Nilai Total:</div>
                        <div class="text-primary fw-medium">${formatCurrency(totalNilaiAkhir)}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const defaultContent = `
        <div class="d-flex justify-content-between align-items-start pe-5">
            <div>
                <h6 class="mb-2">Periode: ${dateFormatter(data.metadata.periodeAwal)} - ${dateFormatter(data.metadata.periodeAkhir)}</h6>
                <div class="small text-muted">
                    <span class="me-3">
                        <i class="fa-solid fa-layer-group me-1"></i>
                        ${data.barangData.length} Barang
                    </span>
                </div>
            </div>
            <div class="text-end">
                <div class="fw-bold">Nilai Total</div>
                <div class="text-primary">
                    ${formatCurrency(totalNilaiAkhir)}
                </div>
            </div>
        </div>
        <div class="small text-muted mt-2">
            <i class="fa-regular fa-clock me-1"></i>
            Dibuat: ${dateFormatter(data.metadata.created_at)}
        </div>
    `;

    // Store the content versions as data attributes
    card.setAttribute('data-default-content', defaultContent);
    card.setAttribute('data-compact-content', compactContent);
    
    // Initial display update
    updateDisplay(card, defaultContent, compactContent);

    return card;
}

// Function to generate pagination
function generatePagination(totalItems) {
    totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            loadData();
        }
    });
    pagination.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === i ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            loadData();
        });
        pagination.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            loadData();
        }
    });
    pagination.appendChild(nextLi);
}

// Function to load and display data
async function loadData() {
    try {
        const totalItems = await getLaporanCount();
        document.getElementById('totalItems').textContent = `Total: ${totalItems} data`;
        generatePagination(totalItems);

        const laporanList = await getLaporanPage(currentPage, ITEMS_PER_PAGE);
        const container = document.getElementById('laporanContainer');
        container.innerHTML = '';

        if (laporanList.length === 0) {
            container.innerHTML = `
                <div class="text-center p-5">
                    <i class="fa-regular fa-folder-open fa-3x mb-3 text-muted"></i>
                    <p class="text-muted">Belum ada data yang tersimpan</p>
                </div>
            `;
            return;
        }

        laporanList.forEach(laporan => {
            container.appendChild(createLaporanCard(laporan));
        });
    } catch (error) {
        console.error('Error loading data:', error);
        showAlert('error', 'Terjadi kesalahan saat memuat data');
    }
}

function showAlert(type, message) {
  let alertContainer = document.getElementById('alertContainer');
  
  // Jika container tidak ada, buat container baru
  if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.id = 'alertContainer';
      document.body.insertBefore(alertContainer, document.body.firstChild);
  }

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertContainer.appendChild(alertDiv);

  // Auto dismiss after 3 seconds
  setTimeout(() => {
      alertDiv.remove();
  }, 3000);
}

function confirmDelete(laporanId) {
  if (confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
      deleteLaporan(laporanId)
          .then(() => {
              showAlert('success', 'Laporan berhasil dihapus');
              loadData(); // Reload data setelah berhasil menghapus
          })
          .catch(error => {
              console.error('Error deleting laporan:', error);
              showAlert('danger', 'Terjadi kesalahan saat menghapus laporan');
          });
  }
}

async function exportToExcel(laporanId) {
  try {
    const completeData = laporanId ? await getLaporanById(laporanId) : await getCompleteData();
    if (!completeData || !completeData.metadata) {
        alert('Tidak ada data laporan yang tersedia atau data tidak lengkap');
        return;
    }

    const data = completeData.barangData;
    const metadata = completeData.metadata;
    
    const wb = XLSX.utils.book_new();
    const ws_data = [];
    
    const textSaldoAwal =  `SALDO AWAL ${dateFormatter(new Date(metadata.periodeAwal)).toUpperCase()}`;
    const textSaldoAkhir = `SALDO AKHIR ${dateFormatter(new Date(metadata.periodeAkhir)).toUpperCase()}`;
    
    // Header rows
    ws_data.push([
      'LIST BARANG ESKTRAKOMPTABEL (DI LUAR NERACA)', 'LIST BARANG ESKTRAKOMPTABEL (DI LUAR NERACA)', 'SATUAN',
      textSaldoAwal, textSaldoAwal,
      'MUTASI', 'MUTASI', 'MUTASI', 'MUTASI',
      textSaldoAkhir, textSaldoAkhir
    ]);
    ws_data.push([
      '', '', '', 
      '', '',
      'BERTAMBAH', 'BERTAMBAH', 'BERKURANG', 'BERKURANG',
      '', ''
    ]);
    ws_data.push([
      'Kode', 'Uraian', '',
      'Kuantitas', 'Nilai',
      'Kuantitas', 'Nilai', 'Kuantitas', 'Nilai',
      'Kuantitas', 'Nilai'
    ]);
    ws_data.push([
      '1', '2', '3',
      '4', '5',
      '6', '7', '8', '9',
      '10', '11'
    ]);
    
    // Pre-calculate group totals
    let totalKuantitasAwal = 0;
    let totalNilaiAwal = 0;
    let totalKuantitasTambah = 0;
    let totalNilaiTambah = 0;
    let totalKuantitasKurang = 0;
    let totalNilaiKurang = 0;
    let totalKuantitasAkhir = 0;
    let totalNilaiAkhir = 0;
    
    data.forEach(barang => {
        totalKuantitasAwal += Number(barang.kuantitasAwal) || 0;
        totalNilaiAwal += Number(barang.nilaiAwal) || 0;
        totalKuantitasTambah += Number(barang.kuantitasTambah) || 0;
        totalNilaiTambah += Number(barang.nilaiTambah) || 0;
        totalKuantitasKurang += Number(barang.kuantitasKurang) || 0;
        totalNilaiKurang += Number(barang.nilaiKurang) || 0;
        totalKuantitasAkhir += (Number(barang.kuantitasAwal) + Number(barang.kuantitasTambah) - Number(barang.kuantitasKurang)) || 0;
        totalNilaiAkhir += (Number(barang.nilaiAwal) + Number(barang.nilaiTambah) - Number(barang.nilaiKurang)) || 0;
    });

    let rowNumber = 5;
    const startGroupRow = rowNumber + 1;

    // Add group row with both formulas and pre-calculated values
    ws_data.push([
        '',
        '',
        '',
        { t: 'n', v: totalKuantitasAwal, f: `SUM(D${startGroupRow}:D${startGroupRow + data.length - 1})` },
        { t: 'n', v: totalNilaiAwal, f: `SUM(E${startGroupRow}:E${startGroupRow + data.length - 1})` },
        { t: 'n', v: totalKuantitasTambah, f: `SUM(F${startGroupRow}:F${startGroupRow + data.length - 1})` },
        { t: 'n', v: totalNilaiTambah, f: `SUM(G${startGroupRow}:G${startGroupRow + data.length - 1})` },
        { t: 'n', v: totalKuantitasKurang, f: `SUM(H${startGroupRow}:H${startGroupRow + data.length - 1})` },
        { t: 'n', v: totalNilaiKurang, f: `SUM(I${startGroupRow}:I${startGroupRow + data.length - 1})` },
        { t: 'n', v: totalKuantitasAkhir, f: `SUM(J${startGroupRow}:J${startGroupRow + data.length - 1})` },
        { t: 'n', v: totalNilaiAkhir, f: `SUM(K${startGroupRow}:K${startGroupRow + data.length - 1})` }
    ]);
    
    rowNumber++;

    // Add item rows with both formulas and pre-calculated values
    data.forEach(barang => {
        const saldoAkhirKuantitas = (Number(barang.kuantitasAwal) + Number(barang.kuantitasTambah) - Number(barang.kuantitasKurang)) || 0;
        const saldoAkhirNilai = (Number(barang.nilaiAwal) + Number(barang.nilaiTambah) - Number(barang.nilaiKurang)) || 0;
        
        ws_data.push([
            barang.kode,
            barang.uraian,
            barang.satuan,
            Number(barang.kuantitasAwal) || 0,
            Number(barang.nilaiAwal) || 0,
            Number(barang.kuantitasTambah) || 0,
            Number(barang.nilaiTambah) || 0,
            Number(barang.kuantitasKurang) || 0,
            Number(barang.nilaiKurang) || 0,
            { t: 'n', v: saldoAkhirKuantitas, f: `D${rowNumber}+F${rowNumber}-H${rowNumber}` },
            { t: 'n', v: saldoAkhirNilai, f: `E${rowNumber}+G${rowNumber}-I${rowNumber}` }
        ]);
        
        rowNumber++;
    });
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Apply styles to all cells
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellRef]) ws[cellRef] = { v: '' };
            
            if (R < 3) {
              ws[cellRef].s = headerStyle;
            } else if (R === 3) {
                ws[cellRef].s = headerNumberStyle;
            } else {
                // Apply number format to numeric columns
                if ([3,4,5,6,7,8,9,10].includes(C)) {
                    ws[cellRef].s = numberStyle;
                } else {
                    ws[cellRef].s = dataStyle;
                }

                if ((startGroupRow - 2) === R) {
                    ws[cellRef].s = {
                        ...ws[cellRef].s,
                        font: {
                            bold: true,
                        },
                        fill: {
                            patternType: 'solid',
                            fgColor: { rgb: "C9C9C9" }
                        }
                    }
                }
            }
        }
    }
    
    // Set column widths
    ws['!cols'] = [
        {wch: 30}, // Kode
        {wch: 30}, // Uraian
        {wch: 8},  // Satuan
        {wch: 12}, // Kuantitas Awal
        {wch: 15}, // Nilai Awal
        {wch: 12}, // Kuantitas Tambah
        {wch: 15}, // Nilai Tambah
        {wch: 12}, // Kuantitas Kurang
        {wch: 15}, // Nilai Kurang
        {wch: 12}, // Kuantitas Akhir
        {wch: 15}  // Nilai Akhir
    ];
    
    // Merge cells for headers
    ws['!merges'] = [
        // Merge untuk header baris pertama
        {s: {r: 0, c: 0}, e: {r: 1, c: 1}}, // LIST BARANG ESKTRAKOMPTABEL
        {s: {r: 0, c: 2}, e: {r: 2, c: 2}}, // SATUAN
        {s: {r: 0, c: 3}, e: {r: 1, c: 4}}, // SALDO AWAL
        {s: {r: 0, c: 5}, e: {r: 0, c: 8}}, // MUTASI
        {s: {r: 0, c: 9}, e: {r: 1, c: 10}}, // SALDO AKHIR
        
        // Merge untuk header baris kedua
        {s: {r: 1, c: 5}, e: {r: 1, c: 6}}, // BERTAMBAH
        {s: {r: 1, c: 7}, e: {r: 1, c: 8}}  // BERKURANG
    ];
    
    // Add sheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "LAP BARANG EKSTRA");

    // Write file with all formatting options enabled
    XLSX.writeFile(wb, `Laporan_Barang_Ekstra_${metadata.periodeAwal}_${metadata.periodeAkhir}.xlsx`, {
        bookType: 'xlsx',
        bookSST: false,
        type: 'binary',
        cellStyles: true,
        compression: true
    });
  } catch (error) {
    console.error('Error in exportToExcel:', error);
    throw error;
  }
}

// Export functions for global use
window.exportToExcel = exportToExcel;
window.confirmDelete = confirmDelete;