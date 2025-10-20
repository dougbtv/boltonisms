export class Pills {
  static render(items, linkedSlugs = {}) {
    if (!items || items.length === 0) return '';

    return items.map(item => {
      const slug = linkedSlugs[item.toLowerCase()];

      if (slug) {
        return `<a href="#/t/${slug}" class="pill pill-link">${item}</a>`;
      }

      return `<span class="pill">${item}</span>`;
    }).join('');
  }

  static renderOtherForms(forms) {
    if (!forms || forms.length === 0) return '';

    return `
      <div class="other-forms-section">
        <h3>Other forms</h3>
        <div class="pills-container">
          ${this.render(forms)}
        </div>
      </div>
    `;
  }

  static renderSeeAlso(terms, linkedSlugs = {}) {
    if (!terms || terms.length === 0) return '';

    return `
      <div class="see-also-section">
        <h3>See also</h3>
        <div class="pills-container">
          ${this.render(terms, linkedSlugs)}
        </div>
      </div>
    `;
  }
}
