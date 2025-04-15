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
      const story = await this.model.fetchStoryById(this.storyId);
      console.log('StoryDetailPresenter: Story fetched:', story);

      let address = { coordinates: 'Tidak tersedia', details: 'Lokasi tidak tersedia' };
      if (story.lat && story.lon) {
        address = { coordinates: `${story.lat.toFixed(6)}, ${story.lon.toFixed(6)}`, details: 'Memuat alamat...' };
      }

      document.getElementById('app').innerHTML = this.view.render({ ...story, address });

      if (story.lat && story.lon) {
        try {
          const { address: fetchedAddress } = await addMarker(null, story.lat, story.lon);
          address = fetchedAddress || address;
          const locationDetails = document.querySelector('.location p:last-child');
          if (locationDetails) {
            locationDetails.textContent = `Alamat Detail: ${address.details}`;
          }
        } catch (error) {
          console.error('Failed to fetch address:', error);
        }
      }

      await this.setupMap(story);
      this.animateElements(); // Panggil setelah semua data dimuat
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
      const map = await initMap('map', {
        center: [story.lon, story.lat],
        zoom: 14,
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

  animateElements() {
    console.log('StoryDetailPresenter: Animating elements with Animation API');
    const storyDetail = document.querySelector('.story-detail');
    const mapContainer = document.getElementById('map');
    if (storyDetail) {
      storyDetail.animate(
        [
          { opacity: 0, transform: 'translateY(20px) rotate(1deg)', filter: 'blur(5px)' },
          { opacity: 1, transform: 'translateY(0) rotate(0deg)', filter: 'blur(0px)' },
        ],
        {
          duration: 600,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        }
      );
    }
    if (mapContainer && mapContainer.style.display !== 'none') {
      mapContainer.animate(
        [
          { opacity: 0, transform: 'translateX(20px)', filter: 'blur(5px)' },
          { opacity: 1, transform: 'translateX(0)', filter: 'blur(0px)' },
        ],
        {
          duration: 600,
          delay: 200,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards',
        }
      );
    }
  }
}