import { fuzzySearch } from '../utils/fuzzy.js';

export class SearchBox {
  constructor(container, onResults) {
    this.container = container;
    this.onResults = onResults;
    this.debounceTimer = null;
    this.allItems = [];

    this.render();
    this.attachEvents();
  }

  setData(items) {
    this.allItems = items;
  }

  render() {
    this.container.innerHTML = `
      <div class="search-box">
        <input
          type="text"
          id="search-input"
          placeholder="Search terms..."
          autocomplete="off"
          aria-label="Search terms"
        />
        <div id="search-results" class="search-results hidden"></div>
      </div>
    `;

    this.input = this.container.querySelector('#search-input');
    this.resultsContainer = this.container.querySelector('#search-results');
  }

  attachEvents() {
    this.input.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.handleSearch(e.target.value);
      }, 150);
    });

    this.input.addEventListener('focus', (e) => {
      if (e.target.value) {
        this.handleSearch(e.target.value);
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideResults();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== this.input) {
        e.preventDefault();
        this.input.focus();
      }

      if (e.key === 'Escape') {
        this.hideResults();
        this.input.blur();
      }
    });
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.hideResults();
      return;
    }

    const results = fuzzySearch(query, this.allItems, [
      { key: 'term', weight: 3 },
      { key: 'firstDef', weight: 2 },
      { key: 'seeAlso', weight: 1 }
    ]);

    this.showResults(results.slice(0, 10));
  }

  showResults(results) {
    if (results.length === 0) {
      this.resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
      this.resultsContainer.classList.remove('hidden');
      return;
    }

    this.resultsContainer.innerHTML = results
      .map(item => `
        <a href="#/t/${item.slug}" class="search-result-item">
          <div class="search-result-term">${item.term}</div>
          <div class="search-result-type">${item.type}</div>
          <div class="search-result-def">${item.firstDef}</div>
        </a>
      `)
      .join('');

    this.resultsContainer.classList.remove('hidden');

    if (this.onResults) {
      this.onResults(results);
    }
  }

  hideResults() {
    this.resultsContainer.classList.add('hidden');
  }

  clear() {
    this.input.value = '';
    this.hideResults();
  }
}
