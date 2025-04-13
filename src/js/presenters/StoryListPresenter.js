// src/presenters/StoryListPresenter.js
import { StoryModel } from '../models/StoryModel.js';
import { StoryListView } from '../views/StoryListView.js';
import { Auth } from '../utils/auth.js';

export class StoryListPresenter {
  constructor() {
    console.log('StoryListPresenter: Constructor called');
    this.model = new StoryModel();
    this.view = new StoryListView();
    this.init();
  }

  async init() {
    console.log('StoryListPresenter: Initializing...');
    console.log('StoryListPresenter: Is authenticated?', Auth.isAuthenticated());
    if (!Auth.isAuthenticated()) {
      console.log('StoryListPresenter: User not authenticated, redirecting to login');
      window.location.hash = '#/login';
      return;
    }

    try {
      console.log('StoryListPresenter: Fetching stories...');
      const stories = await this.model.fetchStories({ location: 1 });
      console.log('StoryListPresenter: Stories fetched:', stories);
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = this.view.render(stories);
        console.log('StoryListPresenter: Stories rendered successfully');
      } else {
        console.error('StoryListPresenter: App container not found');
      }
    } catch (error) {
      console.error('StoryListPresenter: Error fetching stories:', error);
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = `
          <section role="alert">
            <p>Gagal memuat daftar cerita. Silakan coba lagi nanti.</p>
          </section>
        `;
      } else {
        console.error('StoryListPresenter: App container not found');
      }
    }
  }
}