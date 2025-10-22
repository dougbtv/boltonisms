export class AboutView {
  render() {
    return `
      <div class="about-view">
        <a href="#/" class="back-link">&larr; Back to home</a>

        <article class="page-content">
          <header class="page-header">
            <h1>About Boltonisms</h1>
          </header>

          <section class="about-section">
            <h2>What is this?</h2>
            <p>
              Boltonisms is a living dictionary of insider ski and trail terms used by
              "The Old Goats" and "Friends of Bolton" - a community of skiers who have
              been shredding the slopes together for years.
            </p>
            <p>
              These terms capture the unique culture, humor, and shared experiences of
              our crew. From trail names to ski techniques to inside jokes that have
              evolved over countless runs, this dictionary preserves our collective language.
            </p>
          </section>

          <section class="about-section">
            <h2>Who are the Old Goats?</h2>
            <p>
              The Old Goats are a group of passionate skiers who call Bolton Valley home.
              We've been skiing these mountains together, creating memories, and developing
              our own vocabulary along the way.
            </p>
            <p>
              This dictionary is our way of documenting the language that brings us together
              and keeping these terms alive for new generations of skiers.
            </p>
          </section>

          <section class="about-section">
            <h2>How does it work?</h2>
            <p>
              All terms are crowdsourced from our community and stored in a shared
              Google Sheet. The site automatically updates every hour to include new
              terms and edits, so it's always fresh with the latest slang.
            </p>
            <p>
              Want to add your own term or suggest an edit?
              Check out the <a href="#/contribute">Contribute</a> page!
            </p>
          </section>

          <section class="about-section">
            <h2>Open Source</h2>
            <p>
              This project is open source and available on GitHub. Feel free to
              check out the code, report issues, or contribute improvements!
            </p>
            <p>
              <a href="https://github.com/dougbtv/boltonisms"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="spreadsheet-link">
                View on GitHub →
              </a>
            </p>
          </section>
        </article>
      </div>
    `;
  }

  attachEvents() {
  }
}
