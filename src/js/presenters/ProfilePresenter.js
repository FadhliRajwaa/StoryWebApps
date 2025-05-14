// src/js/presenters/ProfilePresenter.js
import { IndexedDBUtil } from '../utils/indexedDB.js';
import { showToast } from '../utils/toast.js';
import { Auth } from '../utils/auth.js';

export class ProfilePresenter {
  constructor() {
    this.init();
  }

  async init() {
    console.log('ProfilePresenter: Initializing...');
    if (!Auth.isAuthenticated()) {
      showToast({ message: 'Silakan login untuk melihat profil.', type: 'warning' });
      window.location.hash = '#/login';
      return;
    }

    document.getElementById('app').innerHTML = this.render();
    await this.loadCachedStories();
    this.setupEventListeners();
    this.animateElements();
  }

  render() {
    const userName = Auth.getUserName() || 'Pengguna';
    return `
      <section aria-labelledby="profile-heading">
        <h2 id="profile-heading">Profil</h2>
        <p>Selamat datang, ${userName}!</p>
        <h3>Data Cerita Tersimpan (Offline Cache)</h3>
        <button id="clear-cache-btn" class="clear-marker-btn">Hapus Semua Cache</button>
        <ul id="cached-stories" aria-live="polite"></ul>
      </section>
    `;
  }

  async loadCachedStories() {
    try {
      const stories = await IndexedDBUtil.getStories();
      const storyList = document.getElementById('cached-stories');
      if (stories.length === 0) {
        storyList.innerHTML = '<li>Tidak ada cerita di cache offline.</li>';
        return;
      }

      storyList.innerHTML = stories.map(story => `
        <li>
          <strong>${story.name}</strong> - ${new Date(story.createdAt).toLocaleDateString('id-ID')}
          <button class="delete-story-btn" data-id="${story.id}" aria-label="Hapus cerita ${story.name} dari cache">Hapus</button>
        </li>
      `).join('');
    } catch (error) {
      showToast({ message: 'Gagal memuat cerita dari cache.', type: 'error' });
    }
  }

  setupEventListeners() {
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    clearCacheBtn.addEventListener('click', async () => {
      try {
        await IndexedDBUtil.clearStories();
        showToast({ message: 'Semua cache cerita telah dihapus.', type: 'success' });
        await this.loadCachedStories();
      } catch (error) {
        showToast({ message: 'Gagal menghapus cache cerita.', type: 'error' });
      }
    });

    const storyList = document.getElementById('cached-stories');
    storyList.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-story-btn')) {
        const storyId = e.target.dataset.id;
        try {
          await IndexedDBUtil.deleteStory(storyId);
          showToast({ message: 'Cerita telah dihapus dari cache.', type: 'success' });
          await this.loadCachedStories();
        } catch (error) {
          showToast({ message: 'Gagal menghapus cerita dari cache.', type: 'error' });
        }
      }
    });
  }

  animateElements() {
    const section = document.querySelector('section');
    if (section) {
      section.animate(
        [
          { opacity: 0, transform: 'translateY(20px)', filter: 'blur(5px)' },
          { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
        ],
        {
          duration: 600,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        }
      );
    }
  }
}