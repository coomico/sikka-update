let allCutoffData = [];
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let deleteItemId = null;
let deleteModal = null;

async function loadCutoffData() {
    try {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const noDataMessage = document.getElementById('noDataMessage');
        const totalItemsElement = document.getElementById('totalItems');
        const cutoffContainer = document.getElementById('cutoffContainer');
        
        if (loadingIndicator) {
            loadingIndicator.classList.remove('d-none');
        }
        
        allCutoffData = await window.CutoffDB.getAllCutoffData();
        
        if (totalItemsElement) {
            totalItemsElement.textContent = allCutoffData.length;
        }
        
        if (loadingIndicator) {
            loadingIndicator.classList.add('d-none');
        }
        
        if (cutoffContainer && cutoffContainer !== noDataMessage) {
            cutoffContainer.innerHTML = '';
        }
        
        if (allCutoffData.length === 0) {
            if (noDataMessage) {
                noDataMessage.classList.remove('d-none');
            }
            const paginationElement = document.getElementById('pagination');
            if (paginationElement) {
                paginationElement.innerHTML = '';
            }
            return;
        } else if (noDataMessage) {
            noDataMessage.classList.add('d-none');
        }
        
        allCutoffData.sort((a, b) => b.timestamp - a.timestamp);
        generatePagination();
        displayPage(1);
        
        const deleteModalElement = document.getElementById('deleteConfirmModal');
        if (deleteModalElement) {
            deleteModal = new bootstrap.Modal(deleteModalElement);
            const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
            if (confirmDeleteBtn) {
                confirmDeleteBtn.removeEventListener('click', confirmDelete);
                confirmDeleteBtn.addEventListener('click', confirmDelete);
            }
        }
        
    } catch (error) {
        console.error('Error loading cutoff data:', error);
        const loadingIndicator = document.getElementById('loadingIndicator');
        const cutoffContainer = document.getElementById('cutoffContainer');
        if (loadingIndicator) {
            loadingIndicator.classList.add('d-none');
        }
        if (cutoffContainer) {
            cutoffContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fa-solid fa-circle-exclamation me-2"></i>
                    Gagal memuat data: ${error.message || error}
                </div>
            `;
        }
    }
}

function generatePagination() {
    const totalPages = Math.ceil(allCutoffData.length / ITEMS_PER_PAGE);
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';
    paginationElement.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        paginationElement.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    paginationElement.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;
    
    const pageLinks = paginationElement.querySelectorAll('.page-link');
    pageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageNum = parseInt(this.getAttribute('data-page'));
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                displayPage(pageNum);
            }
        });
    });
}

function displayPage(pageNum) {
    currentPage = pageNum;
    const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, allCutoffData.length);
    const pageData = allCutoffData.slice(startIndex, endIndex);
    const paginationItems = document.querySelectorAll('#pagination .page-item');
    paginationItems.forEach(item => {
        const link = item.querySelector('.page-link');
        const linkPage = link.getAttribute('data-page');
        
        if (linkPage == currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
        
        if (item.querySelector('[aria-label="Previous"]')) {
            item.classList.toggle('disabled', currentPage === 1);
            link.setAttribute('data-page', currentPage - 1);
        }
        
        if (item.querySelector('[aria-label="Next"]')) {
            const totalPages = Math.ceil(allCutoffData.length / ITEMS_PER_PAGE);
            item.classList.toggle('disabled', currentPage === totalPages);
            link.setAttribute('data-page', currentPage + 1);
        }
    });
    
    const container = document.getElementById('cutoffContainer');
    container.innerHTML = '';
    
    pageData.forEach(data => {
        const card = createCutoffCard(data);
        container.appendChild(card);
    });
}

function createCutoffCard(data) {
    const groupCount = data.groups.length;
    let transactionCount = 0;
    let totalAkrualDebit = 0;
    let totalKasDebit = 0;
    
    data.groups.forEach(group => {
        transactionCount += group.transactions.length;
        
        group.transactions.forEach(transaction => {
            totalAkrualDebit += transaction.akrual.debit.nilai || 0;
            totalKasDebit += transaction.kas.debit.nilai || 0;
        });
    });
    
    const date = new Date(data.timestamp);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    const card = document.createElement('div');
    card.className = 'card-style mb-3 position-relative';
    card.innerHTML = `
        <div class="group-actions dropdown" style="z-index: 100;">
            <button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item export-item" href="#" data-id="${data.id}">
                    <i class="fa-solid fa-file-export"></i> Export Excel
                </a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger delete-item" href="#" data-id="${data.id}">
                    <i class="fa-regular fa-trash-can"></i> Hapus
                </a></li>
            </ul>
        </div>
        <div class="row">
            <div class="col">
                <h5 class="mb-2">Data Cutoff #${data.id}</h5>
                <p class="mb-0 text-muted small">
                    <i class="fa-regular fa-calendar me-1"></i> ${formattedDate}
                </p>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12 d-flex">
                <div class="me-3">
                    <span class="badge bg-secondary rounded-pill">
                        <i class="fa-solid fa-layer-group me-1"></i> ${groupCount} grup
                    </span>
                </div>
                <div>
                    <span class="badge bg-primary rounded-pill">
                        <i class="fa-solid fa-receipt me-1"></i> ${transactionCount} transaksi
                    </span>
                </div>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12 d-flex flex-wrap">
                <div class="me-4">
                    <span class="small text-muted me-2">Nilai Akrual:</span>
                    <span class="fw-semibold">${formatCurrency(totalAkrualDebit)}</span>
                </div>
                <div>
                    <span class="small text-muted me-2">Nilai Kas:</span>
                    <span class="fw-semibold">${formatCurrency(totalKasDebit)}</span>
                </div>
            </div>
        </div>
    `;
    
    const exportBtn = card.querySelector('.export-item');
    const deleteBtn = card.querySelector('.delete-item');
    
    exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportToExcel(data.id);
    });
    
    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showDeleteConfirmation(data.id);
    });
    
    return card;
}

async function exportToExcel(id) {
    try {
        const data = await window.CutoffDB.getCutoffDataById(id);
        if (!data) {
            alert('Data cutoff tidak ditemukan');
            return;
        }

        let excelData = [];
        let fileName = `CutoffData_${id}_${new Date().toISOString().split('T')[0]}.xlsx`;
        const startGroupRows = new Set();

        excelData.push(['DATA CUTOFF #' + id]);
        excelData.push([
          'Tanggal Export: ',
          '',
          new Date().toLocaleDateString('id-ID')
        ]);
        excelData.push([]);

        excelData.push([
          '','',
          'BUKU BESAR AKRUAL',
          '','','','',
          'BUKU BESAR KAS'
        ]);
        excelData.push([
          'Tanggal',
          'Bukti Transaksi',
          'Kode Akun',
          'Nama Akun',
          'Debit',
          'Kredit',
          'Keterangan',

          'Kode Akun',
          'Nama Akun',
          'Debit',
          'Kredit',
          'Keterangan',
        ]);

        let rowNumber = 4;
        data.groups.forEach(group => {
            startGroupRows.add(rowNumber + 1);

            excelData.push([
              getGroupFullName(group.name),
              '','','','','','',
              'TRANSAKSI'
            ]);
            rowNumber++;

            group.transactions.forEach((transaction, _) => {
                excelData.push([
                    transaction.tanggal,
                    transaction.bukti,
                    transaction.akrual.debit.kode,
                    transaction.akrual.debit.nama,
                    transaction.akrual.debit.nilai,
                    '',
                    transaction.akrual.keterangan,
                    transaction.kas.debit.kode,
                    transaction.kas.debit.nama,
                    transaction.kas.debit.nilai,
                    '',
                    transaction.kas.keterangan
                ]);
                rowNumber++;

                excelData.push([
                  '',
                  '',
                  transaction.akrual.kredit.kode,
                  transaction.akrual.kredit.nama,
                  '',
                  transaction.akrual.kredit.nilai,
                  '',
                  transaction.kas.kredit.kode,
                  transaction.kas.kredit.nama,
                  '',
                  transaction.kas.kredit.nilai,
                  ''
                ]);
                rowNumber++;
            });

            let totalAkrualDebit = 0;
            let totalAkrualKredit = 0;
            let totalKasDebit = 0;
            let totalKasKredit = 0;

            group.transactions.forEach(transaction => {
                totalAkrualDebit += transaction.akrual.debit.nilai || 0;
                totalAkrualKredit += transaction.akrual.kredit.nilai || 0;
                totalKasDebit += transaction.kas.debit.nilai || 0;
                totalKasKredit += transaction.kas.kredit.nilai || 0;
            });

            excelData.push([
                '', '', '', 'TOTAL:',
                totalAkrualDebit,
                totalAkrualKredit,
                '',
                '', '',
                totalKasDebit,
                totalKasKredit,
                ''
            ]);
            rowNumber++;
        });

        const workbook = window.XLSX.utils.book_new();
        const worksheet = window.XLSX.utils.aoa_to_sheet(excelData);

        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; R++) {
            for (let C = range.s.c; C <= range.e.c; C++) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
                
                if (R >= 3 && R <= 4) {
                  worksheet[cellRef].s = headerStyle;
                } else {
                    if ([4,5,9,10].includes(C)) {
                      worksheet[cellRef].s = numberStyle;
                    } else {
                      worksheet[cellRef].s = dataStyle;
                    }

                    if (startGroupRows.has(R)) {
                      worksheet[cellRef].s = {
                            ...worksheet[cellRef].s,
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

        worksheet['!cols'] = [
          { wch: 12 }, // Tanggal
          { wch: 30 }, // Bukti
          { wch: 12 }, // Kode Akun Akrual
          { wch: 25 }, // Nama Akun Akrual
          { wch: 15 }, // Nilai Debit Akrual
          { wch: 15 }, // Nilai Kredit Akrual
          { wch: 30 }, // Keterangan Akrual

          { wch: 12 }, // Kode Akun Kas
          { wch: 25 }, // Nama Akun Kas
          { wch: 15 }, // Nilai Debit Kas
          { wch: 15 }, // Nilai Kredit Kas
          { wch: 30 }  // Keterangan Kas
      ];

      let merger = [
        {s: {r: 0, c: 0}, e: {r: 0, c: 1}}, // DATA CUTOFF #
        {s: {r: 1, c: 0}, e: {r: 1, c: 1}}, // Tanggal Export

        // Merge untuk header baris pertama
        {s: {r: 3, c: 2}, e: {r: 3, c: 6}}, // BUKU BESAR AKRUAL
        {s: {r: 3, c: 7}, e: {r: 3, c: 11}}, // BUKU BESAR KAS
      ];

      startGroupRows.forEach(r => {
        merger = [
          ...merger,
          {s: {r: r, c: 0}, e: {r: r, c: 6}}, // Nama Group
          {s: {r: r, c: 7}, e: {r: r, c: 11}} // TRANSAKSI
        ];
      });
      console.dir(merger);

      worksheet['!merges'] = merger;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Cutoff");
      XLSX.writeFile(workbook, fileName);
      
      alert('Data berhasil diexport ke Excel!');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Gagal mengexport data: ' + (error.message || error));
    }
}

function showDeleteConfirmation(id) {
    deleteItemId = id;
    deleteModal.show();
}

async function confirmDelete() {
    if (deleteItemId) {
        try {
            await window.CutoffDB.deleteCutoffData(deleteItemId);
            
            if (deleteModal) {
                deleteModal.hide();
            }
            
            const cutoffContainer = document.getElementById('cutoffContainer');
            if (cutoffContainer) {
                cutoffContainer.innerHTML = '';
            }
            
            await loadCutoffData();
        } catch (error) {
            console.error('Error deleting data:', error);
            alert('Gagal menghapus data: ' + (error.message || error));
        }
    }
}