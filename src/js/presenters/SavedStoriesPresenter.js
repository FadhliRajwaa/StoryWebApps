// src/js/presenters/SavedStoriesPresenter.js
import { IndexedDBUtil } from '../utils/indexedDB.js';
import { SavedStoriesView } from '../views/SavedStoriesView.js';
import { initMap, addMarker } from '../utils/map.js';
import { showToast } from '../utils/toast.js';

export class SavedStoriesPresenter {
  constructor() {
    this.view = new SavedStoriesView();
    this.maps = [];
    this.markers = [];
    this.init();
  }

  async init() {
    console.log('SavedStoriesPresenter: Initializing...');
    document.getElementById('app').innerHTML = this.view.render();
    await this.loadSavedStories();
  }

  async loadSavedStories() {
    try {
      const stories = await IndexedDBUtil.getAllStories();
      console.log('SavedStoriesPresenter: Saved stories fetched:', stories);
      this.view.renderStories(stories);
      await this.setupMaps(stories);
      this.setupDeleteButtons();
      this.animateElements();
    } catch (error) {
      console.error('SavedStoriesPresenter: Error fetching saved stories:', error);
      showToast({
        message: 'Gagal memuat cerita tersimpan.',
        type: 'error',
      });
      this.view.renderStories([]);
    }
  }

  async setupMaps(stories) {
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      const mapId = `saved-map-${story.id}-${i}`;
      if (story.lat && story.lon) {
        const map = await initMap(mapId, {
          center: [story.lon, story.lat],
          zoom: 14,
          interactive: true,
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

  setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-story-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id;
        try {
          await IndexedDBUtil.deleteStory(id);
          showToast({ message: 'Cerita berhasil dihapus dari penyimpanan lokal.', type: 'success' });
          await this.loadSavedStories();
        } catch (error) {
          console.error('Error deleting story:', error);
          showToast({ message: 'Gagal menghapus cerita.', type: 'error' });
        }
      });
    });
  }

  animateElements() {
    console.log('SavedStoriesPresenter: Animating elements with Animation API');
    const storyItems = document.querySelectorAll('.story-item');
    if (storyItems.length === 0) return;
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
    console.log('SavedStoriesPresenter: Cleaning up...');
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