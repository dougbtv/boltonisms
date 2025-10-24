export function formatDefinition(definition) {
  const subBulletPattern = /([a-z])\s*:/gi;

  if (subBulletPattern.test(definition)) {
    const parts = definition.split(subBulletPattern);

    if (parts.length > 1) {
      const intro = parts[0].trim();
      const bullets = [];

      for (let i = 1; i < parts.length; i += 2) {
        const letter = parts[i];
        const text = parts[i + 1]?.trim();
        if (text) {
          bullets.push({ letter, text });
        }
      }

      return { intro, bullets };
    }
  }

  return { text: definition };
}

export function highlightMatch(text, query) {
  if (!query || !text) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

export function groupByLetter(items, keyFn) {
  const groups = {};

  items.forEach(item => {
    const key = keyFn(item);
    const letter = key[0].toUpperCase();

    if (!groups[letter]) {
      groups[letter] = [];
    }

    groups[letter].push(item);
  });

  return Object.keys(groups)
    .sort()
    .map(letter => ({
      letter,
      items: groups[letter]
    }));
}

/**
 * Auto-links dictionary terms found in text
 * @param {string} text - The text to process
 * @param {Object} slugMap - Map of lowercase terms to slugs
 * @param {string} currentSlug - Current term slug (to avoid self-linking)
 * @returns {string} HTML with linked terms
 */
export function autoLinkTerms(text, slugMap, currentSlug = null) {
  if (!text || !slugMap) return text;

  // Get all terms sorted by length (longest first) to match multi-word terms first
  const terms = Object.keys(slugMap).sort((a, b) => b.length - a.length);

  // Build a regex pattern that matches whole words only
  // Escape special regex characters and join with |
  const pattern = terms
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  if (!pattern) return text;

  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

  // Track which positions have already been linked to avoid double-linking
  const linkedRanges = [];

  const result = text.replace(regex, (match, term, offset) => {
    const termLower = term.toLowerCase();
    const slug = slugMap[termLower];

    // Don't link if:
    // 1. No slug found (shouldn't happen due to our pattern, but safety check)
    // 2. It's the current term (avoid self-linking)
    // 3. This position overlaps with an already-linked term
    if (!slug || slug === currentSlug) {
      return match;
    }

    // Check if this range overlaps with any already-linked range
    const end = offset + match.length;
    for (const range of linkedRanges) {
      if (offset < range.end && end > range.start) {
        return match; // Overlap detected, don't link
      }
    }

    // Mark this range as linked
    linkedRanges.push({ start: offset, end });

    return `<a href="#/t/${slug}" class="term-link">${match}</a>`;
  });

  return result;
}
