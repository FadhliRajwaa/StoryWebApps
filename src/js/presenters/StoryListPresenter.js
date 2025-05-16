import { StoryModel } from '../models/StoryModel.js';
import { StoryListView } from '../views/StoryListView.js';
import { initMap, addMarker } from '../utils/map.js';
import { showToast } from '../utils/toast.js';
import { Auth } from '../utils/auth.js';
import router from '../utils/router.js';
import { subscribeToNotifications } from '../utils/notifications.js';
import { IndexedDBManager } from '../utils/indexedDB.js';

export class StoryListPresenter {
  constructor() {
    this.model = new StoryModel();
    this.view = new StoryListView();
    this.maps = [];
    this.markers = [];
    this.stories = [];
    this.favorites = [];
    this.currentFilter = 'all'; // 'all' or 'favorites'
    this.isOnline = navigator.onLine;
    this.isLoading = false;
    this.init();
  }

  async init() {
    console.log('StoryListPresenter: Initializing...');
    if (!Auth.isAuthenticated()) {
      console.log('StoryListPresenter: User not authenticated, redirecting to login');
      showToast({ message: 'Silakan login untuk melihat daftar cerita.', type: 'warning' });
      router.navigateTo('#/login');
      return;
    }

    document.getElementById('app').innerHTML = this.view.render();
    
    // Show loading state
    this.showLoading(true);
    
    // Setup online/offline detection
    this.setupConnectivityListeners();
    
    // Setup buttons
    this.setupSubscribeButton();
    this.setupFilterButtons();
    
    try {
      // Load data and render
      await this.loadData();
      this.renderCurrentView();
    } catch (error) {
      console.error('StoryListPresenter: Error during initialization:', error);
      showToast({ 
        message: 'Terjadi kesalahan saat memuat data. Mencoba menggunakan data cache.', 
        type: 'error',
        duration: 5000
      });
      
      // Attempt to use cache even on error
      this.stories = await IndexedDBManager.getStories() || [];
      this.favorites = await IndexedDBManager.getFavorites() || [];
      this.renderCurrentView();
    } finally {
      // Hide loading state
      this.showLoading(false);
    }
  }
  
  showLoading(isLoading) {
    this.isLoading = isLoading;
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
      loadingElement.style.display = isLoading ? 'flex' : 'none';
    }
  }
  
  setupConnectivityListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      showToast({ message: 'Anda kembali online! Memuat data terbaru...', type: 'success' });
      this.loadData().then(() => this.renderCurrentView());
      this.updateOfflineIndicator(false);
      this.setupSubscribeButton(); // Update subscribe button state
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      showToast({ 
        message: 'Anda sedang offline. Menampilkan data dari cache...', 
        type: 'warning',
        duration: 5000
      });
      this.updateOfflineIndicator(true);
      this.setupSubscribeButton(); // Update subscribe button state
    });
    
    // Show initial connectivity status
    this.updateOfflineIndicator(!this.isOnline);
    if (!this.isOnline) {
      showToast({ 
        message: 'Anda sedang offline. Menampilkan data dari cache...', 
        type: 'warning',
        duration: 5000
      });
    }
  }

  updateOfflineIndicator(isOffline) {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.display = isOffline ? 'flex' : 'none';
    }
  }

  setupSubscribeButton() {
    const subscribeButton = document.getElementById('subscribe-button');
    if (subscribeButton) {
      // Jika offline, non-aktifkan tombol subscribe tapi tetap tampilkan
      if (!this.isOnline) {
        subscribeButton.disabled = true;
        subscribeButton.style.opacity = '0.7';
        subscribeButton.setAttribute('aria-disabled', 'true');
        subscribeButton.title = 'Anda perlu online untuk berlangganan notifikasi';
        subscribeButton.classList.add('disabled');
        subscribeButton.innerHTML = '<i class="fas fa-bell-slash"></i> Langganan Notifikasi (Offline)';
      } else {
        subscribeButton.disabled = false;
        subscribeButton.style.opacity = '1';
        subscribeButton.removeAttribute('aria-disabled');
        subscribeButton.title = 'Langganan notifikasi untuk cerita baru';
        subscribeButton.classList.remove('disabled');
        subscribeButton.innerHTML = '<i class="fas fa-bell"></i> Langganan Notifikasi';
      }
      
      // Remove existing event listeners to prevent duplicates
      const newButton = subscribeButton.cloneNode(true);
      subscribeButton.parentNode.replaceChild(newButton, subscribeButton);
      
      // Add new event listener to the cloned button
      newButton.addEventListener('click', async () => {
        if (!this.isOnline) {
          showToast({ message: 'Anda offline. Silakan coba lagi ketika online.', type: 'warning' });
          return;
        }
        
        try {
          await subscribeToNotifications('Notifikasi Berhasil Diaktifkan', {
            body: 'Anda akan menerima notifikasi saat ada cerita baru.',
            tag: `notification-subscribe-${Date.now()}`
          });
          showToast({ message: 'Berhasil berlangganan notifikasi!', type: 'success' });
          
          // Menambahkan efek visual setelah berhasil subscribe
          newButton.innerHTML = '<i class="fas fa-bell"></i> Berlangganan ✓';
          newButton.classList.add('subscribed');
          
          setTimeout(() => {
            newButton.innerHTML = '<i class="fas fa-bell"></i> Langganan Notifikasi';
            newButton.classList.remove('subscribed');
          }, 3000);
          
        } catch (error) {
          console.error('Error subscribing to notifications:', error);
          showToast({ message: 'Gagal berlangganan notifikasi. Coba lagi nanti.', type: 'error' });
        }
      });
    }
  }

  setupFilterButtons() {
    const showAllBtn = document.getElementById('show-all-btn');
    const showFavoritesBtn = document.getElementById('show-favorites-btn');

    if (showAllBtn && showFavoritesBtn) {
      showAllBtn.addEventListener('click', () => {
        showAllBtn.classList.add('active');
        showFavoritesBtn.classList.remove('active');
        this.currentFilter = 'all';
        this.renderCurrentView();
      });

      showFavoritesBtn.addEventListener('click', () => {
        showFavoritesBtn.classList.add('active');
        showAllBtn.classList.remove('active');
        this.currentFilter = 'favorites';
        this.renderCurrentView();
      });
    }
  }

  async loadData() {
    try {
      // Always load favorites from IndexedDB
      this.favorites = await IndexedDBManager.getFavorites() || [];
      
      // If online, try to fetch from API first
      if (this.isOnline) {
        try {
          this.stories = await this.model.fetchStories();
          // Cache the fetched stories
          await IndexedDBManager.saveStories(this.stories);
        } catch (error) {
          console.warn('Failed to fetch from API, falling back to cache:', error);
          this.stories = await IndexedDBManager.getStories() || [];
          if (this.stories.length === 0) {
            throw new Error('Tidak ada data cerita yang tersedia');
          }
        }
      } else {
        // When offline, use cached data
        this.stories = await IndexedDBManager.getStories() || [];
        if (this.stories.length === 0) {
          throw new Error('Tidak ada data cerita cached yang tersedia');
        }
      }
      
      console.log('StoryListPresenter: Data loaded', {
        isOnline: this.isOnline,
        stories: this.stories.length,
        favorites: this.favorites.length
      });
    } catch (error) {
      console.error('StoryListPresenter: Error loading data:', error);
      showToast({
        message: error.message || 'Gagal memuat data. Coba lagi nanti.',
        type: 'error',
      });
      this.stories = [];
      this.favorites = [];
      throw error; // Re-throw to handle in init()
    }
  }

  renderCurrentView() {
    // Clear any existing maps
    this.cleanup();
    
    if (this.currentFilter === 'all') {
      this.view.renderStories(this.stories, this.favorites);
      this.setupStoryActions(this.stories);
    } else {
      this.view.renderStories(this.favorites, this.favorites);
      this.setupStoryActions(this.favorites);
    }
  }

  setupStoryActions(stories) {
    this.setupDeleteButtons();
    this.setupFavoriteButtons();
    this.setupMaps(stories);
    this.animateElements();
  }

  setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-cache-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const storyId = event.target.closest('[data-story-id]')?.dataset.storyId;
        if (!storyId) {
          console.warn('StoryListPresenter: No story ID found for delete button');
          return;
        }
        if (confirm('Apakah Anda yakin ingin menghapus cerita ini dari cache?')) {
          try {
            await this.model.deleteStoryById(storyId);
            
            // Also remove from favorites if it exists there
            const isFavorite = this.favorites.some(fav => fav.id === storyId);
            if (isFavorite) {
              await IndexedDBManager.removeFromFavorites(storyId);
            }
            
            showToast({ message: 'Cerita berhasil dihapus dari cache!', type: 'success' });
            
            // Reload data and rerender
            await this.loadData();
            this.renderCurrentView();
          } catch (error) {
            console.error('StoryListPresenter: Error deleting story from cache:', error);
            showToast({ message: 'Gagal menghapus cerita dari cache.', type: 'error' });
          }
        }
      });
    });
  }

  setupFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const button = event.currentTarget;
        const storyId = button.dataset.storyId;
        if (!storyId) {
          console.warn('StoryListPresenter: No story ID found for favorite button');
          return;
        }
        
        // Check if already favorited
        const isFavorite = this.favorites.some(fav => fav.id === storyId);
        
        try {
          if (isFavorite) {
            // Remove from favorites
            await IndexedDBManager.removeFromFavorites(storyId);
            showToast({ message: 'Cerita dihapus dari favorit!', type: 'success' });
          } else {
            // Add to favorites - find the story first
            const story = this.stories.find(s => s.id === storyId);
            if (story) {
              await IndexedDBManager.addToFavorites(story);
              showToast({ message: 'Cerita ditambahkan ke favorit!', type: 'success' });
            } else {
              throw new Error('Cerita tidak ditemukan');
            }
          }
          
          // Reload favorites and rerender
          const updatedFavorites = await IndexedDBManager.getFavorites();
          this.favorites = updatedFavorites || [];
          this.renderCurrentView();
          
        } catch (error) {
          console.error('StoryListPresenter: Error toggling favorite status:', error);
          showToast({ message: 'Gagal mengubah status favorit.', type: 'error' });
        }
      });
    });
  }

  async setupMaps(stories) {
    console.log('StoryListPresenter: Setting up maps for stories...');
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
    console.log('StoryListPresenter: Animating elements with Animation API');
    const storyItems = document.querySelectorAll('.story-item');
    if (!storyItems.length) {
      console.log('StoryListPresenter: No story items to animate');
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
    console.log('StoryListPresenter: Cleaning up...');
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