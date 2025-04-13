// src/presenters/StoryDetailPresenter.js
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
      document.getElementById('app').innerHTML = this.view.render(story);
      this.setupMap(story);
    } catch (error) {
      console.error('StoryDetailPresenter: Error fetching story:', error);
      showToast({
        message: error.message || 'Gagal memuat detail cerita. Coba lagi nanti.',
        type: 'error',
      });
      router.navigateTo('#/home');
    }
  }

  setupMap(story) {
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
      const marker = addMarker(map, story.lat, story.lon, story.description);
      if (!marker) {
        console.warn('Failed to add marker.');
        showToast({ message: 'Gagal menambahkan marker pada peta.', type: 'error' });
      }
    } else {
      const mapContainer = document.getElementById('map');
      if (mapContainer) {
        mapContainer.style.display = 'none';
      }
    }
  }
}