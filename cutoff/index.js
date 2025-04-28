function getGroupFullName(groupCode) {
  const groupNames = {
      'BU': 'Bendahara Umum (BU)',
      'Itjen': 'Inspektorat Jendral (Itjen)',
      'Psdm': 'PSDM',
      'Republik': 'Republik',
      'Interaksi': 'Interaksi',
      'Kemensos': 'Kemensos',
      'KMB': 'KMB',
      'Kominfo': 'Kominfo',
      'PK': 'PK'
  };
  return groupNames[groupCode] || groupCode;
}

const groupTemplate = (groupName) => `
  <div class="group-entry" data-group="${groupName}">
      <div class="group-header">
          <h5 class="group-title">${getGroupFullName(groupName)}</h5>
          <button type="button" class="remove-group">
              <i class="fa-regular fa-trash-can me-1"></i>
              Hapus
          </button>
      </div>
      <div class="transactions-container">
          <!-- Transactions will be added here -->
      </div>
      <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="balance-info akrual-balance balanced">
              Balance Akrual: Rp 0
          </div>
          <div class="balance-info kas-balance balanced">
              Balance Kas: Rp 0
          </div>
      </div>
      <button type="button" class="table-add-row add-transaction">
          <i class="fa-solid fa-plus"></i> Tambah Transaksi
      </button>
  </div>
`;

const transactionTemplate = `
  <div class="transaction-block">
    <div class="transaction-header d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center flex-grow-1">
        <input type="date" class="form-control tgl-transaksi me-2">
        <input type="text" class="form-control bukti-transaksi" placeholder="No. Bukti">
      </div>
      <div class="transaction-actions">
        <button type="button" class="btn btn-secondary btn-sm copy-transaction me-1" title="Salin">
          <i class="fa-regular fa-copy"></i>
        </button>
        <button type="button" class="btn btn-danger btn-sm remove-transaction" title="Hapus">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>
    
    <div class="row g-2">
      <!-- Kolom Akrual -->
      <div class="col-md-6">
        <div class="table-responsive mb-2">
          <table class="table table-bordered table-sm">
            <thead>
              <tr>
                <th colspan="4" class="text-center">BUKU BESAR AKRUAL</th>
              </tr>
              <tr>
                <th width="15%">Kode Akun</th>
                <th width="45%">Nama Akun</th>
                <th width="20%">Debit</th>
                <th width="20%">Kredit</th>
              </tr>
            </thead>
            <tbody>
              <tr class="debit-row">
                <td>
                  <input type="text" class="form-control kode-akun-akrual-debit" placeholder="Kode">
                </td>
                <td>
                  <input type="text" class="form-control nama-akun-akrual-debit" placeholder="Nama Akun">
                </td>
                <td>
                  <input type="number" class="form-control nilai-debit-akrual" value="0" min="0" step="1000">
                </td>
                <td>
                  <input type="number" class="form-control nilai-kredit-akrual-debit" value="0" min="0" step="1000" disabled placeholder="—">
                </td>
              </tr>
              <tr class="kredit-row">
                <td>
                  <input type="text" class="form-control kode-akun-akrual-kredit" placeholder="Kode">
                </td>
                <td>
                  <input type="text" class="form-control nama-akun-akrual-kredit" placeholder="Nama Akun">
                </td>
                <td>
                  <input type="number" class="form-control nilai-debit-akrual-kredit" value="0" min="0" step="1000" disabled placeholder="—">
                </td>
                <td>
                  <input type="number" class="form-control nilai-kredit-akrual" value="0" min="0" step="1000">
                </td>
              </tr>
              <tr>
                <td colspan="4">
                  <textarea class="form-control keterangan-akrual" rows="2" placeholder="Keterangan transaksi akrual..."></textarea>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Kolom Kas -->
      <div class="col-md-6">
        <div class="table-responsive mb-2">
          <table class="table table-bordered table-sm">
            <thead>
              <tr>
                <th colspan="4" class="text-center">BUKU BESAR KAS</th>
              </tr>
              <tr>
                <th width="15%">Kode Akun</th>
                <th width="45%">Nama Akun</th>
                <th width="20%">Debit</th>
                <th width="20%">Kredit</th>
              </tr>
            </thead>
            <tbody>
              <tr class="debit-row">
                <td>
                  <input type="text" class="form-control kode-akun-kas-debit" placeholder="Kode">
                </td>
                <td>
                  <input type="text" class="form-control nama-akun-kas-debit" placeholder="Nama Akun">
                </td>
                <td>
                  <input type="number" class="form-control nilai-debit-kas" value="0" min="0" step="1000">
                </td>
                <td>
                  <input type="number" class="form-control nilai-kredit-kas-debit" value="0" min="0" step="1000" disabled placeholder="—">
                </td>
              </tr>
              <tr class="kredit-row">
                <td>
                  <input type="text" class="form-control kode-akun-kas-kredit" placeholder="Kode">
                </td>
                <td>
                  <input type="text" class="form-control nama-akun-kas-kredit" placeholder="Nama Akun">
                </td>
                <td>
                  <input type="number" class="form-control nilai-debit-kas-kredit" value="0" min="0" step="1000" disabled placeholder="—">
                </td>
                <td>
                  <input type="number" class="form-control nilai-kredit-kas" value="0" min="0" step="1000">
                </td>
              </tr>
              <tr>
                <td colspan="4">
                  <textarea class="form-control keterangan-kas" rows="2" placeholder="Keterangan transaksi kas..."></textarea>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
`;

function addGroupToContainer(groupName) {
  const existingGroup = document.querySelector(`.group-entry[data-group="${groupName}"]`);
  if (existingGroup) {
    alert(`Grup ${getGroupFullName(groupName)} sudah ditambahkan!`);
    return;
  }
  const groupContainer = document.getElementById('groupContainer');
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = groupTemplate(groupName);
  const groupElement = tempContainer.firstElementChild;
  attachGroupEvents(groupElement);
  groupContainer.appendChild(groupElement);
  const transactionsContainer = groupElement.querySelector('.transactions-container');
  addTransaction(transactionsContainer);
}

function addTransaction(container, dataToClone = null) {
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = transactionTemplate;
  const transactionElement = tempContainer.firstElementChild;
  attachTransactionEvents(transactionElement);
  container.appendChild(transactionElement);
  
  if (dataToClone) {
    const dateInput = transactionElement.querySelector('.tgl-transaksi');
    const receiptInput = transactionElement.querySelector('.bukti-transaksi');
    
    dateInput.value = dataToClone.querySelector('.tgl-transaksi').value;
    receiptInput.value = dataToClone.querySelector('.bukti-transaksi').value;
    
    transactionElement.querySelector('.kode-akun-akrual-debit').value = dataToClone.querySelector('.kode-akun-akrual-debit').value;
    transactionElement.querySelector('.nama-akun-akrual-debit').value = dataToClone.querySelector('.nama-akun-akrual-debit').value;
    transactionElement.querySelector('.nilai-debit-akrual').value = dataToClone.querySelector('.nilai-debit-akrual').value;
    
    transactionElement.querySelector('.kode-akun-akrual-kredit').value = dataToClone.querySelector('.kode-akun-akrual-kredit').value;
    transactionElement.querySelector('.nama-akun-akrual-kredit').value = dataToClone.querySelector('.nama-akun-akrual-kredit').value;
    transactionElement.querySelector('.nilai-kredit-akrual').value = dataToClone.querySelector('.nilai-kredit-akrual').value;
    
    transactionElement.querySelector('.keterangan-akrual').value = dataToClone.querySelector('.keterangan-akrual').value;
    
    transactionElement.querySelector('.kode-akun-kas-debit').value = dataToClone.querySelector('.kode-akun-kas-debit').value;
    transactionElement.querySelector('.nama-akun-kas-debit').value = dataToClone.querySelector('.nama-akun-kas-debit').value;
    transactionElement.querySelector('.nilai-debit-kas').value = dataToClone.querySelector('.nilai-debit-kas').value;
    
    transactionElement.querySelector('.kode-akun-kas-kredit').value = dataToClone.querySelector('.kode-akun-kas-kredit').value;
    transactionElement.querySelector('.nama-akun-kas-kredit').value = dataToClone.querySelector('.nama-akun-kas-kredit').value;
    transactionElement.querySelector('.nilai-kredit-kas').value = dataToClone.querySelector('.nilai-kredit-kas').value;
    
    transactionElement.querySelector('.keterangan-kas').value = dataToClone.querySelector('.keterangan-kas').value;
  }
  
  updateTotals(transactionElement.closest('.group-entry'));
}

function attachGroupEvents(groupElement) {
  const removeButton = groupElement.querySelector('.remove-group');
  removeButton.addEventListener('click', function() {
    if (confirm('Apakah Anda yakin ingin menghapus grup ini?')) {
      groupElement.remove();
    }
  });
  const addTransactionButton = groupElement.querySelector('.add-transaction');
  addTransactionButton.addEventListener('click', function() {
    const container = groupElement.querySelector('.transactions-container');
    addTransaction(container);
  });
}

function attachTransactionEvents(transactionElement) {
  const removeButton = transactionElement.querySelector('.remove-transaction');
  removeButton.addEventListener('click', function() {
    const group = transactionElement.closest('.group-entry');
    transactionElement.remove();
    updateTotals(group);
  });
  
  const copyButton = transactionElement.querySelector('.copy-transaction');
  copyButton.addEventListener('click', function() {
    const group = transactionElement.closest('.group-entry');
    const container = group.querySelector('.transactions-container');
    addTransaction(container, transactionElement);
  });

  const debitAkrualInput = transactionElement.querySelector('.nilai-debit-akrual');
  const kreditAkrualInput = transactionElement.querySelector('.nilai-kredit-akrual');
  const debitKasInput = transactionElement.querySelector('.nilai-debit-kas');
  const kreditKasInput = transactionElement.querySelector('.nilai-kredit-kas');
  
  [debitAkrualInput, kreditAkrualInput, debitKasInput, kreditKasInput].forEach(input => {
    input.addEventListener('input', function() {
      const group = transactionElement.closest('.group-entry');
      updateTotals(group);
    });
  });
}

function updateTotals(group) {
  const transactions = group.querySelectorAll('.transaction-block');
  
  let totalDebitAkrual = 0;
  let totalKreditAkrual = 0;
  let totalDebitKas = 0;
  let totalKreditKas = 0;
  
  transactions.forEach(transaction => {
    const debitAkrualValue = parseFloat(transaction.querySelector('.nilai-debit-akrual').value) || 0;
    const kreditAkrualValue = parseFloat(transaction.querySelector('.nilai-kredit-akrual').value) || 0;
    const debitKasValue = parseFloat(transaction.querySelector('.nilai-debit-kas').value) || 0;
    const kreditKasValue = parseFloat(transaction.querySelector('.nilai-kredit-kas').value) || 0;
    
    totalDebitAkrual += debitAkrualValue;
    totalKreditAkrual += kreditAkrualValue;
    totalDebitKas += debitKasValue;
    totalKreditKas += kreditKasValue;
  });

  const akrualBalance = group.querySelector('.akrual-balance');
  const akrualDifference = Math.abs(totalDebitAkrual - totalKreditAkrual);
  
  if (akrualDifference === 0) {
    akrualBalance.textContent = 'Balance Akrual: ' + formatCurrency(0);
    akrualBalance.classList.remove('unbalanced');
    akrualBalance.classList.add('balanced');
  } else {
    akrualBalance.textContent = 'Selisih Akrual: ' + formatCurrency(akrualDifference);
    akrualBalance.classList.remove('balanced');
    akrualBalance.classList.add('unbalanced');
  }
  
  const kasBalance = group.querySelector('.kas-balance');
  const kasDifference = Math.abs(totalDebitKas - totalKreditKas);
  
  if (kasDifference === 0) {
    kasBalance.textContent = 'Balance Kas: ' + formatCurrency(0);
    kasBalance.classList.remove('unbalanced');
    kasBalance.classList.add('balanced');
  } else {
    kasBalance.textContent = 'Selisih Kas: ' + formatCurrency(kasDifference);
    kasBalance.classList.remove('balanced');
    kasBalance.classList.add('unbalanced');
  }
}

function collectFormData() {    
  const groups = document.querySelectorAll('.group-entry');
  if (groups.length === 0) {
    alert('Minimal harus ada satu grup transaksi!');
    return null;
  }
  const cutoffData = {
    timestamp: new Date().getTime(),
    groups: []
  };
  
  groups.forEach(group => {
    const groupName = group.getAttribute('data-group');
    const transactionBlocks = group.querySelectorAll('.transaction-block');
    
    const transactions = [];

    transactionBlocks.forEach(block => {
      const tanggal = block.querySelector('.tgl-transaksi').value;
      const bukti = block.querySelector('.bukti-transaksi').value;
      
      const akunAkrualDebit = {
        kode: block.querySelector('.kode-akun-akrual-debit').value,
        nama: block.querySelector('.nama-akun-akrual-debit').value,
        nilai: parseFloat(block.querySelector('.nilai-debit-akrual').value) || 0
      };
      
      const akunAkrualKredit = {
        kode: block.querySelector('.kode-akun-akrual-kredit').value,
        nama: block.querySelector('.nama-akun-akrual-kredit').value,
        nilai: parseFloat(block.querySelector('.nilai-kredit-akrual').value) || 0
      };
      
      const akunKasDebit = {
        kode: block.querySelector('.kode-akun-kas-debit').value,
        nama: block.querySelector('.nama-akun-kas-debit').value,
        nilai: parseFloat(block.querySelector('.nilai-debit-kas').value) || 0
      };
      
      const akunKasKredit = {
        kode: block.querySelector('.kode-akun-kas-kredit').value,
        nama: block.querySelector('.nama-akun-kas-kredit').value,
        nilai: parseFloat(block.querySelector('.nilai-kredit-kas').value) || 0
      };
      
      const keteranganAkrual = block.querySelector('.keterangan-akrual').value;
      const keteranganKas = block.querySelector('.keterangan-kas').value;
      
      if (tanggal || bukti || akunAkrualDebit.kode || akunAkrualDebit.nama || akunAkrualDebit.nilai > 0 || 
          akunAkrualKredit.kode || akunAkrualKredit.nama || akunAkrualKredit.nilai > 0 ||
          akunKasDebit.kode || akunKasDebit.nama || akunKasDebit.nilai > 0 ||
          akunKasKredit.kode || akunKasKredit.nama || akunKasKredit.nilai > 0) {
        
        transactions.push({
          tanggal,
          bukti,
          akrual: {
            debit: akunAkrualDebit,
            kredit: akunAkrualKredit,
            keterangan: keteranganAkrual
          },
          kas: {
            debit: akunKasDebit,
            kredit: akunKasKredit,
            keterangan: keteranganKas
          }
        });
      }
    });
    
    cutoffData.groups.push({
      name: groupName,
      transactions: transactions
    });
  });
  
  return cutoffData;
}

function validateCutoffData(data) {
  let valid = true;
  
  data.groups.forEach(group => {
    let totalDebitAkrual = 0;
    let totalKreditAkrual = 0;
    let totalDebitKas = 0;
    let totalKreditKas = 0;
    
    group.transactions.forEach(transaction => {
      totalDebitAkrual += transaction.akrual.debit.nilai || 0;
      totalKreditAkrual += transaction.akrual.kredit.nilai || 0;
      totalDebitKas += transaction.kas.debit.nilai || 0;
      totalKreditKas += transaction.kas.kredit.nilai || 0;
    });
    
    if (totalDebitAkrual !== totalKreditAkrual) {
      alert(`Grup ${getGroupFullName(group.name)}: Total debit dan kredit pada Buku Besar Akrual tidak sama!`);
      valid = false;
    }
    
    if (totalDebitKas !== totalKreditKas) {
      alert(`Grup ${getGroupFullName(group.name)}: Total debit dan kredit pada Buku Besar Kas tidak sama!`);
      valid = false;
    }
  });
  
  return valid;
}

function saveCutoffData() {
  const data = collectFormData();
  if (!data) {
      return;
  }
  if (!validateCutoffData(data)) {
      return;
  }

  if (confirm('Apakah Anda yakin ingin menyimpan data ini?')) {
      window.CutoffDB.saveCutoffDataToDB(data)
          .then((id) => {
              alert(`Data dengan id: ${id} berhasil disimpan!`);
              window.location.href = 'index.html';
          })
          .catch((error) => {
              alert('Gagal menyimpan data: ' + error);
          });
  }
}