// src/utils/toast.js
let isToastShowing = false;
let lastToastTime = 0;
const DEBOUNCE_TIME = 1000; // 1 detik debounce

export function showToast({ message, type = 'success', duration = 5000 }) {
  const now = Date.now();
  console.log('showToast called with message:', message, 'at time:', now);

  if (now - lastToastTime < DEBOUNCE_TIME) {
    console.log('Toast debounced, too soon after last toast:', message);
    return;
  }

  if (isToastShowing) {
    console.log('Toast already showing, skipping:', message);
    return;
  }

  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  isToastShowing = true;
  lastToastTime = now;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} icon"></i>
    <span>${message}</span>
    <button class="close-btn" aria-label="Tutup notifikasi">
      <i class="fas fa-times"></i>
    </button>
  `;

  toastContainer.appendChild(toast);

  const closeBtn = toast.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'slide-out-toast 0.5s ease forwards';
  });

  toast.addEventListener('animationend', (e) => {
    if (e.animationName === 'slide-out-toast') {
      toast.remove();
      isToastShowing = false;
    }
  });

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'slide-out-toast 0.5s ease forwards';
    }
  }, duration);
}