import { StoryModel } from '../models/StoryModel.js';
import { StoryListView } from '../views/StoryListView.js';
import { showToast } from '../utils/toast.js';
import { Auth } from '../utils/auth.js';
import router from '../utils/router.js';

export class StoryListPresenter {
  constructor() {
    this.model = new StoryModel();
    this.view = new StoryListView();
    this.init();
  }

  async init() {
    console.log('StoryListPresenter: Initializing...');

    // Periksa status autentikasi
    if (!Auth.isAuthenticated()) {
      console.log('StoryListPresenter: User not authenticated, redirecting to login');
      showToast({ message: 'Silakan login untuk melihat daftar cerita.', type: 'warning' });
      router.navigateTo('#/login');
      return;
    }

    document.getElementById('app').innerHTML = this.view.render();
    await this.loadStories();
  }

  async loadStories() {
    try {
      const stories = await this.model.fetchStories();
      console.log('StoryListPresenter: Stories fetched:', stories);
      this.view.renderStories(stories || []); // Pastikan stories adalah array
      this.animateElements(); // Panggil animateElements setelah render berhasil
    } catch (error) {
      console.error('StoryListPresenter: Error fetching stories:', error);
      showToast({
        message: error.message || 'Gagal memuat cerita. Coba lagi nanti.',
        type: 'error',
      });
      this.view.renderStories([]); // Render daftar kosong jika gagal
    }
  }

  animateElements() {
    console.log('StoryListPresenter: Animating elements with Animation API');
    const storyItems = document.querySelectorAll('.story-item');
    if (storyItems.length === 0) {
      console.log('StoryListPresenter: No story items to animate');
      return;
    }
    storyItems.forEach((item, index) => {
      item.animate(
        [
          { opacity: 0, transform: 'translateY(20px) rotate(2deg)', filter: 'blur(3px)' },
          { opacity: 1, transform: 'translateY(0) rotate(0deg)', filter: 'blur(0px)' },
        ],
        {
          duration: 500,
          delay: index * 100,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        }
      );
    });
  }
}