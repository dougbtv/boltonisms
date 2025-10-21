import { TermCard } from '../components/TermCard.js';
import { groupByLetter } from '../utils/formatters.js';

export class HomeView {
  constructor(store) {
    this.store = store;
  }

  render() {
    const index = this.store.getIndex();
    const randomTerm = this.getRandomTerm(index);
    const featured = this.getFeaturedTerms(index, 6);

    return `
      <div class="home-view">
        <header class="home-header">
          <img src="/header.png" alt="Boltonisms" class="header-logo" />
          <p class="tagline">The Goats Dictionary.</p>
        </header>

        <div class="random-term-section">
          <button id="random-btn" class="random-btn">Random Term</button>
          ${randomTerm ? `
            <div class="random-term-preview">
              ${TermCard.render(randomTerm)}
            </div>
          ` : ''}
        </div>

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

  getFeaturedTerms(terms, count) {
    if (!terms || terms.length === 0) return [];

    const shuffled = [...terms].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
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
