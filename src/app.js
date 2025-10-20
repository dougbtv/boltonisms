import { Store } from './store.js';
import { Router } from './router.js';
import { SearchBox } from './components/SearchBox.js';
import { HomeView } from './views/HomeView.js';
import { TermView } from './views/TermView.js';
import { NotFoundView } from './views/NotFoundView.js';

class App {
  constructor() {
    this.store = new Store();
    this.searchBox = null;
    this.router = null;
  }

  async init() {
    try {
      this.showLoading();

      await this.store.load();

      this.initSearch();

      this.initRouter();

      this.hideLoading();
    } catch (error) {
      console.error('App initialization failed:', error);
      this.showError('Failed to load app. Please refresh the page.');
    }
  }

  initSearch() {
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
      this.searchBox = new SearchBox(searchContainer);
      this.searchBox.setData(this.store.getIndex());
    }
  }

  initRouter() {
    const homeView = new HomeView(this.store);
    const termView = new TermView(this.store);
    const notFoundView = new NotFoundView();

    this.router = new Router([
      { path: '/', view: homeView },
      { path: '/t/:slug', view: termView },
      { path: '*', view: notFoundView }
    ]);
  }

  showLoading() {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div class="loading">Loading Boltonisms...</div>';
    }
  }

  hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
      loading.remove();
    }
  }

  showError(message) {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `<div class="error">${message}</div>`;
    }
  }
}

const app = new App();
app.init();
