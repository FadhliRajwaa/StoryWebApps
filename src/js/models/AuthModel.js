import axios from 'axios';

const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

export class AuthModel {
  async register({ name, email, password }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        name,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error.response?.data || error;
    }
  }

  async login({ email, password }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error.response?.data || error;
    }
  }
}