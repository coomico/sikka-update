document.addEventListener('DOMContentLoaded', function() {
  let transactionCounter = 0;
  const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
  const resetModal = new bootstrap.Modal(document.getElementById('resetModal'));
  
  document.getElementById('addTransaksi').addEventListener('click', addNewTransaction);
  document.getElementById('saveData').addEventListener('click', validateAndConfirm);
  document.getElementById('confirmSend').addEventListener('click', sendAndDownloadData);
  document.getElementById('resetForm').addEventListener('click', () => resetModal.show());
  document.getElementById('confirmReset').addEventListener('click', resetFormData);

  addNewTransaction();

  document.addEventListener('input', function(event) {
    const target = event.target;
    if (target.classList.contains('debit') || target.classList.contains('kredit')) {
      updateTotals();
      updateInputVisualState(target);
      
      if (!target.disabled) {
        updatePairFields(target);
      }
    }
  });

  function resetFormData() {
    resetModal.hide();
    document.getElementById('koreksiEntries').innerHTML = '';
    transactionCounter = 0;
    
    addNewTransaction();
    updateTotals();
    showAlert('info', 'Form telah direset');
  }

  function addNewTransaction() {
    transactionCounter++;
    const rowId = transactionCounter;
    const tbody = document.getElementById('koreksiEntries');
    
    const debitRow = createRow('debit', rowId);
    const kreditRow = createRow('kredit', rowId);
    const infoRow = createInfoRow(rowId);
    const spacerRow = createSpacerRow();
    
    tbody.append(debitRow, kreditRow, infoRow, spacerRow);
    attachEventHandlers(debitRow, kreditRow);
    updateTotals();
  }
  
  function createRow(type, transactionId) {
    const row = document.createElement('tr');
    row.className = type === 'kredit' 
      ? 'transaction-pair transaction-separator' 
      : 'transaction-pair';
    row.dataset.transaction = transactionId;
    row.dataset.type = type;
    
    let html = '';
    
    if (type === 'debit') {
      html = `
        <td rowspan="2" class="action-cell">
            <div class="row-actions">
                <button type="button" class="btn btn-secondary btn-sm copy-transaksi" title="Salin Transaksi">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm remove-transaksi" title="Hapus">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        </td>
        <td rowspan="2" class="date-cell">
            <input type="date" class="form-control tanggal" required>
        </td>
        <td rowspan="2" class="bukti-cell">
            <input type="text" class="form-control bukti" placeholder="No. Bukti Transaksi" required>
        </td>`;
    }
    
    html += `
        <td class="akrual-kode-cell">
            <input type="text" class="form-control kode-akun" placeholder="Kode" required>
        </td>
        <td class="akrual-nama-cell">
            <input type="text" class="form-control nama-akun" placeholder="Nama Akun" required>
        </td>
        <td class="akrual-debit-cell">
            <input type="number" class="form-control debit ${type === 'kredit' ? 'inactive-input' : ''}" 
                value="0" min="0" ${type === 'kredit' ? 'disabled' : ''} required>
        </td>
        <td class="akrual-kredit-cell">
            <input type="number" class="form-control kredit ${type === 'debit' ? 'inactive-input' : ''}" 
                value="0" min="0" ${type === 'debit' ? 'disabled' : ''} required>
        </td>
        <td class="section-divider-vertical"></td>`;
    
    html += `
        <td class="kas-kode-cell">
            <input type="text" class="form-control kode-akun" placeholder="Kode" required>
        </td>
        <td class="kas-nama-cell">
            <input type="text" class="form-control nama-akun" placeholder="Nama Akun" required>
        </td>
        <td class="kas-debit-cell">
            <input type="number" class="form-control debit ${type === 'kredit' ? 'inactive-input' : ''}" 
                value="0" min="0" ${type === 'kredit' ? 'disabled' : ''} required>
        </td>
        <td class="kas-kredit-cell">
            <input type="number" class="form-control kredit ${type === 'debit' ? 'inactive-input' : ''}" 
                value="0" min="0" ${type === 'debit' ? 'disabled' : ''} required>
        </td>`;
    
    row.innerHTML = html;
    return row;
  }
  
  function createInfoRow(transactionId) {
    const row = document.createElement('tr');
    row.className = 'transaction-pair';
    row.dataset.transaction = transactionId;
    row.dataset.type = 'info';
    row.innerHTML = `
        <td colspan="7" class="keterangan-akrual-cell">
            <input type="text" class="keterangan-input" placeholder="Keterangan transaksi (opsional)" />
        </td>
        <td class="section-divider-vertical"></td>
        <td colspan="4" class="keterangan-kas-cell">
            <input type="text" class="keterangan-input" placeholder="Keterangan kas (opsional)" />
        </td>
    `;
    return row;
  }
  
  function createSpacerRow() {
    const row = document.createElement('tr');
    row.className = 'spacer-row';
    row.innerHTML = '<td colspan="7" style="height: 20px;"></td><td class="section-divider-vertical"></td><td colspan="4" style="height: 20px;"></td>';
    return row;
  }
  
  function copyTransaction(transactionId) {
    const rows = document.querySelectorAll(`tr[data-transaction="${transactionId}"]`);
    if (!rows.length) return;
    
    transactionCounter++;
    const newTransactionId = transactionCounter;
    
    const newRows = Array.from(rows).map(row => {
      const clonedRow = row.cloneNode(true);
      clonedRow.dataset.transaction = newTransactionId;
      
      clonedRow.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
      clonedRow.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
      
      return clonedRow;
    });
    
    const spacerRow = createSpacerRow();
    
    const lastRow = rows[rows.length - 1];
    const nextSpacer = lastRow.nextElementSibling;
    const parent = lastRow.parentNode;
    
    if (nextSpacer) {
      parent.insertBefore(spacerRow, nextSpacer.nextSibling);
      newRows.forEach(row => parent.insertBefore(row, spacerRow));
    } else {
      newRows.forEach(row => parent.appendChild(row));
      parent.appendChild(spacerRow);
    }
    
    const debitRow = newRows.find(row => row.dataset.type === 'debit');
    const kreditRow = newRows.find(row => row.dataset.type === 'kredit');
    if (debitRow && kreditRow) {
      attachEventHandlers(debitRow, kreditRow);
    }

    updateTotals();
    showAlert('success', 'Transaksi berhasil disalin');
  }
  
  function attachEventHandlers(debitRow, kreditRow) {
    const removeBtn = debitRow.querySelector('.remove-transaksi');
    if (removeBtn) {
      removeBtn.addEventListener('click', function() {
        const transactionId = debitRow.dataset.transaction;
        const rows = document.querySelectorAll(`tr[data-transaction="${transactionId}"]`);
        const lastRow = rows[rows.length - 1];
        if (lastRow?.nextElementSibling && lastRow.nextElementSibling.classList.contains('spacer-row')) {
          lastRow.nextElementSibling.remove();
        }
        
        rows.forEach(row => row.remove());
        updateTotals();
        showAlert('success', 'Transaksi berhasil dihapus');
      });
    }

    const copyBtn = debitRow.querySelector('.copy-transaksi');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        copyTransaction(debitRow.dataset.transaction);
      });
    }

    const allInputs = [
      ...debitRow.querySelectorAll('.debit, .kredit'), 
      ...kreditRow.querySelectorAll('.debit, .kredit')
    ];
    
    allInputs.forEach(input => {
      updateInputVisualState(input);
      input.addEventListener('input', function() {
        updateInputVisualState(this);
      });
    });
  }
  
  function updateInputVisualState(input) {
    input.classList.toggle('inactive-input', input.disabled);
  }
  
  function updatePairFields(input) {
    const isDebit = input.classList.contains('debit');
    const row = input.closest('tr');
    
    if (!row) return;
    
    const cell = input.closest('td');
    if (!cell) return;
    
    const isAkrual = cell.classList.contains('akrual-debit-cell') || 
                     cell.classList.contains('akrual-kredit-cell');
    const isKas = cell.classList.contains('kas-debit-cell') || 
                  cell.classList.contains('kas-kredit-cell');
    
    if (!isAkrual && !isKas) return;
    
    const inputValue = parseFloat(input.value) || 0;
    if (inputValue === 0) return;
    
    let pairInput;
    
    if (isAkrual) {
      pairInput = isDebit 
        ? row.querySelector('.akrual-kredit-cell .kredit')
        : row.querySelector('.akrual-debit-cell .debit');
    } else if (isKas) {
      pairInput = isDebit 
        ? row.querySelector('.kas-kredit-cell .kredit')
        : row.querySelector('.kas-debit-cell .debit');
    }
    
    if (pairInput) {
      pairInput.value = 0;
      pairInput.disabled = inputValue > 0;
      updateInputVisualState(pairInput);
    }
  }

  function calculateTotals() {
    let totalAkrualDebit = 0;
    let totalAkrualKredit = 0;
    let totalKasDebit = 0;
    let totalKasKredit = 0;
    
    const transactionRows = document.querySelectorAll('#koreksiEntries tr.transaction-pair');
    transactionRows.forEach(row => {
      if (row.dataset.type === 'info') return;
      
      const akrualDebitInput = row.querySelector('.akrual-debit-cell .debit');
      const akrualKreditInput = row.querySelector('.akrual-kredit-cell .kredit');
      const kasDebitInput = row.querySelector('.kas-debit-cell .debit');
      const kasKreditInput = row.querySelector('.kas-kredit-cell .kredit');
      
      if (akrualDebitInput && !akrualDebitInput.disabled) {
        totalAkrualDebit += parseFloat(akrualDebitInput.value) || 0;
      }
      if (akrualKreditInput && !akrualKreditInput.disabled) {
        totalAkrualKredit += parseFloat(akrualKreditInput.value) || 0;
      }
      if (kasDebitInput && !kasDebitInput.disabled) {
        totalKasDebit += parseFloat(kasDebitInput.value) || 0;
      }
      if (kasKreditInput && !kasKreditInput.disabled) {
        totalKasKredit += parseFloat(kasKreditInput.value) || 0;
      }
    });
    
    return {
      totalAkrualDebit,
      totalAkrualKredit,
      totalKasDebit,
      totalKasKredit
    };
  }

  function updateTotals() {
    const totals = calculateTotals();
    const epsilon = 0.01;
    
    document.getElementById('totalAkrualDebit').textContent = formatCurrency(totals.totalAkrualDebit);
    document.getElementById('totalAkrualKredit').textContent = formatCurrency(totals.totalAkrualKredit);
    document.getElementById('totalKasDebit').textContent = formatCurrency(totals.totalKasDebit);
    document.getElementById('totalKasKredit').textContent = formatCurrency(totals.totalKasKredit);
    
    const highlightImbalance = (debitCell, kreditCell, isImbalanced) => {
      debitCell.classList.toggle('text-danger', isImbalanced);
      kreditCell.classList.toggle('text-danger', isImbalanced);
    };
    
    highlightImbalance(
      document.getElementById('totalAkrualDebit'),
      document.getElementById('totalAkrualKredit'),
      Math.abs(totals.totalAkrualDebit - totals.totalAkrualKredit) > epsilon
    );
    
    highlightImbalance(
      document.getElementById('totalKasDebit'),
      document.getElementById('totalKasKredit'),
      Math.abs(totals.totalKasDebit - totals.totalKasKredit) > epsilon
    );
  }
  
  function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }
  
  function validateAndConfirm() {
    if (validateForm()) {
      confirmModal.show();
    }
  }

  function validateForm() {
    let isValid = true;
    
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    
    const requiredFields = document.querySelectorAll('#koreksiForm input[required]:not([disabled])');
    requiredFields.forEach(field => {
      if (field.value.trim() === '') {
        isValid = false;
        field.classList.add('is-invalid');
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'invalid-feedback';
        errorMsg.textContent = 'Field ini wajib diisi';
        field.parentNode.appendChild(errorMsg);
      }
    });
    
    const totals = calculateTotals();
    const epsilon = 0.01;
    
    if (Math.abs(totals.totalAkrualDebit - totals.totalAkrualKredit) > epsilon) {
      isValid = false;
      
      document.querySelectorAll('.akrual-debit-cell .debit:not([disabled]), .akrual-kredit-cell .kredit:not([disabled])').forEach(input => {
        input.classList.add('is-invalid');
      });
      
      showAlert('danger', `Buku Besar Akrual: Total Debit (${formatCurrency(totals.totalAkrualDebit)}) harus sama dengan Total Kredit (${formatCurrency(totals.totalAkrualKredit)})`);
    }
    
    if (Math.abs(totals.totalKasDebit - totals.totalKasKredit) > epsilon) {
      isValid = false;
      
      document.querySelectorAll('.kas-debit-cell .debit:not([disabled]), .kas-kredit-cell .kredit:not([disabled])').forEach(input => {
        input.classList.add('is-invalid');
      });
      
      showAlert('danger', `Buku Besar Kas: Total Debit (${formatCurrency(totals.totalKasDebit)}) harus sama dengan Total Kredit (${formatCurrency(totals.totalKasKredit)})`);
    }
    
    if (!isValid && Math.abs(totals.totalAkrualDebit - totals.totalAkrualKredit) <= epsilon && Math.abs(totals.totalKasDebit - totals.totalKasKredit) <= epsilon) {
      showAlert('danger', 'Mohon periksa kembali form Anda');
    }
    
    return isValid;
  }
  
  function collectFormData() {
    const result = {
      metadata: {
        created_at: new Date().toISOString()
      },
      transaksi: []
    };
    
    const transactions = new Map();
    
    try {
      document.querySelectorAll('.transaction-pair').forEach(row => {
        const transId = row.dataset.transaction;
        const rowType = row.dataset.type;
        
        if (!transId) return;
        
        if (!transactions.has(transId)) {
          transactions.set(transId, {
            tanggal: '',
            bukti: '',
            keterangan: {
              akrual: '',
              kas: ''
            },
            akrual: [],
            kas: []
          });
        }
        
        const transaction = transactions.get(transId);
        
        if (rowType === 'info') {
          const akrualKeterangan = row.querySelector('.keterangan-akrual-cell .keterangan-input');
          const kasKeterangan = row.querySelector('.keterangan-kas-cell .keterangan-input');
          
          if (akrualKeterangan) transaction.keterangan.akrual = akrualKeterangan.value || '';
          if (kasKeterangan) transaction.keterangan.kas = kasKeterangan.value || '';
          return;
        }
        
        if (rowType === 'debit') {
          const tanggalInput = row.querySelector('.date-cell .tanggal');
          const buktiInput = row.querySelector('.bukti-cell .bukti');
          
          if (tanggalInput) transaction.tanggal = tanggalInput.value || '';
          if (buktiInput) transaction.bukti = buktiInput.value || '';
        }
        
        const getInputValue = (selector) => {
          const input = row.querySelector(selector);
          return input ? (input.value || '') : '';
        };
        
        const getNumericValue = (selector) => {
          const input = row.querySelector(selector);
          if (!input || input.disabled) return 0;
          const value = parseFloat(input.value);
          return isNaN(value) ? 0 : value;
        };
        
        if (rowType === 'debit' || rowType === 'kredit') {
          const akrualEntry = {
            kode: getInputValue('.akrual-kode-cell .kode-akun'),
            nama: getInputValue('.akrual-nama-cell .nama-akun'),
            debit: getNumericValue('.akrual-debit-cell .debit'),
            kredit: getNumericValue('.akrual-kredit-cell .kredit')
          };
          
          if (akrualEntry.debit > 0 || akrualEntry.kredit > 0) {
            transaction.akrual.push(akrualEntry);
          }
          
          const kasEntry = {
            kode: getInputValue('.kas-kode-cell .kode-akun'),
            nama: getInputValue('.kas-nama-cell .nama-akun'),
            debit: getNumericValue('.kas-debit-cell .debit'),
            kredit: getNumericValue('.kas-kredit-cell .kredit')
          };
          
          if (kasEntry.debit > 0 || kasEntry.kredit > 0) {
            transaction.kas.push(kasEntry);
          }
        }
      });
    } catch (error) {
      console.error("Error collecting form data:", error);
      showAlert('danger', 'Terjadi kesalahan saat mengumpulkan data');
    }
    
    transactions.forEach(transaction => {
      result.transaksi.push(transaction);
    });
    
    return result;
  }

  function sendAndDownloadData() {
    try {
      const data = collectFormData();
      confirmModal.hide();
      downloadJsonFile(data);
      resetFormData();
      showAlert('success', 'Data berhasil diunduh ke perangkat Anda');
    } catch (error) {
      console.error("Error downloading data:", error);
      showAlert('danger', 'Terjadi kesalahan saat mengunduh data');
    }
  }
  
  function downloadJsonFile(data) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const filename = `koreksi_saldo_awal_${Date.now()}.json`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(link.href);
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      }, 100);
    } catch (error) {
      console.error("Error downloading JSON file:", error);
      showAlert('danger', 'Terjadi kesalahan saat membuat file JSON');
    }
  }
});