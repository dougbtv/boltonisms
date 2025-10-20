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
