export class Router {
  constructor(routes) {
    console.log('[Router] Constructor called with routes:', routes.map(r => r.path));
    this.routes = routes;
    this.currentView = null;

    window.addEventListener('hashchange', () => {
      console.log('[Router] hashchange event fired');
      this.handleRoute();
    });
  }

  handleRoute() {
    console.log('[Router] handleRoute called');
    console.log('[Router] window.location.hash:', window.location.hash);

    let hash = window.location.hash.slice(1);
    console.log('[Router] parsed hash:', hash);

    if (!hash || hash === '') {
      console.log('[Router] hash is empty, setting to /');
      hash = '/';
      if (window.location.hash !== '#/') {
        console.log('[Router] redirecting to #/');
        window.location.hash = '#/';
        return;
      }
      console.log('[Router] already at #/, continuing with route matching');
    }

    console.log('[Router] attempting to match routes for:', hash);
    for (const route of this.routes) {
      const match = this.matchRoute(hash, route.path);
      console.log('[Router] trying pattern:', route.path, 'match:', match);
      if (match) {
        console.log('[Router] matched! rendering view');
        this.renderView(route.view, match.params);
        return;
      }
    }

    console.log('[Router] no match found, showing 404');
    const notFoundRoute = this.routes.find(r => r.path === '*');
    if (notFoundRoute) {
      this.renderView(notFoundRoute.view, {});
    }
  }

  matchRoute(hash, pattern) {
    if (pattern === '*') return null;

    const patternParts = pattern.split('/');
    const hashParts = hash.split('/');

    if (patternParts.length !== hashParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const hashPart = hashParts[i];

      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = hashPart;
      } else if (patternPart !== hashPart) {
        return null;
      }
    }

    return { params };
  }

  renderView(view, params) {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    const html = view.render(params.slug);
    appContainer.innerHTML = html;

    this.currentView = view;

    if (view.attachEvents) {
      view.attachEvents();
    }

    window.scrollTo(0, 0);
  }

  navigate(path) {
    window.location.hash = `#${path}`;
  }
}
