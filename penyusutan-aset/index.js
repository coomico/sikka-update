const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 0;

// Function to create a laporan card
function createLaporanCard(data) {
    const card = document.createElement('div');
    card.className = 'card-style mb-3';

    // Calculate total nilai akhir
    const totals = data.barangData.reduce((acc, group) => {
        group.barang.forEach(item => {
            acc.nilaiAkhir += (parseFloat(item.nilai) || 0) -
                            (parseFloat(item.saldo_awal) || 0) - 
                            (parseFloat(item.beban_penyusutan) || 0) - 
                            (parseFloat(item.koreksi) || 0);
        });
        return acc;
    }, { nilaiAkhir: 0 });

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
    `

    const compactContent = `
        <div class="sm-pe-4">
            <div class="d-flex flex-column">
                <div class="mb-2">
                    <h6 class="mb-2">Periode: ${dateFormatter(data.metadata.periode_laporan, true)}</h6>
                    <div>
                        <div class="small text-muted mb-1">
                            <span class="me-3">
                                <i class="fa-solid fa-layer-group me-1"></i>
                                ${data.barangData.length} Kelompok
                            </span>
                            <span>
                                <i class="fa-solid fa-boxes-stacked me-1"></i>
                                ${data.barangData.reduce((acc, group) => acc + group.barang.length, 0)} Barang
                            </span>
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
                        <div class="text-primary fw-medium">${formatCurrency(totals.nilaiAkhir)}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const defaultContent = `
        <div class="d-flex justify-content-between align-items-start pe-5">
            <div>
                <h6 class="mb-2">Periode: ${dateFormatter(data.metadata.periode_laporan)}</h6>
                <div class="small text-muted">
                    <span class="me-3">
                        <i class="fa-solid fa-layer-group me-1"></i>
                        ${data.barangData.length} Kelompok
                    </span>
                    <span>
                        <i class="fa-solid fa-boxes-stacked me-1"></i>
                        ${data.barangData.reduce((acc, group) => acc + group.barang.length, 0)} Barang
                    </span>
                </div>
            </div>
            <div class="text-end">
                <div class="fw-bold">Nilai Total</div>
                <div class="text-primary">
                    ${formatCurrency(totals.nilaiAkhir)}
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
        const startGroupRows = new Set();

        const textSaldoAkhir = `SALDO AKHIR ${dateFormatter(new Date(metadata.periode_laporan)).toUpperCase()}`;
        
        // Header rows
        ws_data.push([
          '',
          'AKUN NERACA / ITEM BARANG', 'AKUN NERACA / ITEM BARANG',
          'SATUAN',
          textSaldoAkhir, textSaldoAkhir
        ]);
        ws_data.push([
          '',
          '', '',
          '', 
          'Kuantitas', 'Nilai',
          'AKUMULASI PENYUSUTAN', 'AKUMULASI PENYUSUTAN', 'AKUMULASI PENYUSUTAN', 'AKUMULASI PENYUSUTAN',
          'Nilai Buku'
        ]);
        ws_data.push([
          'Kode BAS', 'Kode', 'Uraian',
          '', '', '',
          'Saldo Awal', 'Beban Penyusutan',
          'Koreksi', 'Total'
        ]);
        ws_data.push([
          '0', '1', '2', '3',
          '4', '5',
          '6', '7', '8', '9 = 6+7+8',
          '10 = 5-9'
        ]);
        
        let rowNumber = 5;
        data.forEach(group => {
            const startGroupRow = rowNumber + 1;
            startGroupRows.add(rowNumber - 1);
            
            // Pre-calculate group totals
            let totalNilai = 0;
            let totalSaldoAwal = 0;
            let totalBebanPenyusutan = 0;
            let totalKoreksi = 0;
            
            group.barang.forEach(item => {
                totalNilai += Number(item.nilai) || 0;
                totalSaldoAwal += Number(item.saldo_awal) || 0;
                totalBebanPenyusutan += Number(item.beban_penyusutan) || 0;
                totalKoreksi += Number(item.koreksi) || 0;
            });
                    
            const grandTotal = totalSaldoAwal + totalBebanPenyusutan + totalKoreksi;
            const totalNilaiBuku = totalNilai - grandTotal;
            
            // Add group row with both formulas and pre-calculated values
            ws_data.push([
                `${group.kode} ${group.uraian}`,
                group.kode,
                group.uraian,
                '',
                '',
                { t: 'n', v: totalNilai, f: `SUM(F${startGroupRow}:F${startGroupRow + group.barang.length - 1})` },
                { t: 'n', v: totalSaldoAwal, f: `SUM(G${startGroupRow}:G${startGroupRow + group.barang.length - 1})` },
                { t: 'n', v: totalBebanPenyusutan, f: `SUM(H${startGroupRow}:H${startGroupRow + group.barang.length - 1})` },
                { t: 'n', v: totalKoreksi, f: `SUM(I${startGroupRow}:I${startGroupRow + group.barang.length - 1})` },
                { t: 'n', v: grandTotal, f: `SUM(J${startGroupRow}:J${startGroupRow + group.barang.length - 1})` },
                { t: 'n', v: totalNilaiBuku, f: `SUM(K${startGroupRow}:K${startGroupRow + group.barang.length - 1})` },
            ]);
            
            rowNumber++;
            
            // Add item rows with both formulas and pre-calculated values
            group.barang.forEach(item => {
                const saldoTotal = (Number(item.saldo_awal) + Number(item.beban_penyusutan) + Number(item.koreksi)) || 0;
                const saldoNilaiBuku = (Number(item.nilai) - saldoTotal) || 0;
                
                ws_data.push([
                    'Kode Barang',
                    item.kode,
                    item.uraian,
                    item.satuan,
                    Number(item.kuantitas) || 0,
                    Number(item.nilai) || 0,
                    Number(item.saldo_awal) || 0,
                    Number(item.beban_penyusutan) || 0,
                    Number(item.koreksi) || 0,
                    { t: 'n', v: saldoTotal, f: `G${rowNumber}+H${rowNumber}+I${rowNumber}` },
                    { t: 'n', v: saldoNilaiBuku, f: `F${rowNumber}-J${rowNumber}` }
                ]);
                
                rowNumber++;
            });
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
                    if ([4,5,6,7,8,9,10,11].includes(C)) {
                        ws[cellRef].s = numberStyle;
                    } else {
                        ws[cellRef].s = dataStyle;
                    }

                    if (startGroupRows.has(R)) {
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
            {wch: 30}, // Kode BAS
            {wch: 30}, // Kode
            {wch: 30}, // Uraian
            {wch: 8},  // Satuan
            {wch: 12}, // Kuantitas
            {wch: 18}, // Nilai
            {wch: 18}, // Saldo Awal
            {wch: 18}, // Beban Penyusutan
            {wch: 18}, // Koreksi
            {wch: 18}, // Total
            {wch: 18}  // Nilai Buku
        ];
        
        // Merge cells for headers
        ws['!merges'] = [
            // Merge untuk header baris pertama
            {s: {r: 0, c: 0}, e: {r: 1, c: 0}}, //
            {s: {r: 0, c: 1}, e: {r: 1, c: 2}}, // AKUN NERACA
            {s: {r: 0, c: 3}, e: {r: 2, c: 3}}, // SATUAN
            {s: {r: 0, c: 4}, e: {r: 0, c: 10}}, // SALDO AKHIR
            
            // Merge untuk header baris kedua
            {s: {r: 1, c: 4}, e: {r: 2, c: 4}}, // KUANTITAS
            {s: {r: 1, c: 5}, e: {r: 2, c: 5}}, // NILAI
            {s: {r: 1, c: 6}, e: {r: 1, c: 9}}, // AKUMULASI PENYUSUTAN
            {s: {r: 1, c: 10}, e: {r: 2, c: 10}}  // NILAI BUKU
        ];
        
        // Add sheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "LAP PENYUSUTAN ASET");

        // Write file with all formatting options enabled
        XLSX.writeFile(wb, `Laporan_Penyusutan_Aset_${metadata.periode_laporan}.xlsx`, {
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

window.exportToExcel = exportToExcel;
window.confirmDelete = confirmDelete;