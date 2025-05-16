import { StoryListView } from '../views/StoryListView.js';
import { initMap, addMarker } from '../utils/map.js';
import { showToast } from '../utils/toast.js';
import { Auth } from '../utils/auth.js';
import router from '../utils/router.js';
import { IndexedDBManager } from '../utils/indexedDB.js';

export class FavoritesPresenter {
  constructor() {
    this.view = new StoryListView();
    this.maps = [];
    this.markers = [];
    this.favorites = [];
    this.init();
  }

  async init() {
    console.log('FavoritesPresenter: Initializing...');
    if (!Auth.isAuthenticated()) {
      console.log('FavoritesPresenter: User not authenticated, redirecting to login');
      showToast({ message: 'Silakan login untuk melihat cerita favorit.', type: 'warning' });
      router.navigateTo('#/login');
      return;
    }

    document.getElementById('app').innerHTML = this.view.render();
    
    // Set favorites filter active
    const showAllBtn = document.getElementById('show-all-btn');
    const showFavoritesBtn = document.getElementById('show-favorites-btn');
    if (showAllBtn && showFavoritesBtn) {
      showAllBtn.classList.remove('active');
      showFavoritesBtn.classList.add('active');
      
      // Setup filter buttons
      showAllBtn.addEventListener('click', () => {
        router.navigateTo('#/home');
      });
    }
    
    await this.loadFavorites();
  }

  async loadFavorites() {
    try {
      this.favorites = await IndexedDBManager.getFavorites();
      console.log('FavoritesPresenter: Favorites loaded', this.favorites);
      
      if (!this.favorites || this.favorites.length === 0) {
        showToast({ message: 'Belum ada cerita favorit.', type: 'info' });
      }
      
      this.view.renderStories(this.favorites, this.favorites);
      this.setupActions();
      await this.setupMaps(this.favorites);
      this.animateElements();
    } catch (error) {
      console.error('FavoritesPresenter: Error loading favorites:', error);
      showToast({
        message: error.message || 'Gagal memuat cerita favorit. Coba lagi nanti.',
        type: 'error',
      });
      this.view.renderStories([]);
    }
  }

  setupActions() {
    // Setup favorite buttons
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const button = event.currentTarget;
        const storyId = button.dataset.storyId;
        if (!storyId) {
          console.warn('FavoritesPresenter: No story ID found for favorite button');
          return;
        }
        
        try {
          // Remove from favorites
          await IndexedDBManager.removeFromFavorites(storyId);
          showToast({ message: 'Cerita dihapus dari favorit!', type: 'success' });
          
          // Reload favorites
          await this.loadFavorites();
        } catch (error) {
          console.error('FavoritesPresenter: Error removing from favorites:', error);
          showToast({ message: 'Gagal menghapus dari favorit.', type: 'error' });
        }
      });
    });
  }

  async setupMaps(stories) {
    console.log('FavoritesPresenter: Setting up maps for stories...');
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      const mapId = `map-${story.id}-${i}`;
      if (story.lat && story.lon) {
        const map = await initMap(mapId, {
          center: [story.lon, story.lat],
          zoom: 14,
          interactive: true,
        });
        if (!map) {
          console.warn(`Failed to initialize map for ${mapId}`);
          this.hideMapElements(mapId);
          continue;
        }
        this.maps.push(map);

        const { marker, address } = await addMarker(map, story.lat, story.lon, story.name);
        if (marker) {
          this.markers.push(marker);
          map.flyTo({ center: [story.lon, story.lat], zoom: 14, duration: 1000 });
          const addressElement = document.querySelector(`.address-text[data-map-id="${mapId}"]`);
          if (addressElement) {
            addressElement.textContent = address?.details || 'Lokasi tidak diketahui';
          }
        } else {
          console.warn(`Failed to add marker for ${mapId}`);
          this.hideMapElements(mapId);
        }
      } else {
        console.log(`No coordinates for story ${story.id}, hiding map`);
        this.hideMapElements(mapId);
      }
    }
  }

  hideMapElements(mapId) {
    const mapContainer = document.getElementById(mapId);
    const locationContainer = document.querySelector(`.location[data-map-id="${mapId}"]`);
    if (mapContainer) mapContainer.style.display = 'none';
    if (locationContainer) locationContainer.style.display = 'none';
  }

  animateElements() {
    console.log('FavoritesPresenter: Animating elements with Animation API');
    const storyItems = document.querySelectorAll('.story-item');
    if (!storyItems.length) {
      console.log('FavoritesPresenter: No story items to animate');
      return;
    }
    storyItems.forEach((item, index) => {
      item.animate(
        [
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' },
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

  cleanup() {
    console.log('FavoritesPresenter: Cleaning up...');
    this.maps.forEach(map => {
      try {
        if (map) map.remove();
      } catch (error) {
        console.error('Error removing map:', error);
      }
    });
    this.markers.forEach(marker => {
      try {
        if (marker) marker.remove();
      } catch (error) {
        console.error('Error removing marker:', error);
      }
    });
    this.maps = [];
    this.markers = [];
  }
} 