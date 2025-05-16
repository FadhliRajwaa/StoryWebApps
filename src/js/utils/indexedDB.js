const DB_NAME = 'StoryAppDB';
const STORE_NAME = 'stories';
const FAVORITE_STORE = 'favorites';
const DB_VERSION = 3;

export class IndexedDBManager {
  static openDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('Browser Anda tidak mendukung IndexedDB.'));
        return;
      }
      
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
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
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
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      for (const story of stories) {
        store.put(story);
      }

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error saving stories to IndexedDB:', error);
      throw error;
    }
  }

  static async getStories() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error fetching stories from IndexedDB:', error);
      throw error;
    }
  }

  static async deleteAllStories() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error deleting stories from IndexedDB:', error);
      throw error;
    }
  }

  static async addToFavorites(story) {
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
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error adding story to favorites:', error);
      throw error;
    }
  }

  static async removeFromFavorites(storyId) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([FAVORITE_STORE], 'readwrite');
      const store = transaction.objectStore(FAVORITE_STORE);
      store.delete(storyId);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error removing story from favorites:', error);
      throw error;
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
          resolve(favorites.sort((a, b) => new Date(b.favoritedAt) - new Date(a.favoritedAt)));
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error fetching favorites from IndexedDB:', error);
      return []; // Kembalikan array kosong daripada melempar error
    }
  }

  static async isFavorite(storyId) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([FAVORITE_STORE], 'readonly');
      const store = transaction.objectStore(FAVORITE_STORE);
      const request = store.get(storyId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error checking if story is favorited:', error);
      throw error;
    }
  }
}