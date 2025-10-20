export class TermCard {
  static render(term) {
    return `
      <a href="#/t/${term.slug}" class="term-card">
        <div class="term-card-header">
          <span class="term-card-term">${term.term}</span>
          <span class="term-card-type">${term.type}</span>
        </div>
        <div class="term-card-preview">
          ${term.firstDef || term.definitions?.[0] || ''}
        </div>
      </a>
    `;
  }

  static renderList(terms) {
    if (!terms || terms.length === 0) {
      return '<div class="empty-state">No terms found</div>';
    }

    return `
      <div class="term-grid">
        ${terms.map(term => this.render(term)).join('')}
      </div>
    `;
  }
}
