export class NotFoundView {
  render() {
    return `
      <div class="not-found-view">
        <h1>404</h1>
        <p>Page not found</p>
        <a href="#/" class="btn">Go home</a>
      </div>
    `;
  }

  attachEvents() {
  }
}
