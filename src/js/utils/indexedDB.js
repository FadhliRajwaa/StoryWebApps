const DB_NAME = 'StoryAppDB';
const STORE_NAME = 'stories';
const FAVORITE_STORE = 'favorites';
const OFFLINE_SYNC_STORE = 'offline_sync';
const DB_VERSION = 4;

export class IndexedDBManager {
  static openDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('Browser ini tidak mendukung IndexedDB.');
        reject(new Error('Browser Anda tidak mendukung IndexedDB.'));
        return;
      }
      
      // Coba buka database dengan versi saat ini
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        console.log(`Upgrading IndexedDB from version ${event.oldVersion} to ${event.newVersion}`);
        const db = event.target.result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log('Creating stories store');
          const storyStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          storyStore.createIndex('by_date', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(FAVORITE_STORE)) {
          console.log('Creating favorites store');
          const favoriteStore = db.createObjectStore(FAVORITE_STORE, { keyPath: 'id' });
          favoriteStore.createIndex('by_date', 'favoritedAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(OFFLINE_SYNC_STORE)) {
          console.log('Creating offline sync store');
          const syncStore = db.createObjectStore(OFFLINE_SYNC_STORE, { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('by_timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('by_synced', 'synced', { unique: false });
        }
        
        // Handle different versions logic
        if (event.oldVersion < 2) {
          // Upgrade logic for version 1 to 2
          console.log('Performing version 1 to 2 upgrades');
        }
        
        if (event.oldVersion < 3) {
          // Upgrade logic for version 2 to 3
          console.log('Performing version 2 to 3 upgrades');
          if (db.objectStoreNames.contains(FAVORITE_STORE)) {
            const favoriteStore = event.currentTarget.transaction.objectStore(FAVORITE_STORE);
            if (!favoriteStore.indexNames.contains('by_date')) {
              favoriteStore.createIndex('by_date', 'favoritedAt', { unique: false });
            }
          }
        }
        
        if (event.oldVersion < 4) {
          // Upgrade logic for version 3 to 4 (offline sync)
          console.log('Performing version 3 to 4 upgrades (offline sync)');
          if (db.objectStoreNames.contains(OFFLINE_SYNC_STORE)) {
            const syncStore = event.currentTarget.transaction.objectStore(OFFLINE_SYNC_STORE);
            if (!syncStore.indexNames.contains('by_timestamp')) {
              syncStore.createIndex('by_timestamp', 'timestamp', { unique: false });
            }
            if (!syncStore.indexNames.contains('by_synced')) {
              syncStore.createIndex('by_synced', 'synced', { unique: false });
            }
          }
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        
        // Add event listeners for database connection errors
        db.onerror = (err) => {
          console.error('Database error:', err.target.error);
        };
        
        resolve(db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(new Error('Gagal membuka database IndexedDB: ' + event.target.error.message));
      };
      
      request.onblocked = (event) => {
        console.warn('IndexedDB blocked - database connection not closed properly');
        alert('Database diblokir. Silakan tutup tab lain yang mungkin menggunakan aplikasi ini.');
      };
    });
  }

  static async saveStories(stories) {
    if (!Array.isArray(stories) || stories.length === 0) {
      console.warn('Tried to save empty or invalid stories array to IndexedDB');
      return;
    }
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      for (const story of stories) {
        if (story && story.id) {
          store.put(story);
        } else {
          console.warn('Skipping invalid story object:', story);
        }
      }

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`Successfully saved ${stories.length} stories to IndexedDB`);
          resolve();
        };
        transaction.onerror = (error) => {
          console.error('Error in saveStories transaction:', error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error saving stories to IndexedDB:', error);
      // Tidak throw error, biarkan aplikasi tetap berjalan
      return Promise.resolve();
    }
  }

  static async getStories() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('by_date');
      const request = index.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const stories = request.result || [];
          console.log(`Retrieved ${stories.length} stories from IndexedDB`);
          // Sort stories by date (newest first)
          resolve(stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        };
        request.onerror = (error) => {
          console.error('Error in getStories transaction:', error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error fetching stories from IndexedDB:', error);
      return []; // Return empty array on error for graceful degradation
    }
  }

  static async deleteAllStories() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log('Successfully cleared all stories from IndexedDB');
          resolve();
        };
        transaction.onerror = (error) => {
          console.error('Error in deleteAllStories transaction:', error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error deleting stories from IndexedDB:', error);
      return Promise.resolve(); // Resolve anyway to allow app to continue
    }
  }
  
  static async getStoryById(storyId) {
    if (!storyId) {
      console.warn('No story ID provided to getStoryById');
      return null;
    }
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(storyId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = (error) => {
          console.error('Error in getStoryById transaction:', error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`Error fetching story ${storyId} from IndexedDB:`, error);
      return null;
    }
  }

  static async deleteStoryById(storyId) {
    if (!storyId) {
      console.warn('No story ID provided to deleteStoryById');
      return;
    }
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(storyId);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`Successfully deleted story ${storyId} from IndexedDB`);
          resolve();
        };
        transaction.onerror = (error) => {
          console.error('Error in deleteStoryById transaction:', error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error(`Error deleting story ${storyId} from IndexedDB:`, error);
      return Promise.resolve(); // Resolve anyway to allow app to continue
    }
  }

  static async addToFavorites(story) {
    if (!story || !story.id) {
      console.warn('Invalid story object provided to addToFavorites');
      return;
    }
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction([FAVORITE_STORE], 'readwrite');
      const store = transaction.objectStore(FAVORITE_STORE);
      
      const storyWithTimestamp = {
        ...story,
        favoritedAt: new Date().toISOString()
      };
      
      store.put(storyWithTimestamp);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`Successfully added story ${story.id} to favorites`);
          resolve();
        };
        transaction.onerror = (error) => {
          console.error('Error in addToFavorites transaction:', error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error adding story to favorites:', error);
      return Promise.resolve(); // Resolve anyway
    }
  }

  static async removeFromFavorites(storyId) {
    if (!storyId) {
      console.warn('No story ID provided to removeFromFavorites');
      return;
    }
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction([FAVORITE_STORE], 'readwrite');
      const store = transaction.objectStore(FAVORITE_STORE);
      store.delete(storyId);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`Successfully removed story ${storyId} from favorites`);
          resolve();
        };
        transaction.onerror = (error) => {
          console.error('Error in removeFromFavorites transaction:', error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error removing story from favorites:', error);
      return Promise.resolve(); // Resolve anyway
    }
  }

  static async getFavorites() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([FAVORITE_STORE], 'readonly');
      const store = transaction.objectStore(FAVORITE_STORE);
      
      // Use index to get sorted by date (newest first)
      const index = store.index('by_date');
      const request = index.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const favorites = request.result || [];
          console.log(`Retrieved ${favorites.length} favorites from IndexedDB`);
          resolve(favorites.sort((a, b) => new Date(b.favoritedAt) - new Date(a.favoritedAt)));
        };
        request.onerror = (error) => {
          console.error('Error in getFavorites transaction:', error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error fetching favorites from IndexedDB:', error);
      return []; // Return empty array for graceful degradation
    }
  }

  static async isFavorite(storyId) {
    if (!storyId) {
      console.warn('No story ID provided to isFavorite');
      return false;
    }
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction([FAVORITE_STORE], 'readonly');
      const store = transaction.objectStore(FAVORITE_STORE);
      const request = store.get(storyId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = (error) => {
          console.error('Error in isFavorite transaction:', error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error checking if story is favorited:', error);
      return false; // Default to false on error
    }
  }

  static async markForSync(storyData) {
    if (!storyData) {
      console.warn('No story data provided to markForSync');
      return;
    }
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction([OFFLINE_SYNC_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_SYNC_STORE);
      
      // Add data to sync queue
      const syncItem = {
        timestamp: new Date().toISOString(),
        data: storyData,
        synced: false,
        attempts: 0
      };
      
      store.add(syncItem);
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log('Successfully marked data for sync');
          resolve();
        };
        transaction.onerror = (error) => {
          console.error('Error in markForSync transaction:', error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error marking data for sync:', error);
      return Promise.resolve(); // Resolve anyway
    }
  }
  
  static async processOfflineSync() {
    if (!navigator.onLine) {
      console.log('Cannot sync - device is offline');
      return;
    }
    
    try {
      const db = await this.openDB();
      if (!db.objectStoreNames.contains(OFFLINE_SYNC_STORE)) {
        console.log('No offline sync store exists yet');
        return;
      }
      
      const transaction = db.transaction([OFFLINE_SYNC_STORE], 'readonly');
      const store = transaction.objectStore(OFFLINE_SYNC_STORE);
      // Use index to get only unsynced items
      const unsyncedIndex = store.index('by_synced');
      const request = unsyncedIndex.getAll(false); // Get all with synced=false
      
      return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
          const syncItems = request.result || [];
          console.log(`Found ${syncItems.length} items to sync`);
          
          if (syncItems.length === 0) {
            resolve();
            return;
          }
          
          for (const item of syncItems) {
            try {
              // Implement actual sync logic here based on your API
              console.log(`Syncing item: ${item.id}`);
              
              // Cek koneksi sebelum mencoba sync
              if (!navigator.onLine) {
                console.log('Lost connection during sync, aborting');
                break;
              }
              
              // API call or other sync logic would go here
              await new Promise(resolve => setTimeout(resolve, 500)); // Simulated API call
              
              // Mark as synced
              const updateTx = db.transaction([OFFLINE_SYNC_STORE], 'readwrite');
              const updateStore = updateTx.objectStore(OFFLINE_SYNC_STORE);
              item.synced = true;
              item.syncedAt = new Date().toISOString();
              updateStore.put(item);
              
              await new Promise((resolve, reject) => {
                updateTx.oncomplete = resolve;
                updateTx.onerror = reject;
              });
              
              console.log(`Successfully synced item: ${item.id}`);
            } catch (syncError) {
              console.error(`Error syncing item ${item.id}:`, syncError);
              
              // Update attempts count
              try {
                const errorTx = db.transaction([OFFLINE_SYNC_STORE], 'readwrite');
                const errorStore = errorTx.objectStore(OFFLINE_SYNC_STORE);
                item.attempts = (item.attempts || 0) + 1;
                item.lastError = syncError.message;
                errorStore.put(item);
                
                await new Promise((resolve, reject) => {
                  errorTx.oncomplete = resolve;
                  errorTx.onerror = reject;
                });
              } catch (updateError) {
                console.error('Error updating sync attempts count:', updateError);
              }
            }
          }
          resolve();
        };
        request.onerror = (error) => {
          console.error('Error in processOfflineSync transaction:', error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error processing offline sync:', error);
      return Promise.resolve(); // Resolve anyway
    }
  }
  
  static async clearOldSyncedItems(olderThanDays = 7) {
    try {
      const db = await this.openDB();
      if (!db.objectStoreNames.contains(OFFLINE_SYNC_STORE)) {
        return;
      }
      
      const transaction = db.transaction([OFFLINE_SYNC_STORE], 'readonly');
      const store = transaction.objectStore(OFFLINE_SYNC_STORE);
      const request = store.index('by_synced').getAll(true); // Get all synced items
      
      request.onsuccess = async () => {
        const syncedItems = request.result || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        
        const itemsToDelete = syncedItems.filter(item => {
          if (!item.syncedAt) return false;
          return new Date(item.syncedAt) < cutoffDate;
        });
        
        if (itemsToDelete.length > 0) {
          console.log(`Cleaning up ${itemsToDelete.length} old synced items`);
          
          const deleteTx = db.transaction([OFFLINE_SYNC_STORE], 'readwrite');
          const deleteStore = deleteTx.objectStore(OFFLINE_SYNC_STORE);
          
          for (const item of itemsToDelete) {
            deleteStore.delete(item.id);
          }
          
          deleteTx.oncomplete = () => {
            console.log('Successfully cleaned up old synced items');
          };
          
          deleteTx.onerror = (error) => {
            console.error('Error cleaning up old synced items:', error);
          };
        }
      };
      
      request.onerror = (error) => {
        console.error('Error getting synced items for cleanup:', error);
      };
    } catch (error) {
      console.error('Error clearing old synced items:', error);
    }
  }
}