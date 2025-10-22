export class ContributeView {
  render() {
    return `
      <div class="contribute-view">
        <a href="#/" class="back-link">&larr; Back to home</a>

        <article class="page-content">
          <header class="page-header">
            <h1>Contribute to Boltonisms</h1>
          </header>

          <section class="contribute-section">
            <h2>Add Your Own Term</h2>
            <p>
              Got a piece of ski slang that deserves to be immortalized? We want to hear it!
              Boltonisms is a community effort, and we're always looking for new terms to add.
            </p>
          </section>

          <section class="contribute-section">
            <h2>How to Contribute</h2>
            <ol class="contribute-steps">
              <li>
                <strong>View the spreadsheet:</strong>
                <a href="https://docs.google.com/spreadsheets/d/1x5WcMlprvYs3IHSbhI2rzt9xEZxAgi6w97Pu7UdHISI/edit?gid=0#gid=0"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="spreadsheet-link">
                  Open the Boltonisms Google Sheet
                </a>
              </li>
              <li>
                <strong>Request edit access:</strong>
                If you don't already have access, click the "Request access" button in Google Sheets
                or reach out to one of the Old Goats directly.
              </li>
              <li>
                <strong>Add your term:</strong>
                Fill in a new row with your term, definition, type, examples, and any other details.
              </li>
              <li>
                <strong>Wait for it to appear:</strong>
                The site updates automatically every hour, so your contribution will show up soon!
                (Note: It won't be instant, but it'll be there before your next run.)
              </li>
            </ol>
          </section>

          <section class="contribute-section">
            <h2>What to Include</h2>
            <div class="field-guide">
              <div class="field-item">
                <strong>Term</strong> (required) - The word or phrase
              </div>
              <div class="field-item">
                <strong>Type</strong> - Part of speech (noun, verb, adjective, phrase, etc.)
              </div>
              <div class="field-item">
                <strong>Definitions</strong> (at least one required) - What does it mean? You can add up to 3 definitions.
              </div>
              <div class="field-item">
                <strong>Other forms</strong> - Variations of the term
              </div>
              <div class="field-item">
                <strong>History</strong> - Origin story or etymology
              </div>
              <div class="field-item">
                <strong>See also</strong> - Related terms
              </div>
              <div class="field-item">
                <strong>Example usage</strong> - Show it in action!
              </div>
              <div class="field-item">
                <strong>Image</strong> - Add a picture! Use <code>=IMAGE("https://...")</code> formula or paste image URL as text
              </div>
              <div class="field-item">
                <strong>Attribution</strong> - Who coined it or made it famous?
              </div>
            </div>
          </section>

          <section class="contribute-section">
            <h2>Guidelines</h2>
            <ul class="guidelines-list">
              <li>Keep it authentic - real terms we actually use on the mountain</li>
              <li>Be descriptive with your definitions</li>
              <li>Add examples to show context</li>
              <li>Have fun with it - humor is encouraged!</li>
            </ul>
          </section>
        </article>
      </div>
    `;
  }

  attachEvents() {
  }
}
