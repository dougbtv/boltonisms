import { TermCard } from '../components/TermCard.js';
import { groupByLetter } from '../utils/formatters.js';

export class HomeView {
  constructor(store) {
    this.store = store;
  }

  render() {
    const index = this.store.getIndex();
    const randomTerm = this.getRandomTerm(index);
    const latest = this.getLatestTerms(index, 2);
    const featured = this.getFeaturedTerms(index, 6);

    return `
      <div class="home-view">
        <header class="home-header">
          <img src="/header.png" alt="Boltonisms" class="header-logo" />
          <p class="tagline">The Bolton Dirt Bag Dictionary.</p>
        </header>

        <div class="random-term-section">
          <button id="random-btn" class="random-btn">Random Term</button>
          ${randomTerm ? `
            <div class="random-term-preview">
              ${TermCard.render(randomTerm)}
            </div>
          ` : ''}
        </div>

        ${latest.length > 0 ? `
          <section class="latest-section">
            <h2>Latest Entries</h2>
            ${TermCard.renderList(latest)}
          </section>
        ` : ''}

        <section class="featured-section">
          <h2>Featured Terms</h2>
          ${TermCard.renderList(featured)}
        </section>

        <section class="browse-section">
          <h2>Browse All Terms</h2>
          ${this.renderAlphabetFilter()}
          <div id="browse-list" class="browse-list">
            ${this.renderAllTerms(index)}
          </div>
        </section>

        <footer class="site-footer">
          <nav class="footer-nav">
            <a href="#/about">About</a>
            <a href="#/contribute">Contribute</a>
          </nav>
        </footer>
      </div>
    `;
  }

  renderAlphabetFilter() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return `
      <div class="alphabet-filter">
        <button class="filter-btn active" data-letter="all">All</button>
        ${alphabet.map(letter => `
          <button class="filter-btn" data-letter="${letter}">${letter}</button>
        `).join('')}
      </div>
    `;
  }

  renderAllTerms(terms) {
    const grouped = groupByLetter(terms, t => t.term);

    return `
      <div class="letter-groups">
        ${grouped.map(group => `
          <div class="letter-group" data-letter="${group.letter}">
            <h3 class="letter-heading">${group.letter}</h3>
            ${TermCard.renderList(group.items)}
          </div>
        `).join('')}
      </div>
    `;
  }

  getRandomTerm(terms) {
    if (!terms || terms.length === 0) return null;
    return terms[Math.floor(Math.random() * terms.length)];
  }

  getLatestTerms(terms, count) {
    if (!terms || terms.length === 0) return [];

    // Filter to only terms with lastEdit, excluding featured terms
    const withEdits = terms.filter(t => t.lastEdit && !t.featured);

    if (withEdits.length === 0) return [];

    const sorted = [...withEdits].sort((a, b) => {
      return new Date(b.lastEdit) - new Date(a.lastEdit);
    });

    return sorted.slice(0, count);
  }

  getFeaturedTerms(terms, count) {
    if (!terms || terms.length === 0) return [];

    // First, check if any terms are explicitly marked as featured
    const explicitlyFeatured = terms.filter(t => t.featured === true);

    if (explicitlyFeatured.length > 0) {
      // If we have explicitly featured terms, use those
      // Shuffle them for variety and take up to count
      const shuffled = [...explicitlyFeatured].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    // Fallback: No explicitly featured terms, use old logic
    // Separate terms with and without lastEdit
    const withEdits = terms.filter(t => t.lastEdit);
    const withoutEdits = terms.filter(t => !t.lastEdit);

    // Prioritize recently edited (50% chance), then random from all
    const featured = [];

    // First, try to get some recent ones (up to half)
    if (withEdits.length > 0) {
      const recentCount = Math.min(Math.ceil(count / 2), withEdits.length);
      const sorted = [...withEdits].sort((a, b) => {
        return new Date(b.lastEdit) - new Date(a.lastEdit);
      });
      featured.push(...sorted.slice(0, recentCount));
    }

    // Fill the rest with random terms
    const remaining = count - featured.length;
    if (remaining > 0) {
      const pool = [...withoutEdits, ...withEdits.filter(t => !featured.includes(t))];
      const shuffled = pool.sort(() => Math.random() - 0.5);
      featured.push(...shuffled.slice(0, remaining));
    }

    return featured;
  }

  attachEvents() {
    const randomBtn = document.getElementById('random-btn');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        const index = this.store.getIndex();
        const randomTerm = this.getRandomTerm(index);
        if (randomTerm) {
          window.location.hash = `#/t/${randomTerm.slug}`;
        }
      });
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const letter = btn.dataset.letter;
        this.filterByLetter(letter);
      });
    });
  }

  filterByLetter(letter) {
    const groups = document.querySelectorAll('.letter-group');

    if (letter === 'all') {
      groups.forEach(g => g.style.display = 'block');
    } else {
      groups.forEach(g => {
        if (g.dataset.letter === letter) {
          g.style.display = 'block';
        } else {
          g.style.display = 'none';
        }
      });
    }
  }
}
