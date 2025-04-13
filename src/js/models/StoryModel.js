// src/models/StoryModel.js
import axios from 'axios';
import { Auth } from '../utils/auth.js';

const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

export class StoryModel {
  async fetchStories({ page = 1, size = 10, location = 0 }) {
    const token = Auth.getToken();
    if (!token) throw new Error('Unauthorized: No token found');
    try {
      const response = await axios.get(`${API_BASE_URL}/stories`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, size, location },
      });
      return response.data.listStory || [];
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw new Error(error.response?.data?.message || 'Gagal mengambil daftar cerita. Periksa koneksi atau coba lagi.');
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
      throw new Error(error.response?.data?.message || 'Gagal mengambil detail cerita. Periksa koneksi atau coba lagi.');
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
      throw new Error(error.response?.data?.message || 'Gagal menambahkan cerita. Periksa koneksi atau coba lagi.');
    }
  }

  async addGuestStory(formData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/stories/guest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding guest story:', error);
      throw new Error(error.response?.data?.message || 'Gagal menambahkan cerita sebagai tamu. Periksa koneksi atau coba lagi.');
    }
  }
}