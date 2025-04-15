import { StoryModel } from '../models/StoryModel.js';
import { StoryDetailView } from '../views/StoryDetailView.js';
import { initMap, addMarker } from '../utils/map.js';
import { showToast } from '../utils/toast.js';
import router from '../utils/router.js';

export class StoryDetailPresenter {
  constructor(storyId) {
    this.model = new StoryModel();
    this.view = new StoryDetailView();
    this.storyId = storyId;
    this.init();
  }

  async init() {
    console.log('StoryDetailPresenter: Initializing with storyId:', this.storyId);
    try {
      // Ambil data cerita
      const story = await this.model.fetchStoryById(this.storyId);
      console.log('StoryDetailPresenter: Story fetched:', story);

      // Render dengan alamat sementara
      let address = { coordinates: 'Tidak tersedia', details: 'Lokasi tidak tersedia' };
      if (story.lat && story.lon) {
        address = { coordinates: `${story.lat.toFixed(6)}, ${story.lon.toFixed(6)}`, details: 'Memuat alamat...' };
      }

      // Render halaman segera
      document.getElementById('app').innerHTML = this.view.render({ ...story, address });

      // Perbarui alamat secara asinkronus
      if (story.lat && story.lon) {
        try {
          const { address: fetchedAddress } = await addMarker(null, story.lat, story.lon);
          address = fetchedAddress || address;
          // Perbarui DOM dengan alamat baru
          const locationDetails = document.querySelector('.location p:last-child');
          if (locationDetails) {
            locationDetails.textContent = `Alamat Detail: ${address.details}`;
          }
        } catch (error) {
          console.error('Failed to fetch address:', error);
        }
      }

      // Setup peta
      await this.setupMap(story);
    } catch (error) {
      console.error('StoryDetailPresenter: Error fetching story:', error);
      showToast({
        message: error.message || 'Gagal memuat detail cerita. Coba lagi nanti.',
        type: 'error',
      });
      router.navigateTo('#/home');
    }
  }

  async setupMap(story) {
    if (story.lat && story.lon) {
      const map = initMap('map', {
        center: [story.lon, story.lat],
        zoom: 14,
        style: 'MapTiler Streets',
      });
      if (!map) {
        console.warn('Map initialization failed.');
        showToast({ message: 'Gagal memuat peta.', type: 'error' });
        return;
      }
      const { marker } = await addMarker(map, story.lat, story.lon);
      if (!marker) {
        console.warn('Failed to add marker.');
        showToast({ message: 'Gagal menambahkan marker pada peta.', type: 'error' });
      } else {
        console.log('Map setup complete with marker at:', story.lon, story.lat);
        map.flyTo({ center: [story.lon, story.lat], zoom: 14, duration: 1000 });
      }
    } else {
      console.log('No coordinates provided, hiding map.');
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.style.display = 'none';
      }
      const locationText = document.querySelector('.location');
      if (locationText) {
        locationText.style.display = 'none';
      }
    }
  }
}