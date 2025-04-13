// src/presenters/AuthPresenter.js
import { AuthModel } from '../models/AuthModel.js';
import { AuthView } from '../views/AuthView.js';
import { showToast } from '../utils/toast.js';

export class AuthPresenter {
  constructor(mode) {
    console.log('AuthPresenter: Constructor called with mode:', mode);
    this.model = new AuthModel();
    this.view = new AuthView();
    this.mode = mode; // 'register' or 'login'
    this.isLoading = false; // Tambahkan status loading
    this.init();
  }

  init() {
    console.log('AuthPresenter: Initializing...');
    const app = document.getElementById('app');
    if (!app) {
      console.error('AuthPresenter: App container not found');
      return;
    }
    if (this.mode === 'register') {
      app.innerHTML = this.view.renderRegister();
      this.setupRegisterForm();
      console.log('AuthPresenter: Register form rendered');
    } else {
      app.innerHTML = this.view.renderLogin();
      this.setupLoginForm();
      console.log('AuthPresenter: Login form rendered');
    }
  }

  setupRegisterForm() {
    const form = document.getElementById('register-form');
    const submitButton = form.querySelector('button[type="submit"]');
    if (!form) {
      console.error('AuthPresenter: Register form not found');
      return;
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.isLoading) return; // Cegah submit berulang

      const name = form.querySelector('#name').value;
      const email = form.querySelector('#email').value;
      const password = form.querySelector('#password').value;

      if (password.length < 8) {
        showToast({ message: 'Kata sandi harus minimal 8 karakter.', type: 'error' });
        return;
      }

      // Aktifkan status loading
      this.isLoading = true;
      submitButton.disabled = true;
      submitButton.classList.add('loading');
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

      try {
        const response = await this.model.register({ name, email, password });
        showToast({ message: 'Pendaftaran berhasil! Silakan login.', type: 'success' });
        window.location.hash = '#/login';
      } catch (error) {
        showToast({
          message: error.message || 'Pendaftaran gagal. Email mungkin sudah terdaftar.',
          type: 'error',
        });
      } finally {
        // Nonaktifkan status loading
        this.isLoading = false;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = 'Daftar';
      }
    });
  }

  setupLoginForm() {
    const form = document.getElementById('login-form');
    const submitButton = form.querySelector('button[type="submit"]');
    if (!form) {
      console.error('AuthPresenter: Login form not found');
      return;
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.isLoading) return; // Cegah submit berulang

      const email = form.querySelector('#email').value;
      const password = form.querySelector('#password').value;

      // Aktifkan status loading
      this.isLoading = true;
      submitButton.disabled = true;
      submitButton.classList.add('loading');
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

      try {
        const response = await this.model.login({ email, password });
        localStorage.setItem('token', response.loginResult.token);
        localStorage.setItem('userName', response.loginResult.name);
        showToast({ message: 'Login berhasil!', type: 'success' });
        window.location.hash = '#/home';
      } catch (error) {
        showToast({
          message: error.message || 'Login gagal. Periksa email atau kata sandi.',
          type: 'error',
        });
      } finally {
        // Nonaktifkan status loading
        this.isLoading = false;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = 'Masuk';
      }
    });
  }
}