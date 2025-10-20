export class Store {
  constructor() {
    this.index = [];
    this.entries = [];
    this.entriesBySlug = {};
    this.slugMap = {};
  }

  async load() {
    try {
      const [indexRes, entriesRes] = await Promise.all([
        fetch('/index.json'),
        fetch('/boltonisms.json')
      ]);

      this.index = await indexRes.json();
      this.entries = await entriesRes.json();

      this.entriesBySlug = {};
      this.slugMap = {};

      this.entries.forEach(entry => {
        this.entriesBySlug[entry.slug] = entry;
        this.slugMap[entry.term.toLowerCase()] = entry.slug;
      });

      console.log(`✓ Loaded ${this.entries.length} entries`);
    } catch (error) {
      console.error('Failed to load data:', error);
      throw error;
    }
  }

  getIndex() {
    return this.index;
  }

  getEntries() {
    return this.entries;
  }

  getEntryBySlug(slug) {
    return this.entriesBySlug[slug];
  }

  getSlugMap() {
    return this.slugMap;
  }
}
