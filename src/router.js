export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentView = null;

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';

    for (const route of this.routes) {
      const match = this.matchRoute(hash, route.path);
      if (match) {
        this.renderView(route.view, match.params);
        return;
      }
    }

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
