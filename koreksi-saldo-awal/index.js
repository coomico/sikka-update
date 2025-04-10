document.addEventListener('DOMContentLoaded', function() {
  let transactionCounter = 0;
  const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
  const resetModal = new bootstrap.Modal(document.getElementById('resetModal'));
  
  document.getElementById('addTransaksi').addEventListener('click', addNewTransaction);
  document.getElementById('saveData').addEventListener('click', validateAndConfirm);
  document.getElementById('confirmSend').addEventListener('click', sendData);
  document.getElementById('resetForm').addEventListener('click', confirmResetForm);
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
  
  document.getElementById('jsonModal').addEventListener('hidden.bs.modal', function() {
    const modalBody = document.querySelector('#jsonModal .modal-body');
    const successMessage = modalBody.querySelector('.json-sent-success');
    const infoLabels = modalBody.querySelector('.json-info-labels');
    
    if (successMessage) successMessage.remove();
    if (infoLabels) infoLabels.remove();
  });

  function confirmResetForm() {
    resetModal.show();
  }
  
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
    const tbody = document.getElementById('koreksiEntries');
    
    const debitRow = document.createElement('tr');
    debitRow.className = 'transaction-pair';
    debitRow.dataset.transaction = transactionCounter;
    debitRow.dataset.type = 'debit';
    
    const kreditRow = document.createElement('tr');
    kreditRow.className = 'transaction-pair transaction-separator';
    kreditRow.dataset.transaction = transactionCounter;
    kreditRow.dataset.type = 'kredit';
    
    debitRow.innerHTML = `
        <td rowspan="2">
            <div class="row-actions">
                <button type="button" class="btn btn-secondary btn-sm copy-transaksi" title="Salin Transaksi">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm remove-transaksi" title="Hapus">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        </td>
        <td rowspan="2">
            <input type="date" class="form-control tanggal" required>
        </td>
        <td rowspan="2">
            <input type="text" class="form-control bukti" placeholder="No. Bukti Transaksi" required>
        </td>
        <td>
            <input type="text" class="form-control kode-akun" placeholder="Kode" required>
        </td>
        <td>
            <input type="text" class="form-control nama-akun" placeholder="Nama Akun" required>
        </td>
        <td>
            <input type="number" class="form-control debit" value="0" min="0" required>
        </td>
        <td>
            <input type="number" class="form-control kredit inactive-input" value="0" min="0" disabled>
        </td>
        <td class="section-divider-vertical"></td>
        <td>
            <input type="text" class="form-control kode-akun" placeholder="Kode" required>
        </td>
        <td>
            <input type="text" class="form-control nama-akun" placeholder="Nama Akun" required>
        </td>
        <td>
            <input type="number" class="form-control debit" value="0" min="0" required>
        </td>
        <td>
            <input type="number" class="form-control kredit inactive-input" value="0" min="0" disabled>
        </td>
    `;

    kreditRow.innerHTML = `
        <td>
            <input type="text" class="form-control kode-akun" placeholder="Kode" required>
        </td>
        <td>
            <input type="text" class="form-control nama-akun" placeholder="Nama Akun" required>
        </td>
        <td>
            <input type="number" class="form-control debit inactive-input" value="0" min="0" disabled>
        </td>
        <td>
            <input type="number" class="form-control kredit" value="0" min="0" required>
        </td>
        <td class="section-divider-vertical"></td>
        <td>
            <input type="text" class="form-control kode-akun" placeholder="Kode" required>
        </td>
        <td>
            <input type="text" class="form-control nama-akun" placeholder="Nama Akun" required>
        </td>
        <td>
            <input type="number" class="form-control debit inactive-input" value="0" min="0" disabled>
        </td>
        <td>
            <input type="number" class="form-control kredit" value="0" min="0" required>
        </td>
    `;
    
    tbody.appendChild(debitRow);
    tbody.appendChild(kreditRow);
    
    const infoRow = document.createElement('tr');
    infoRow.className = 'transaction-pair';
    infoRow.dataset.transaction = transactionCounter;
    infoRow.dataset.type = 'info';
    infoRow.innerHTML = `
        <td colspan="7">
            <input type="text" class="keterangan-input" placeholder="Keterangan transaksi (opsional)" />
        </td>
        <td class="section-divider-vertical"></td>
        <td colspan="4">
            <input type="text" class="keterangan-input" placeholder="Keterangan kas (opsional)" />
        </td>
    `;
    tbody.appendChild(infoRow);
    
    const spacerRow = document.createElement('tr');
    spacerRow.innerHTML = '<td colspan="7" style="height: 20px;"></td><td class="section-divider-vertical"></td><td colspan="4" style="height: 20px;"></td>';
    tbody.appendChild(spacerRow);
    
    attachEventHandlers(debitRow, kreditRow);
    updateTotals();
  }
  
  function copyTransaction(transactionId) {
    const rows = document.querySelectorAll(`tr[data-transaction="${transactionId}"]`);
    if (!rows.length) return;
    
    transactionCounter++;
    const newTransactionId = transactionCounter;
    
    const newRows = [];
    rows.forEach(row => {
        const clonedRow = row.cloneNode(true);
        clonedRow.dataset.transaction = newTransactionId;
        
        clonedRow.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        clonedRow.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });
        
        newRows.push(clonedRow);
    });
    
    const spacerRow = document.createElement('tr');
    spacerRow.innerHTML = '<td colspan="7" style="height: 20px;"></td><td class="section-divider-vertical"></td><td colspan="4" style="height: 20px;"></td>';
    
    const lastRow = rows[rows.length - 1];
    const nextSpacer = lastRow.nextElementSibling;
    
    if (nextSpacer) {
        const parent = nextSpacer.parentNode;
        parent.insertBefore(spacerRow, nextSpacer.nextSibling);
        newRows.forEach(row => {
            parent.insertBefore(row, spacerRow);
        });
    } else {
        const parent = lastRow.parentNode;
        newRows.forEach(row => {
            parent.appendChild(row);
        });
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
              
              let spacerRow = rows[rows.length - 1].nextElementSibling;
              if (spacerRow) {
                  spacerRow.remove();
              }
              
              rows.forEach(row => row.remove());

              updateTotals();
              showAlert('success', 'Transaksi berhasil dihapus');
          });
      }
      
      const copyBtn = debitRow.querySelector('.copy-transaksi');
      if (copyBtn) {
          copyBtn.addEventListener('click', function() {
              const transactionId = debitRow.dataset.transaction;
              copyTransaction(transactionId);
          });
      }
      
      debitRow.querySelectorAll('.debit, .kredit').forEach(input => {
          input.addEventListener('input', function() {
              updatePairFields(this);
          });
      });
      
      kreditRow.querySelectorAll('.debit, .kredit').forEach(input => {
          input.addEventListener('input', function() {
              updatePairFields(this);
          });
      });
      
      const allInputs = [...debitRow.querySelectorAll('.debit, .kredit'), ...kreditRow.querySelectorAll('.debit, .kredit')];
      allInputs.forEach(input => {
          updateInputVisualState(input);
          
          input.addEventListener('input', function() {
              updateInputVisualState(this);
          });
      });
  }
  
  function updateInputVisualState(input) {
      if (input.disabled) {
          input.classList.add('inactive-input');
      } else {
          input.classList.remove('inactive-input');
      }
  }
  
  function updatePairFields(input) {
      const isDebit = input.classList.contains('debit');
      const row = input.closest('tr');
      const cellIndex = Array.from(row.cells).findIndex(cell => cell.contains(input));
      
      if (parseFloat(input.value) === 0) {
          return;
      }
      
      if (isDebit) {
          const kreditInput = row.querySelector(`.kredit:nth-of-type(${cellIndex})`);
          if (kreditInput) {
              kreditInput.value = 0;
              kreditInput.disabled = parseFloat(input.value) > 0;
              updateInputVisualState(kreditInput);
          }
      } else {
          const debitInput = row.querySelector(`.debit:nth-of-type(${cellIndex})`);
          if (debitInput) {
              debitInput.value = 0;
              debitInput.disabled = parseFloat(input.value) > 0;
              updateInputVisualState(debitInput);
          }
      }
  }

  function updateTotals() {
    let totalAkrualDebit = 0;
    let totalAkrualKredit = 0;
    let totalKasDebit = 0;
    let totalKasKredit = 0;
    
    const akrualDebitInputs = document.querySelectorAll('#koreksiEntries tr td:nth-child(6) input.debit:not([disabled]), #koreksiEntries tr td:nth-child(3) input.debit:not([disabled])');
    const akrualKreditInputs = document.querySelectorAll('#koreksiEntries tr td:nth-child(7) input.kredit:not([disabled]), #koreksiEntries tr td:nth-child(4) input.kredit:not([disabled])');
    
    const kasDebitInputs = document.querySelectorAll('#koreksiEntries tr td:nth-child(11) input.debit:not([disabled]), #koreksiEntries tr td:nth-child(8) input.debit:not([disabled])');
    const kasKreditInputs = document.querySelectorAll('#koreksiEntries tr td:nth-child(12) input.kredit:not([disabled]), #koreksiEntries tr td:nth-child(9) input.kredit:not([disabled])');
    
    akrualDebitInputs.forEach(input => {
        totalAkrualDebit += parseFloat(input.value) || 0;
    });
    
    akrualKreditInputs.forEach(input => {
        totalAkrualKredit += parseFloat(input.value) || 0;
    });
    
    kasDebitInputs.forEach(input => {
        totalKasDebit += parseFloat(input.value) || 0;
    });
    
    kasKreditInputs.forEach(input => {
        totalKasKredit += parseFloat(input.value) || 0;
    });
    
    document.getElementById('totalAkrualDebit').textContent = formatCurrency(totalAkrualDebit);
    document.getElementById('totalAkrualKredit').textContent = formatCurrency(totalAkrualKredit);
    document.getElementById('totalKasDebit').textContent = formatCurrency(totalKasDebit);
    document.getElementById('totalKasKredit').textContent = formatCurrency(totalKasKredit);
    
    const totalAkrualDebitCell = document.getElementById('totalAkrualDebit');
    const totalAkrualKreditCell = document.getElementById('totalAkrualKredit');
    
    if (totalAkrualDebit !== totalAkrualKredit) {
        totalAkrualDebitCell.classList.add('text-danger');
        totalAkrualKreditCell.classList.add('text-danger');
    } else {
        totalAkrualDebitCell.classList.remove('text-danger');
        totalAkrualKreditCell.classList.remove('text-danger');
    }
    
    const totalKasDebitCell = document.getElementById('totalKasDebit');
    const totalKasKreditCell = document.getElementById('totalKasKredit');
    
    if (totalKasDebit !== totalKasKredit) {
        totalKasDebitCell.classList.add('text-danger');
        totalKasKreditCell.classList.add('text-danger');
    } else {
        totalKasDebitCell.classList.remove('text-danger');
        totalKasKreditCell.classList.remove('text-danger');
    }
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
        alertDiv.remove();
    }, 5000);
  }
  
  function validateAndConfirm() {
      if (validateForm()) {
          confirmModal.show();
      }
  }

  function validateForm() {
    let isValid = true;
    const requiredFields = document.querySelectorAll('#koreksiForm input[required]:not([disabled])');
    
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    document.querySelectorAll('.invalid-feedback').forEach(el => {
        el.remove();
    });
    
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
    
    let totalAkrualDebit = 0;
    let totalAkrualKredit = 0;
    let totalKasDebit = 0;
    let totalKasKredit = 0;
    
    const akrualDebitInputs = document.querySelectorAll('td:nth-child(6) .debit:not([disabled]), td:nth-child(3) .debit:not([disabled])');
    const akrualKreditInputs = document.querySelectorAll('td:nth-child(7) .kredit:not([disabled]), td:nth-child(4) .kredit:not([disabled])');
    const kasDebitInputs = document.querySelectorAll('td:nth-child(10) .debit:not([disabled]), td:nth-child(7) .debit:not([disabled])');
    const kasKreditInputs = document.querySelectorAll('td:nth-child(11) .kredit:not([disabled]), td:nth-child(8) .kredit:not([disabled])');
    
    akrualDebitInputs.forEach(input => {
        totalAkrualDebit += parseFloat(input.value) || 0;
    });
    
    akrualKreditInputs.forEach(input => {
        totalAkrualKredit += parseFloat(input.value) || 0;
    });
    
    kasDebitInputs.forEach(input => {
        totalKasDebit += parseFloat(input.value) || 0;
    });
    
    kasKreditInputs.forEach(input => {
        totalKasKredit += parseFloat(input.value) || 0;
    });
    
    if (totalAkrualDebit !== totalAkrualKredit) {
        isValid = false;
        
        [...akrualDebitInputs, ...akrualKreditInputs].forEach(input => {
            input.classList.add('is-invalid');
        });
        
        showAlert('danger', `Buku Besar Akrual: Total Debit (${formatCurrency(totalAkrualDebit)}) harus sama dengan Total Kredit (${formatCurrency(totalAkrualKredit)})`);
    }
    
    if (totalKasDebit !== totalKasKredit) {
        isValid = false;
        
        [...kasDebitInputs, ...kasKreditInputs].forEach(input => {
            input.classList.add('is-invalid');
        });
        
        showAlert('danger', `Buku Besar Kas: Total Debit (${formatCurrency(totalKasDebit)}) harus sama dengan Total Kredit (${formatCurrency(totalKasKredit)})`);
    }
    
    if (!isValid && totalAkrualDebit === totalAkrualKredit && totalKasDebit === totalKasKredit) {
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
    
    document.querySelectorAll('.transaction-pair').forEach(row => {
        const transId = row.dataset.transaction;
        const rowType = row.dataset.type;
        
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
            const inputs = row.querySelectorAll('.keterangan-input');
            if (inputs && inputs.length >= 1) {
                transaction.keterangan.akrual = inputs[0].value || '';
            }
            if (inputs && inputs.length >= 2) {
                transaction.keterangan.kas = inputs[1].value || '';
            }
            return;
        }
        
        if (rowType === 'debit') {
            const tanggalInput = row.querySelector('.tanggal');
            const buktiInput = row.querySelector('.bukti');
            
            if (tanggalInput) transaction.tanggal = tanggalInput.value || '';
            if (buktiInput) transaction.bukti = buktiInput.value || '';
        }
        
        const getInputValue = (cell, selector) => {
            if (!cell) return '';
            const input = cell.querySelector(selector);
            return input ? (input.value || '') : '';
        };
        
        const getNumericValue = (cell, selector) => {
            if (!cell) return 0;
            const input = cell.querySelector(selector);
            return input ? (parseFloat(input.value) || 0) : 0;
        };
        
        const cells = Array.from(row.cells);
        
        if (rowType === 'debit') {
            if (cells.length > 6) {
                const akrualKode = getInputValue(cells[3], '.kode-akun');
                const akrualNama = getInputValue(cells[4], '.nama-akun');
                const akrualDebit = getNumericValue(cells[5], '.debit');
                const akrualKredit = getNumericValue(cells[6], '.kredit');
                
                if (akrualDebit > 0 || akrualKredit > 0) {
                    transaction.akrual.push({
                        kode: akrualKode,
                        nama: akrualNama,
                        debit: akrualDebit,
                        kredit: akrualKredit
                    });
                }
            }
            
            if (cells.length > 11) {
                const kasKode = getInputValue(cells[8], '.kode-akun');
                const kasNama = getInputValue(cells[9], '.nama-akun');
                const kasDebit = getNumericValue(cells[10], '.debit');
                const kasKredit = getNumericValue(cells[11], '.kredit');
                
                if (kasDebit > 0 || kasKredit > 0) {
                    transaction.kas.push({
                        kode: kasKode,
                        nama: kasNama,
                        debit: kasDebit,
                        kredit: kasKredit
                    });
                }
            }
        } else if (rowType === 'kredit') {
            if (cells.length > 3) {
                const akrualKode = getInputValue(cells[0], '.kode-akun');
                const akrualNama = getInputValue(cells[1], '.nama-akun');
                const akrualDebit = getNumericValue(cells[2], '.debit');
                const akrualKredit = getNumericValue(cells[3], '.kredit');
                
                if (akrualDebit > 0 || akrualKredit > 0) {
                    transaction.akrual.push({
                        kode: akrualKode,
                        nama: akrualNama,
                        debit: akrualDebit,
                        kredit: akrualKredit
                    });
                }
            }
            
            if (cells.length > 8) {
                const kasKode = getInputValue(cells[5], '.kode-akun');
                const kasNama = getInputValue(cells[6], '.nama-akun');
                const kasDebit = getNumericValue(cells[7], '.debit');
                const kasKredit = getNumericValue(cells[8], '.kredit');
                
                if (kasDebit > 0 || kasKredit > 0) {
                    transaction.kas.push({
                        kode: kasKode,
                        nama: kasNama,
                        debit: kasDebit,
                        kredit: kasKredit
                    });
                }
            }
        }
    });
    
    transactions.forEach(transaction => {
        result.transaksi.push(transaction);
    });
    
    return result;
  }

  function formatJsonWithSyntaxHighlighting(jsonString) {
    const escaped = jsonString.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    return escaped
      .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="string">"$1"</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="boolean">$1</span>')
      .replace(/: (null)/g, ': <span class="null">$1</span>');
  }

  function sendData() {
    const data = collectFormData();
    confirmModal.hide();
    
    const jsonString = JSON.stringify(data, null, 2);
    const formattedJson = formatJsonWithSyntaxHighlighting(jsonString);
    
    const jsonSize = new Blob([jsonString]).size;
    const formattedSize = jsonSize < 1024 
      ? `${jsonSize} bytes` 
      : `${(jsonSize / 1024).toFixed(2)} KB`;
    
    const transactionCount = data.transaksi.length;
    
    const timestamp = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
    
    const jsonModalContentEl = document.getElementById('jsonModalContent');
    jsonModalContentEl.innerHTML = formattedJson;
    jsonModalContentEl.className = 'json-content';
    
    const jsonToolbar = document.querySelector('.json-toolbar');
    jsonToolbar.innerHTML = `
      <div class="json-info">
        <i class="fa-solid fa-circle-info"></i>
        <span>Ukuran Data: <span class="json-size">${formattedSize}</span></span>
      </div>
      <div class="json-actions">
        <span class="copy-success">Berhasil disalin!</span>
        <button type="button" class="btn" id="copyJson">
          <i class="fa-regular fa-copy"></i> Salin JSON
        </button>
      </div>
    `;
    
    const infoLabelsDiv = document.createElement('div');
    infoLabelsDiv.className = 'json-info-labels';
    infoLabelsDiv.innerHTML = `
      <div class="json-info-label">
        <i class="fa-regular fa-calendar-check"></i>
        <span>Waktu: ${timestamp}</span>
      </div>
      <div class="json-info-label">
        <i class="fa-solid fa-layer-group"></i>
        <span>Total Transaksi: ${transactionCount}</span>
      </div>
    `;
    
    const successDiv = document.createElement('div');
    successDiv.className = 'json-sent-success';
    successDiv.innerHTML = `
      <i class="fa-solid fa-circle-check"></i>
      <span>Data berhasil disiapkan untuk pengiriman</span>
    `;
    
    const modalBody = document.querySelector('#jsonModal .modal-body');
    modalBody.insertBefore(successDiv, modalBody.firstChild);
    modalBody.insertBefore(infoLabelsDiv, jsonModalContentEl);
    
    document.getElementById('copyJson').addEventListener('click', function() {
      navigator.clipboard.writeText(jsonString).then(() => {
        const successElement = document.querySelector('.copy-success');
        successElement.classList.add('show');
        setTimeout(() => {
          successElement.classList.remove('show');
        }, 2000);
      });
    });
    
    const jsonModal = new bootstrap.Modal(document.getElementById('jsonModal'));
    jsonModal.show();
    
    resetFormData();
    showAlert('success', 'Data berhasil dikirim dan form telah direset');
  }
  
  const jsonModalEl = document.getElementById('jsonModal');
  if (jsonModalEl) {
      document.getElementById('copyJson')?.addEventListener('click', function() {
          const content = document.getElementById('jsonModalContent').textContent;
          navigator.clipboard.writeText(content).then(() => {
              const successElement = document.querySelector('.copy-success');
              successElement.classList.add('show');
              setTimeout(() => {
                  successElement.classList.remove('show');
              }, 1500);
          });
      });
  }
});