export function fuzzySearch(query, items, fields) {
  if (!query || query.trim() === '') return items;

  const lowerQuery = query.toLowerCase().trim();

  return items
    .map(item => {
      let score = 0;

      fields.forEach(({ key, weight }) => {
        const value = key.split('.').reduce((obj, k) => obj?.[k], item);

        if (!value) return;

        const searchText = Array.isArray(value) ? value.join(' ') : String(value);
        const lowerValue = searchText.toLowerCase();

        if (lowerValue === lowerQuery) {
          score += weight * 10;
        } else if (lowerValue.startsWith(lowerQuery)) {
          score += weight * 5;
        } else if (lowerValue.includes(lowerQuery)) {
          score += weight * 2;
        } else {
          const words = lowerQuery.split(/\s+/);
          const matches = words.filter(word => lowerValue.includes(word));
          if (matches.length > 0) {
            score += weight * (matches.length / words.length);
          }
        }
      });

      return { item, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.item);
}
