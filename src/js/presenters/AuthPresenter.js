import { AuthModel } from '../models/AuthModel.js';
import { AuthView } from '../views/AuthView.js';
import { showToast } from '../utils/toast.js';
import { subscribeToNotifications } from '../utils/notifications.js';

export class AuthPresenter {
  constructor(mode) {
    console.log('AuthPresenter: Constructor called with mode:', mode);
    this.model = new AuthModel();
    this.view = new AuthView();
    this.mode = mode;
    this.isLoading = false;
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
      this.animateElements(); // Panggil setelah form dirender
    } else {
      app.innerHTML = this.view.renderLogin();
      this.setupLoginForm();
      console.log('AuthPresenter: Login form rendered');
      this.animateElements(); // Panggil setelah form dirender
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
      if (this.isLoading) return;

      const name = form.querySelector('#name').value;
      const email = form.querySelector('#email').value;
      const password = form.querySelector('#password').value;

      if (password.length < 8) {
        showToast({ message: 'Kata sandi harus minimal 8 karakter.', type: 'error' });
        return;
      }

      this.isLoading = true;
      submitButton.disabled = true;
      submitButton.classList.add('loading');
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

      try {
        const response = await this.model.register({ name, email, password });
        showToast({ message: 'Pendaftaran berhasil! Silakan login.', type: 'success' });

        await subscribeToNotifications('Pendaftaran Berhasil', {
          body: 'Selamat, Anda telah berhasil mendaftar! Silakan login.',
          tag: `register-${Date.now()}`,
        });

        window.location.hash = '#/login';
      } catch (error) {
        showToast({
          message: error.message || 'Pendaftaran gagal. Email mungkin sudah terdaftar.',
          type: 'error',
        });
      } finally {
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
      if (this.isLoading) return;

      const email = form.querySelector('#email').value;
      const password = form.querySelector('#password').value;

      this.isLoading = true;
      submitButton.disabled = true;
      submitButton.classList.add('loading');
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

      try {
        const response = await this.model.login({ email, password });
        localStorage.setItem('token', response.loginResult.token);
        localStorage.setItem('userName', response.loginResult.name);
        showToast({ message: 'Login berhasil!', type: 'success' });

        await subscribeToNotifications('Login Berhasil', {
          body: `Selamat datang kembali, ${response.loginResult.name}!`,
          tag: `login-${Date.now()}`,
        });

        window.location.hash = '#/home';
      } catch (error) {
        showToast({
          message: error.message || 'Login gagal. Periksa email atau kata sandi.',
          type: 'error',
        });
      } finally {
        this.isLoading = false;
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.innerHTML = 'Masuk';
      }
    });
  }

  animateElements() {
    console.log('AuthPresenter: Animating elements with Animation API');
    const form = document.getElementById(this.mode === 'register' ? 'register-form' : 'login-form');
    if (form) {
      form.animate(
        [
          { opacity: 0, transform: 'translateY(40px) scale(0.9)', filter: 'blur(5px)' },
          { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
        ],
        {
          duration: 700,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        }
      );
    }
  }
}