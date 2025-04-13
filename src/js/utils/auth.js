// src/utils/auth.js
import axios from 'axios';

const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

export class Auth {
  static async register(name, email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, { name, email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data.message || 'Registration failed');
    }
  }

  static async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data.message || 'Invalid email or password');
    }
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
  }

  static getToken() {
    const token = localStorage.getItem('token') || null;
    if (!token) {
      console.warn('No token found in localStorage');
    }
    return token;
  }

  static getUserName() {
    return localStorage.getItem('userName') || null;
  }

  static isAuthenticated() {
    const isAuth = !!this.getToken();
    console.log('Is authenticated:', isAuth);
    return isAuth;
  }
}