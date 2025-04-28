const DB_NAME = 'CutoffDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Could not open database');
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('id', 'id', { unique: true });
                console.log('Object store created');
            }
        };
    });
}

async function saveCutoffDataToDB(data) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            if (!data.timestamp) {
                data.timestamp = new Date().getTime();
            }
            
            const request = store.add(data);
            
            request.onsuccess = (event) => {
                console.log('Data saved successfully with ID:', event.target.result);
                resolve(event.target.result);
            };
            
            request.onerror = (event) => {
                console.error('Error saving data:', event.target.error);
                reject('Failed to save data');
            };
            
            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.error('Database operation failed:', error);
        throw error;
    }
}

async function getAllCutoffData() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error('Error fetching data:', event.target.error);
                reject('Failed to fetch data');
            };
            
            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.error('Database operation failed:', error);
        throw error;
    }
}

async function getCutoffDataById(id) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error('Error fetching data:', event.target.error);
                reject('Failed to fetch data');
            };
            
            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.error('Database operation failed:', error);
        throw error;
    }
}

async function updateCutoffData(data) {
    if (!data.id) {
        throw new Error('Data ID is required for update operation');
    }
    
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            data.timestamp = new Date().getTime();
            
            const request = store.put(data);
            
            request.onsuccess = () => {
                console.log('Data updated successfully');
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('Error updating data:', event.target.error);
                reject('Failed to update data');
            };
            
            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.error('Database operation failed:', error);
        throw error;
    }
}

async function deleteCutoffData(id) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('Data deleted successfully');
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('Error deleting data:', event.target.error);
                reject('Failed to delete data');
            };
            
            transaction.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        console.error('Database operation failed:', error);
        throw error;
    }
}

window.CutoffDB = {
    saveCutoffDataToDB,
    getAllCutoffData,
    getCutoffDataById,
    updateCutoffData,
    deleteCutoffData
};