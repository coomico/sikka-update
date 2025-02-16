// Constants
const DB_NAME = 'BarangEkstraDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  LAPORAN: 'laporan_ekstra',
  BARANG: 'barang_ekstra'
};

// Open database connection
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create laporan_ekstra store
      if (!db.objectStoreNames.contains(STORES.LAPORAN)) {
        const laporanStore = db.createObjectStore(STORES.LAPORAN, { keyPath: 'created_at' });
        laporanStore.createIndex('updated_at', 'updated_at');
        laporanStore.createIndex('periode', ['periode_awal', 'periode_akhir']);
      }

      // Create barang_ekstra store
      if (!db.objectStoreNames.contains(STORES.BARANG)) {
        const barangStore = db.createObjectStore(STORES.BARANG, { 
          keyPath: ['kode', 'laporan_created_at'] // Composite key
        });
        barangStore.createIndex('uraian', 'uraian', { unique: false });
        barangStore.createIndex('laporan_created_at', 'laporan_created_at');
        barangStore.createIndex('kode_original', 'kode_original');
      }
    };
  });
}

// Laporan operations
async function saveLaporan(data) {
  const db = await openDB();
  const tx = db.transaction(STORES.LAPORAN, 'readwrite');
  const store = tx.objectStore(STORES.LAPORAN);
  
  const laporanData = {
    created_at: Date.now(),
    updated_at: Date.now(),
    periode_awal: data.periode_awal,
    periode_akhir: data.periode_akhir
  };
  
  await store.add(laporanData);
  return laporanData.created_at;
}

async function getLatestLaporan() {
  const db = await openDB();
  const tx = db.transaction(STORES.LAPORAN, 'readonly');
  const store = tx.objectStore(STORES.LAPORAN);
  const index = store.index('updated_at');
  
  return new Promise((resolve, reject) => {
    const request = index.openCursor(null, 'prev');
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      resolve(cursor ? cursor.value : null);
    };
    request.onerror = () => reject(request.error);
  });
}

// Barang operations
async function saveBarang(barangList, laporanCreatedAt) {
  const db = await openDB();
  const tx = db.transaction(STORES.BARANG, 'readwrite');
  const store = tx.objectStore(STORES.BARANG);
  
  const promises = barangList.map(barang => {
    const barangData = {
      kode: sanitizeKodeForStorage(barang.kode, laporanCreatedAt),
      kode_original: barang.kode, // Store original code
      uraian: barang.uraian,
      satuan: barang.satuan,
      kuantitasAwal: barang.kuantitasAwal,
      nilaiAwal: barang.nilaiAwal,
      kuantitasTambah: barang.kuantitasTambah,
      nilaiTambah: barang.nilaiTambah,
      kuantitasKurang: barang.kuantitasKurang,
      nilaiKurang: barang.nilaiKurang,
      laporan_created_at: laporanCreatedAt
    };
    
    return store.add(barangData);
  });
  
  try {
    await Promise.all(promises);
    await tx.done;
  } catch (error) {
    console.error('Error saving barang:', error);
    tx.abort();
    throw error;
  }
}

// Helper to ensure unique codes in storage
function sanitizeKodeForStorage(kode, timestamp) {
  return `${kode}-${timestamp}`;
}

async function getBarangByLaporan(laporanCreatedAt) {
  const db = await openDB();
  const tx = db.transaction(STORES.BARANG, 'readonly');
  const store = tx.objectStore(STORES.BARANG);
  
  try {
    // First try using the index if it exists
    if (store.indexNames.contains('laporan_created_at')) {
      const index = store.index('laporan_created_at');
      return new Promise((resolve, reject) => {
        const request = index.getAll(laporanCreatedAt);
        request.onsuccess = () => {
          // Return data with original codes
          const items = request.result.map(barang => ({
            ...barang,
            kode: barang.kode_original // Use original code for display
          }));
          resolve(items);
        };
        request.onerror = () => reject(request.error);
      });
    } else {
      // Fallback: scan all records if index doesn't exist
      return new Promise((resolve, reject) => {
        const items = [];
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const barang = cursor.value;
            if (barang.laporan_created_at === laporanCreatedAt) {
              items.push({
                ...barang,
                kode: barang.kode_original
              });
            }
            cursor.continue();
          } else {
            resolve(items);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    }
  } finally {
    db.close();
  }
}

// Combined operations
async function saveCompleteData(data) {
  if (!data.metadata || !data.barangData) {
    throw new Error('Invalid data structure');
  }

  let db;
  let laporanCreatedAt;
  
  try {
    db = await openDB();
    
    // 1. Save laporan and get timestamp
    laporanCreatedAt = await saveLaporan({
      periode_awal: data.metadata.periodeAwal,
      periode_akhir: data.metadata.periodeAkhir
    });
    
    // 2. Save barang items
    if (!Array.isArray(data.barangData)) {
      console.error('Invalid barang data:', data.barangData);
      throw new Error('Barang data must be an array');
    }
    await saveBarang(data.barangData, laporanCreatedAt);
    
    return laporanCreatedAt;
    
  } catch (error) {
    console.error('Error in saveCompleteData:', error);
    throw error;
  } finally {
    if (db) {
      db.close();
    }
  }
}

async function getCompleteData(laporanCreatedAt) {
  const laporan = laporanCreatedAt ? 
    await getLaporanById(laporanCreatedAt) : 
    await getLatestLaporan();
    
  if (!laporan) return null;
  
  const barangList = await getBarangByLaporan(laporan.created_at);
  
  const completeData = {
    metadata: {
      periodeAwal: laporan.periode_awal,
      periodeAkhir: laporan.periode_akhir,
      created_at: laporan.created_at,
      updated_at: laporan.updated_at
    },
    barangData: barangList.map(barang => ({
      ...barang,
      kode: barang.kode_original // Use original code
    }))
  };
  
  return completeData;
}

// pagination helpers
async function getLaporanCount() {
  const db = await openDB();
  const tx = db.transaction(STORES.LAPORAN, 'readonly');
  const store = tx.objectStore(STORES.LAPORAN);
  
  return new Promise((resolve, reject) => {
    const request = store.count();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    // Handle transaction errors
    tx.onerror = () => reject(tx.error);
  });
}

async function getLaporanPage(page = 1, limit = 10) {
  const db = await openDB();
  const tx = db.transaction([STORES.LAPORAN, STORES.BARANG], 'readonly');
  const laporanStore = tx.objectStore(STORES.LAPORAN);
  const barangStore = tx.objectStore(STORES.BARANG);
  const laporanIndex = laporanStore.index('updated_at');
  
  return new Promise((resolve, reject) => {
    const laporan = [];
    let counter = 0;
    let skipCount = (page - 1) * limit;
    
    const request = laporanIndex.openCursor(null, 'prev');
    
    request.onsuccess = async (event) => {
      try {
        const cursor = event.target.result;
        
        if (cursor) {
          if (skipCount > 0) {
            skipCount--;
            cursor.continue();
          } else if (counter < limit) {
            const laporanData = cursor.value;
            
            // Get related barang items
            let barangList = [];
            if (barangStore.indexNames.contains('laporan_created_at')) {
              const barangRequest = barangStore.index('laporan_created_at').getAll(laporanData.created_at);
              barangList = await new Promise((resolveBarang, rejectBarang) => {
                barangRequest.onsuccess = () => resolveBarang(barangRequest.result);
                barangRequest.onerror = () => rejectBarang(barangRequest.error);
              });
            } else {
              // Fallback: scan all barang if index doesn't exist
              barangList = await new Promise((resolveBarang, rejectBarang) => {
                const foundBarang = [];
                const barangRequest = barangStore.openCursor();
                
                barangRequest.onsuccess = (barangEvent) => {
                  const barangCursor = barangEvent.target.result;
                  if (barangCursor) {
                    const barang = barangCursor.value;
                    if (barang.laporan_created_at === laporanData.created_at) {
                      foundBarang.push(barang);
                    }
                    barangCursor.continue();
                  } else {
                    resolveBarang(foundBarang);
                  }
                };
                
                barangRequest.onerror = () => rejectBarang(barangRequest.error);
              });
            }
            
            const completeData = {
              metadata: {
                periodeAwal: laporanData.periode_awal,
                periodeAkhir: laporanData.periode_akhir,
                created_at: laporanData.created_at,
                updated_at: laporanData.updated_at
              },
              barangData: barangList.map(barang => ({
                ...barang,
                kode: barang.kode_original // Use original code for display
              }))
            };
            
            laporan.push(completeData);
            counter++;
            cursor.continue();
          } else {
            resolve(laporan);
          }
        } else {
          resolve(laporan);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    request.onerror = () => reject(request.error);
    
    // Handle transaction errors
    tx.onerror = () => reject(tx.error);
  });
}

async function getLaporanById(createdAt) {
  // Validasi input
  if (!createdAt) {
    throw new Error('ID laporan tidak boleh kosong');
  }

  // Konversi ke number dan validasi
  const laporanId = Number(createdAt);
  if (isNaN(laporanId)) {
    throw new Error('ID laporan harus berupa angka');
  }

  const db = await openDB();
  const tx = db.transaction([STORES.LAPORAN, STORES.BARANG], 'readonly');
  
  try {
    // 1. Dapatkan data laporan
    const laporanStore = tx.objectStore(STORES.LAPORAN);
    const laporanData = await new Promise((resolve, reject) => {
      const request = laporanStore.get(laporanId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!laporanData) {
      throw new Error('Laporan tidak ditemukan');
    }

    // 2. Get barang associated with this laporan
    const barangStore = tx.objectStore(STORES.BARANG);
    let barangList = [];
    
    if (barangStore.indexNames.contains('laporan_created_at')) {
      const barangRequest = barangStore.index('laporan_created_at').getAll(laporanId);
      barangList = await new Promise((resolve, reject) => {
        barangRequest.onsuccess = () => resolve(barangRequest.result);
        barangRequest.onerror = () => reject(barangRequest.error);
      });
    } else {
      // Fallback: scan all barang if index doesn't exist
      barangList = await new Promise((resolve, reject) => {
        const foundBarang = [];
        const request = barangStore.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const barang = cursor.value;
            if (barang.laporan_created_at === laporanId) {
              foundBarang.push(barang);
            }
            cursor.continue();
          } else {
            resolve(foundBarang);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    }

    const completeData = {
      metadata: {
        periodeAwal: laporanData.periode_awal,
        periodeAkhir: laporanData.periode_akhir,
        created_at: laporanData.created_at,
        updated_at: laporanData.updated_at
      },
      barangData: barangList.map(barang => ({
        ...barang,
        kode: barang.kode_original // Use original code for display
      }))
    };

    return completeData;

  } catch (error) {
    console.error('Error getting laporan by ID:', error);
    throw error;
  } finally {
    db.close();
  }
}

async function deleteLaporan(createdAt) {
  const db = await openDB();
  const tx = db.transaction([STORES.LAPORAN, STORES.BARANG], 'readwrite');
  
  try {
    // Convert createdAt to number
    const laporanId = parseInt(createdAt);

    // 1. Get barang associated with this laporan
    const barangStore = tx.objectStore(STORES.BARANG);
    let barangList = [];
    
    if (barangStore.indexNames.contains('laporan_created_at')) {
      const request = barangStore.index('laporan_created_at').getAll(laporanId);
      barangList = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      // Fallback: scan all barang if index doesn't exist
      barangList = await new Promise((resolve, reject) => {
        const foundBarang = [];
        const request = barangStore.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const barang = cursor.value;
            if (barang.laporan_created_at === laporanId) {
              foundBarang.push(barang);
            }
            cursor.continue();
          } else {
            resolve(foundBarang);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    }

    // 2. Delete each barang
    for (const barang of barangList) {
      await new Promise((resolve, reject) => {
        // Need to use the composite key
        const deleteRequest = barangStore.delete([barang.kode, barang.laporan_created_at]);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    }

    // 3. Delete the laporan
    const laporanStore = tx.objectStore(STORES.LAPORAN);
    await new Promise((resolve, reject) => {
      const deleteRequest = laporanStore.delete(laporanId);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });

    return true;

  } catch (error) {
    console.error('Error deleting laporan:', error);
    tx.abort();
    throw error;
  } finally {
    db.close();
  }
}