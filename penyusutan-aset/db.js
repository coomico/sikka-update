// Constants
const DB_NAME = 'LaporanPenyusutanAsetDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  LAPORAN: 'laporan_penyusutan_aset',
  GROUP: 'group_penyusutan_aset',
  BARANG: 'barang_penyusutan_aset'
};

// Open database connection
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create laporan_penyusutan_aset store
      if (!db.objectStoreNames.contains(STORES.LAPORAN)) {
        const laporanStore = db.createObjectStore(STORES.LAPORAN, { keyPath: 'created_at' });
        laporanStore.createIndex('updated_at', 'updated_at');
        laporanStore.createIndex('periode_laporan', 'periode_laporan');
      }

      // Create group_penyusutan_aset store with composite key
      if (!db.objectStoreNames.contains(STORES.GROUP)) {
        const groupStore = db.createObjectStore(STORES.GROUP, { 
          keyPath: ['kode', 'laporan_created_at'] // Composite key of code and laporan timestamp
        });
        groupStore.createIndex('uraian', 'uraian', { unique: false });
        groupStore.createIndex('laporan_created_at', 'laporan_created_at');
        groupStore.createIndex('kode_original', 'kode_original');
      }

      // Create barang_penyusutan_aset store
      if (!db.objectStoreNames.contains(STORES.BARANG)) {
        const barangStore = db.createObjectStore(STORES.BARANG, { 
          keyPath: ['kode', 'group_id', 'laporan_created_at'] // Composite key
        });
        barangStore.createIndex('uraian', 'uraian', { unique: false });
        barangStore.createIndex('group_id', 'group_id');
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
    periode_laporan: data.periode_laporan
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

// Group operations
async function saveGroups(groups, laporanCreatedAt) {
  const db = await openDB();
  const tx = db.transaction(STORES.GROUP, 'readwrite');
  const store = tx.objectStore(STORES.GROUP);
  
  const promises = groups.map(group => {
    const groupData = {
      kode: group.kode,
      kode_original: group.kode, // Store original code
      uraian: group.uraian,
      laporan_created_at: laporanCreatedAt
    };
    return store.add(groupData);
  });
  
  await Promise.all(promises);
}

async function getGroupsByLaporan(laporanCreatedAt) {
  const db = await openDB();
  const tx = db.transaction(STORES.GROUP, 'readonly');
  const store = tx.objectStore(STORES.GROUP);
  
  try {
    // First try using the index if it exists
    if (store.indexNames.contains('laporan_created_at')) {
      const index = store.index('laporan_created_at');
      return new Promise((resolve, reject) => {
        const request = index.getAll(laporanCreatedAt);
        request.onsuccess = () => {
          // Return data with original codes
          const groups = request.result.map(group => ({
            ...group,
            kode: group.kode_original // Use original code for display
          }));
          resolve(groups);
        };
        request.onerror = () => reject(request.error);
      });
    } else {
      // Fallback: scan all records if index doesn't exist
      return new Promise((resolve, reject) => {
        const groups = [];
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const group = cursor.value;
            if (group.laporan_created_at === laporanCreatedAt) {
              groups.push({
                ...group,
                kode: group.kode_original
              });
            }
            cursor.continue();
          } else {
            resolve(groups);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    }
  } finally {
    db.close();
  }
}

// Barang operations
async function saveBarang(barangList, kodeGroup, laporanCreatedAt) {
  const db = await openDB();
  const tx = db.transaction(STORES.BARANG, 'readwrite');
  const store = tx.objectStore(STORES.BARANG);
  
  const groupId = `${kodeGroup}-${laporanCreatedAt}`; // Create unique group identifier
  
  const promises = barangList.map(barang => {
    const barangData = {
      kode: barang.kode,
      kode_original: barang.kode, // Store original code
      uraian: barang.uraian,
      satuan: barang.satuan,
      kuantitas: barang.kuantitas,
      nilai: barang.nilai,
      saldo_awal: barang.saldo_awal,
      beban_penyusutan: barang.beban_penyusutan,
      koreksi: barang.koreksi,
      group_id: groupId,
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

async function getBarangByGroup(kodeGroup, laporanCreatedAt) {
  const db = await openDB();
  const tx = db.transaction(STORES.BARANG, 'readonly');
  const store = tx.objectStore(STORES.BARANG);
  
  try {
    const groupId = `${kodeGroup}-${laporanCreatedAt}`;
    
    // First try using the index if it exists
    if (store.indexNames.contains('group_id')) {
      const index = store.index('group_id');
      return new Promise((resolve, reject) => {
        const request = index.getAll(groupId);
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
            if (barang.group_id === groupId) {
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
      periode_laporan: data.metadata.periode_laporan
    });
    
    // 2. Save groups with timestamp
    await saveGroups(data.barangData, laporanCreatedAt);
    
    // 3. Save barang for each group
    for (const group of data.barangData) {
      if (!group.kode) {
        throw new Error('Group code is required');
      }
      if (!Array.isArray(group.barang)) {
        console.error('Invalid barang data for group:', group);
        continue;
      }
      await saveBarang(group.barang, group.kode, laporanCreatedAt);
    }
    
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
  
  const groups = await getGroupsByLaporan(laporan.created_at);
  const completeData = {
    metadata: {
      periode_laporan: laporan.periode_laporan,
      created_at: laporan.created_at,
      updated_at: laporan.updated_at
    },
    barangData: []
  };
  
  for (const group of groups) {
    const barangList = await getBarangByGroup(group.kode, laporan.created_at);
    completeData.barangData.push({
      kode: group.kode_original, // Use original code
      uraian: group.uraian,
      barang: barangList.map(barang => ({
        ...barang,
        kode: barang.kode_original // Use original code
      }))
    });
  }
  
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
  const tx = db.transaction([STORES.LAPORAN, STORES.GROUP, STORES.BARANG], 'readonly');
  const laporanStore = tx.objectStore(STORES.LAPORAN);
  const groupStore = tx.objectStore(STORES.GROUP);
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
            
            // Get related groups
            let groups = [];
            if (groupStore.indexNames.contains('laporan_created_at')) {
              const groupRequest = groupStore.index('laporan_created_at').getAll(laporanData.created_at);
              groups = await new Promise((resolveGroups, rejectGroups) => {
                groupRequest.onsuccess = () => resolveGroups(groupRequest.result);
                groupRequest.onerror = () => rejectGroups(groupRequest.error);
              });
            } else {
              // Fallback: scan all groups if index doesn't exist
              groups = await new Promise((resolveGroups, rejectGroups) => {
                const foundGroups = [];
                const groupRequest = groupStore.openCursor();
                
                groupRequest.onsuccess = (groupEvent) => {
                  const groupCursor = groupEvent.target.result;
                  if (groupCursor) {
                    const group = groupCursor.value;
                    if (group.laporan_created_at === laporanData.created_at) {
                      foundGroups.push(group);
                    }
                    groupCursor.continue();
                  } else {
                    resolveGroups(foundGroups);
                  }
                };
                
                groupRequest.onerror = () => rejectGroups(groupRequest.error);
              });
            }
            
            const completeData = {
              metadata: {
                periode_laporan: laporanData.periode_laporan,
                created_at: laporanData.created_at,
                updated_at: laporanData.updated_at
              },
              barangData: []
            };
            
            // Get barang for each group
            for (const group of groups) {
              const groupId = `${group.kode}-${laporanData.created_at}`;
              
              let barangList = [];
              if (barangStore.indexNames.contains('group_id')) {
                const barangRequest = barangStore.index('group_id').getAll(groupId);
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
                      if (barang.group_id === groupId) {
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
              
              completeData.barangData.push({
                kode: group.kode_original,
                uraian: group.uraian,
                barang: barangList.map(barang => ({
                  ...barang,
                  kode: barang.kode_original // Use original code
                }))
              });
            }
            
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
  const tx = db.transaction([STORES.LAPORAN, STORES.GROUP, STORES.BARANG], 'readonly');
  
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

    // 2. Get groups associated with this laporan
    const groupStore = tx.objectStore(STORES.GROUP);
    let groups = [];
    
    if (groupStore.indexNames.contains('laporan_created_at')) {
      const groupRequest = groupStore.index('laporan_created_at').getAll(laporanId);
      groups = await new Promise((resolve, reject) => {
        groupRequest.onsuccess = () => resolve(groupRequest.result);
        groupRequest.onerror = () => reject(groupRequest.error);
      });
    } else {
      // Fallback: scan all groups if index doesn't exist
      groups = await new Promise((resolve, reject) => {
        const foundGroups = [];
        const request = groupStore.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const group = cursor.value;
            if (group.laporan_created_at === laporanId) {
              foundGroups.push(group);
            }
            cursor.continue();
          } else {
            resolve(foundGroups);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    }

    const completeData = {
      metadata: {
        periode_laporan: laporanData.periode_laporan,
        created_at: laporanData.created_at,
        updated_at: laporanData.updated_at
      },
      barangData: []
    };

    // 3. Get barang for each group
    const barangStore = tx.objectStore(STORES.BARANG);
    for (const group of groups) {
      const groupId = `${group.kode}-${laporanId}`;
      
      let barangList = [];
      if (barangStore.indexNames.contains('group_id')) {
        const barangRequest = barangStore.index('group_id').getAll(groupId);
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
              if (barang.group_id === groupId) {
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

      completeData.barangData.push({
        kode: group.kode_original,
        uraian: group.uraian,
        barang: barangList.map(barang => ({
          ...barang,
          kode: barang.kode_original // Use original code
        }))
      });
    }

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
  const tx = db.transaction([STORES.LAPORAN, STORES.GROUP, STORES.BARANG], 'readwrite');
  
  try {
    // Convert createdAt to number
    const laporanId = parseInt(createdAt);

    // 1. Get groups associated with this laporan
    const groupStore = tx.objectStore(STORES.GROUP);
    let groups = [];
    
    if (groupStore.indexNames.contains('laporan_created_at')) {
      const request = groupStore.index('laporan_created_at').getAll(laporanId);
      groups = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } else {
      // Fallback: scan all groups if index doesn't exist
      groups = await new Promise((resolve, reject) => {
        const foundGroups = [];
        const request = groupStore.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const group = cursor.value;
            if (group.laporan_created_at === laporanId) {
              foundGroups.push(group);
            }
            cursor.continue();
          } else {
            resolve(foundGroups);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    }

    // 2. Delete barang for each group
    const barangStore = tx.objectStore(STORES.BARANG);
    for (const group of groups) {
      const groupId = `${group.kode}-${laporanId}`;
      
      // Get the barang items
      let barangList = [];
      if (barangStore.indexNames.contains('group_id')) {
        const barangRequest = barangStore.index('group_id').getAll(groupId);
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
              if (barang.group_id === groupId) {
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
      
      // Delete each barang
      for (const barang of barangList) {
        await new Promise((resolve, reject) => {
          // Need to use the composite key
          const deleteRequest = barangStore.delete([barang.kode, barang.group_id, barang.laporan_created_at]);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      }
      
      // Delete the group
      await new Promise((resolve, reject) => {
        // Need to use the composite key
        const deleteRequest = groupStore.delete([group.kode, group.laporan_created_at]);
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