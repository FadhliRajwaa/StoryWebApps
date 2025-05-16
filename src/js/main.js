import router from './utils/router.js';
import { Auth } from './utils/auth.js';
import { Workbox } from 'workbox-window';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Main: DOMContentLoaded event fired');
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }

  // Setup Dark Mode
  setupDarkMode();

  // Navbar elements
  const logoutBtn = document.getElementById('logout-btn');
  const authLink = document.getElementById('auth-link');
  const registerLink = document.getElementById('register-link');
  const addStoryItem = document.getElementById('add-story-item');
  const bottomAuthLink = document.getElementById('bottom-auth-link');
  const bottomAuthLabel = document.getElementById('bottom-auth-label');
  const bottomRegisterItem = document.getElementById('bottom-register-item');
  const bottomAddStoryItem = document.getElementById('bottom-add-story-item');
  const bottomLogoutItem = document.getElementById('bottom-logout-item');
  const bottomLogoutBtn = document.getElementById('bottom-logout-btn');

  // Update navbar based on auth state
  const updateNav = () => {
    console.log('Main: Updating navigation...');
    const userName = Auth.getUserName();
    if (Auth.isAuthenticated()) {
      authLink.textContent = userName || 'Profil';
      authLink.href = '#/profile';
      registerLink.style.display = 'none';
      logoutBtn.style.display = 'block';
      addStoryItem.style.display = 'block';

      bottomAuthLink.href = '#/profile';
      bottomAuthLabel.textContent = userName || 'Profil';
      bottomRegisterItem.style.display = 'none';
      bottomAddStoryItem.style.display = 'block';
      bottomLogoutItem.style.display = 'block';
    } else {
      authLink.textContent = 'Masuk';
      authLink.href = '#/login';
      registerLink.style.display = 'block';
      logoutBtn.style.display = 'none';
      addStoryItem.style.display = 'none';

      bottomAuthLink.href = '#/login';
      bottomAuthLabel.textContent = 'Masuk';
      bottomRegisterItem.style.display = 'block';
      bottomAddStoryItem.style.display = 'none';
      bottomLogoutItem.style.display = 'none';
    }

    const currentHash = window.location.hash || '#/home';
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
      const href = item.getAttribute('href');
      if (currentHash === href) {
        item.setAttribute('aria-current', 'page');
        item.classList.add('active');
      } else {
        item.removeAttribute('aria-current');
        item.classList.remove('active');
      }
    });
  };

  logoutBtn.addEventListener('click', () => {
    console.log('Main: Logout button clicked');
    Auth.logout();
    updateNav();
    router.navigateTo('#/login');
  });

  bottomLogoutBtn.addEventListener('click', () => {
    console.log('Main: Bottom logout button clicked');
    Auth.logout();
    updateNav();
    router.navigateTo('#/login');
  });

  window.addEventListener('hashchange', () => {
    console.log('Main: Hashchange event fired, new hash:', window.location.hash);
    updateNav();
    // Tidak perlu memanggil router.handleRoute() karena sudah ditangani di router.js
  });

  console.log('Main: Initializing navigation and router...');
  updateNav();
  router.init();
});

function setupDarkMode() {
  // Check for saved theme preference or use prefer-color-scheme
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  
  // Apply the theme
  if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
    document.documentElement.classList.add('dark');
    updateDarkModeIcons(true);
  } else {
    document.documentElement.classList.remove('dark');
    updateDarkModeIcons(false);
  }
  
  // Set up toggle buttons
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const bottomDarkModeToggle = document.getElementById('bottom-dark-mode-toggle');
  
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }
  
  if (bottomDarkModeToggle) {
    bottomDarkModeToggle.addEventListener('click', toggleDarkMode);
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateDarkModeIcons(isDark);
  
  // Animate transition
  document.body.style.transition = 'background-color 0.5s ease';
  setTimeout(() => {
    document.body.style.transition = '';
  }, 500);
}

function updateDarkModeIcons(isDark) {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const bottomDarkModeToggle = document.getElementById('bottom-dark-mode-toggle');
  
  if (darkModeToggle) {
    const iconElement = darkModeToggle.querySelector('i');
    if (iconElement) {
      iconElement.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
  }
  
  if (bottomDarkModeToggle) {
    const iconElement = bottomDarkModeToggle.querySelector('i');
    if (iconElement) {
      iconElement.className = isDark ? 'fas fa-sun bottom-nav-icon' : 'fas fa-moon bottom-nav-icon';
    }
  }
}