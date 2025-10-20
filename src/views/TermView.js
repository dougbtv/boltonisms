import { DefinitionRail } from '../components/DefinitionRail.js';
import { Pills } from '../components/Pills.js';

export class TermView {
  constructor(store) {
    this.store = store;
  }

  render(slug) {
    const entry = this.store.getEntryBySlug(slug);

    if (!entry) {
      return '<div class="error">Term not found</div>';
    }

    const slugMap = this.store.getSlugMap();

    return `
      <div class="term-view">
        <a href="#/" class="back-link">&larr; Back to home</a>

        <article class="term-article">
          <header class="term-header">
            <h1 class="headword">${entry.term}</h1>
            <span class="term-type">${entry.type}</span>
          </header>

          <section class="definitions-section">
            ${DefinitionRail.render(entry.definitions)}
          </section>

          ${entry.otherForms && entry.otherForms.length > 0 ? Pills.renderOtherForms(entry.otherForms) : ''}

          ${entry.history ? `
            <section class="history-section">
              <h3>Did you know?</h3>
              <div class="history-box">
                ${entry.history}
              </div>
            </section>
          ` : ''}

          ${entry.examples && entry.examples.length > 0 ? `
            <section class="examples-section">
              <h3>Examples</h3>
              <ul class="examples-list">
                ${entry.examples.map(ex => `<li class="example">"${ex}"</li>`).join('')}
              </ul>
            </section>
          ` : ''}

          ${entry.seeAlso && entry.seeAlso.length > 0 ? Pills.renderSeeAlso(entry.seeAlso, slugMap) : ''}

          ${entry.image && entry.image.url ? `
            <section class="image-section">
              <img src="${entry.image.url}" alt="${entry.image.alt || entry.term}" class="term-image" />
            </section>
          ` : ''}

          ${entry.attribution ? `
            <footer class="term-footer">
              <small>Attributed to: ${entry.attribution}</small>
            </footer>
          ` : ''}
        </article>
      </div>
    `;
  }

  attachEvents() {
  }
}
