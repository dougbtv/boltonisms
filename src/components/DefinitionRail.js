import { formatDefinition } from '../utils/formatters.js';

export class DefinitionRail {
  static render(definitions) {
    if (!definitions || definitions.length === 0) return '';

    return `
      <div class="definition-rail">
        ${definitions.map((def, idx) => this.renderDefinition(def, idx + 1)).join('')}
      </div>
    `;
  }

  static renderDefinition(definition, number) {
    const formatted = formatDefinition(definition);

    if (formatted.bullets) {
      return `
        <div class="definition-item">
          <div class="definition-number">${number}</div>
          <div class="definition-content">
            <div class="definition-intro">${formatted.intro}</div>
            <ul class="definition-subbullets">
              ${formatted.bullets.map(b => `
                <li><strong>${b.letter}:</strong> ${b.text}</li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
    }

    return `
      <div class="definition-item">
        <div class="definition-number">${number}</div>
        <div class="definition-content">
          <div class="definition-text">${formatted.text}</div>
        </div>
      </div>
    `;
  }
}
