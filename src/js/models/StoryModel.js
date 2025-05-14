import axios from 'axios';
import { Auth } from '../utils/auth.js';
import { IndexedDBManager } from '../utils/indexedDB.js';

const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

export class StoryModel {
  async fetchStories() {
    try {
      const response = await fetch(`${API_BASE_URL}/stories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil cerita');
      }
      // Simpan ke IndexedDB
      await IndexedDBManager.saveStories(data.listStory);
      return data.listStory;
    } catch (error) {
      console.error('StoryModel: Error fetching stories:', error);
      // Fallback ke IndexedDB jika offline
      try {
        const cachedStories = await IndexedDBManager.getStories();
        if (cachedStories.length > 0) {
          console.log('StoryModel: Returning cached stories from IndexedDB');
          return cachedStories;
        }
        throw new Error('Tidak ada cerita di cache dan koneksi gagal');
      } catch (dbError) {
        throw new Error(error.message || 'Gagal mengambil cerita');
      }
    }
  }

  async fetchStoryById(id) {
    const token = Auth.getToken();
    if (!token) throw new Error('Unauthorized: No token found');
    try {
      const response = await axios.get(`${API_BASE_URL}/stories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.story;
    } catch (error) {
      console.error('Error fetching story:', error);
      // Fallback ke IndexedDB
      try {
        const stories = await IndexedDBManager.getStories();
        const story = stories.find(s => s.id === id);
        if (story) {
          console.log('StoryModel: Returning cached story from IndexedDB');
          return story;
        }
        throw new Error('Cerita tidak ditemukan di cache');
      } catch (dbError) {
        throw new Error(error.response?.data?.message || 'Gagal mengambil detail cerita');
      }
    }
  }

  async addStory(formData) {
    const token = Auth.getToken();
    if (!token) throw new Error('Unauthorized: No token found');
    try {
      console.log('Token being sent:', token);
      const response = await axios.post(`${API_BASE_URL}/stories`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      // Simpan cerita baru ke IndexedDB
      const newStory = response.data.story;
      if (newStory) {
        await IndexedDBManager.saveStories([newStory]);
      }
      return response.data;
    } catch (error) {
      console.error('Error adding story:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      }
      if (error.response?.status === 401) {
        return await this.addGuestStory(formData);
      }
      throw new Error(error.response?.data?.message || 'Gagal menambahkan cerita');
    }
  }

  async addGuestStory(formData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/stories/guest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Simpan cerita tamu ke IndexedDB
      const newStory = response.data.story;
      if (newStory) {
        await IndexedDBManager.saveStories([newStory]);
      }
      return response.data;
    } catch (error) {
      console.error('Error adding guest story:', error);
      throw new Error(error.response?.data?.message || 'Gagal menambahkan cerita sebagai tamu');
    }
  }

  async deleteStoryById(storyId) {
    try {
      const db = await IndexedDBManager.openDB();
      const transaction = db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      const request = store.delete(storyId);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log(`StoryModel: Story ${storyId} deleted from IndexedDB`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error deleting story from IndexedDB:', error);
      throw error;
    }
  }

  async clearCachedStories() {
    try {
      await IndexedDBManager.deleteAllStories();
      console.log('StoryModel: All cached stories cleared');
    } catch (error) {
      console.error('Error clearing cached stories:', error);
      throw error;
    }
  }
}