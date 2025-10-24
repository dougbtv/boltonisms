import { formatDefinition, autoLinkTerms } from '../utils/formatters.js';

export class DefinitionRail {
  static render(definitions, slugMap = {}, currentSlug = null) {
    if (!definitions || definitions.length === 0) return '';

    return `
      <div class="definition-rail">
        ${definitions.map((def, idx) => this.renderDefinition(def, idx + 1, slugMap, currentSlug)).join('')}
      </div>
    `;
  }

  static renderDefinition(definition, number, slugMap = {}, currentSlug = null) {
    const formatted = formatDefinition(definition);

    if (formatted.bullets) {
      const linkedIntro = autoLinkTerms(formatted.intro, slugMap, currentSlug);
      const linkedBullets = formatted.bullets.map(b => ({
        letter: b.letter,
        text: autoLinkTerms(b.text, slugMap, currentSlug)
      }));

      return `
        <div class="definition-item">
          <div class="definition-number">${number}</div>
          <div class="definition-content">
            <div class="definition-intro">${linkedIntro}</div>
            <ul class="definition-subbullets">
              ${linkedBullets.map(b => `
                <li><strong>${b.letter}:</strong> ${b.text}</li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
    }

    const linkedText = autoLinkTerms(formatted.text, slugMap, currentSlug);

    return `
      <div class="definition-item">
        <div class="definition-number">${number}</div>
        <div class="definition-content">
          <div class="definition-text">${linkedText}</div>
        </div>
      </div>
    `;
  }
}
