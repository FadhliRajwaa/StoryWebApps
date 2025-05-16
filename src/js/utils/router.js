import { AuthPresenter } from '../presenters/AuthPresenter.js';
import { StoryListPresenter } from '../presenters/StoryListPresenter.js';
import { StoryDetailPresenter } from '../presenters/StoryDetailPresenter.js';
import { AddStoryPresenter } from '../presenters/AddStoryPresenter.js';
import { Auth } from './auth.js';
import { FavoritesPresenter } from '../presenters/FavoritesPresenter.js';

export class Router {
  constructor() {
    this.routes = {
      '/home': () => {
        if (Auth.isAuthenticated()) {
          return new StoryListPresenter();
        } else {
          window.location.hash = '#/login';
          return new AuthPresenter('login');
        }
      },
      '/add-story': () => {
        if (Auth.isAuthenticated()) {
          return new AddStoryPresenter();
        } else {
          window.location.hash = '#/login';
          return new AuthPresenter('login');
        }
      },
      '/story/:id': (params) => new StoryDetailPresenter(params.id),
      '/login': () => new AuthPresenter('login'),
      '/register': () => new AuthPresenter('register'),
      '/profile': () => {
        const app = document.getElementById('app');
        if (app) {
          app.innerHTML = `
            <section aria-labelledby="profile-heading">
              <h2 id="profile-heading">Profil</h2>
              <p>Halaman profil pengguna (belum diimplementasikan).</p>
            </section>
          `;
        }
      },
      '/not-found': () => {
        const app = document.getElementById('app');
        if (app) {
          app.innerHTML = `
            <section aria-labelledby="not-found-heading">
              <h2 id="not-found-heading">Halaman Tidak Ditemukan</h2>
              <p>Maaf, halaman yang Anda cari tidak ada.</p>
              <a href="#/home" class="back-btn">Kembali ke Beranda</a>
            </section>
          `;
        }
      },
      '/favorites': () => {
        if (Auth.isAuthenticated()) {
          return new FavoritesPresenter();
        } else {
          window.location.hash = '#/login';
          return new AuthPresenter('login');
        }
      }
    };
    this.app = document.getElementById('app');
    this.currentPresenter = null;
  }

  init() {
    console.log('Router: Initializing...');
    window.addEventListener('hashchange', () => {
      console.log('Router: Hashchange event fired');
      this.handleRoute();
    });
    this.handleRoute();
  }

  handleRoute() {
    console.log('Router: Handling route...');
    const hash = window.location.hash.slice(1) || '/home';
    console.log('Router: Current hash:', hash);
    const [path, param] = hash.split('/').slice(1);
    const routeKey = param ? `/${path}/:id` : `/${path}`;
    const route = this.routes[routeKey] || this.routes['/not-found'];
    console.log('Router: Route key:', routeKey);

    // Jika menuju ke home dan user sudah terautentikasi, prioritaskan rendering
    if (routeKey === '/home' && Auth.isAuthenticated()) {
      console.log('Router: Direct to home with authenticated user');
      if (this.currentPresenter && typeof this.currentPresenter.cleanup === 'function') {
        this.currentPresenter.cleanup();
      }
      this.currentPresenter = new StoryListPresenter();
      return;
    }

    const updateView = () => {
      if (this.currentPresenter && typeof this.currentPresenter.cleanup === 'function') {
        this.currentPresenter.cleanup();
      }
      this.currentPresenter = route(param ? { id: param } : {});
    };

    if (document.startViewTransition) {
      console.log('Router: Using View Transition API');
      document.startViewTransition(() => {
        updateView();
      });
    } else {
      console.log('Router: Falling back to CSS animation');
      if (this.app) {
        this.app.animate(
          [
            { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
            { opacity: 0, transform: 'scale(0.98)', filter: 'blur(3px)' },
          ],
          { duration: 250, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
        ).onfinish = () => {
          updateView();
          this.app.animate(
            [
              { opacity: 0, transform: 'scale(0.98)', filter: 'blur(3px)' },
              { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
            ],
            { duration: 250, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
          );
        };
      } else {
        updateView();
      }
    }
  }

  navigateTo(path) {
    console.log('Router: Navigating to:', path);
    const currentHash = window.location.hash || '#/home';
    if (currentHash !== path) {
      window.location.hash = path;
    } else {
      console.log('Router: Hash unchanged, manually triggering handleRoute');
      this.handleRoute();
    }
  }
}

const routerInstance = new Router();
export default routerInstance;