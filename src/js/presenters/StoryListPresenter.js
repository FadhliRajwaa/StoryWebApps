// src/presenters/StoryListPresenter.js
import { StoryModel } from '../models/StoryModel.js';
import { StoryListView } from '../views/StoryListView.js';
import { initMap, addMarker } from '../utils/map.js';
import { showToast } from '../utils/toast.js';
import { Auth } from '../utils/auth.js';
import router from '../utils/router.js';

export class StoryListPresenter {
  constructor() {
    this.model = new StoryModel();
    this.view = new StoryListView();
    this.maps = []; // Simpan referensi peta untuk pembersihan
    this.markers = []; // Simpan referensi marker untuk pembersihan
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
    await this.loadStories();
  }

  async loadStories() {
    try {
      const stories = await this.model.fetchStories();
      console.log('StoryListPresenter: Stories fetched:', stories);
      this.view.renderStories(stories || []);
      await this.setupMaps(stories || []); // Inisialisasi peta setelah render
      this.animateElements();
    } catch (error) {
      console.error('StoryListPresenter: Error fetching stories:', error);
      showToast({
        message: error.message || 'Gagal memuat cerita. Coba lagi nanti.',
        type: 'error',
      });
      this.view.renderStories([]);
    }
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
          interactive: true, // Aktifkan interaksi seperti zoom dan pan
        });
        if (!map) {
          console.warn(`Failed to initialize map for ${mapId}`);
          continue;
        }
        this.maps.push(map);

        const { marker, address } = await addMarker(map, story.lat, story.lon, story.name);
        if (marker) {
          this.markers.push(marker);
          map.flyTo({ center: [story.lon, story.lat], zoom: 14, duration: 1000 });
          const addressElement = document.querySelector(`.address-text[data-map-id="${mapId}"]`);
          if (addressElement) {
            addressElement.textContent = address.details;
          }
        } else {
          console.warn(`Failed to add marker for ${mapId}`);
          const addressElement = document.querySelector(`.address-text[data-map-id="${mapId}"]`);
          if (addressElement) {
            addressElement.textContent = 'Lokasi tidak diketahui';
          }
        }
      } else {
        console.log(`No coordinates for story ${story.id}, hiding map`);
        const mapContainer = document.getElementById(mapId);
        const locationContainer = document.querySelector(`.location[data-map-id="${mapId}"]`);
        if (mapContainer) {
          mapContainer.style.display = 'none';
        }
        if (locationContainer) {
          locationContainer.style.display = 'none';
        }
      }
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

  cleanup() {
    console.log('StoryListPresenter: Cleaning up...');
    this.maps.forEach(map => {
      if (map) {
        try {
          map.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
      }
    });
    this.markers.forEach(marker => {
      if (marker) {
        try {
          marker.remove();
        } catch (error) {
          console.error('Error removing marker:', error);
        }
      }
    });
    this.maps = [];
    this.markers = [];
  }
}