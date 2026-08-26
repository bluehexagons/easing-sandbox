import { namedCurves } from './curves';
import { initializePlayground } from './player';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root was not found');

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#top" aria-label="Easing Lab home">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32"><path d="M4 24c6.5 0 5.7-16 12-16 4.8 0 4.2 11 12 11" /></svg>
      </span>
      <span>Easing Lab</span>
    </a>
    <nav aria-label="Main navigation">
      <a href="#curves">Curves</a>
      <a href="#workshop">Workshop</a>
      <a class="source-link" href="https://github.com/bluehexagons/easing" target="_blank" rel="noreferrer">
        Source
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.5h8v8M12 4 4 12" /></svg>
      </a>
    </nav>
  </header>

  <main id="top">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> TypeScript motion playground</p>
        <h1 id="hero-title">Shape the<br /><em>in-between.</em></h1>
        <p class="hero-intro">Explore, compare, and compose easing curves from <a href="https://github.com/bluehexagons/easing" target="_blank" rel="noreferrer">@bluehexagons/easing</a>.</p>
      </div>
      <div class="hero-scribble" aria-hidden="true">
        <svg viewBox="0 0 330 210">
          <path class="scribble-line" d="M12 182C79 181 48 29 153 29c68 0 47 128 164 84" />
          <circle cx="153" cy="29" r="6" />
          <path class="scribble-arrow" d="m298 102 20 11-13 19" />
        </svg>
        <span>pick a curve<br />and press play</span>
      </div>
    </section>

    <section class="curves-section" id="curves" aria-labelledby="curves-title">
      <div class="section-header">
        <div>
          <p class="section-kicker">The collection</p>
          <h2 id="curves-title">Find your rhythm</h2>
          <p>Every parameter-free curve in the package, with its own player. Pick one to keep its details close as you browse.</p>
        </div>
        <label class="search-box">
          <span class="sr-only">Search curves</span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
          <input id="curve-search" type="search" placeholder="Search curves" autocomplete="off" />
        </label>
      </div>
      <div class="collection-toolbar">
        <div class="filters" role="group" aria-label="Filter curve collection">
          <button class="filter active" type="button" data-filter="all">All <span>${namedCurves.length}</span></button>
          <button class="filter" type="button" data-filter="classic">Classic</button>
          <button class="filter" type="button" data-filter="smooth">Smooth</button>
          <button class="filter" type="button" data-filter="expressive">Expressive</button>
        </div>
        <div class="playback-options">
          <label class="autoplay-control" for="autoplay-visible">
            <span class="autoplay-prompt">
              <span class="autoplay-badge">Try it</span>
              <span><strong>Auto-play visible previews</strong><small>Starts animations as you scroll. May impact performance.</small></span>
            </span>
            <input id="autoplay-visible" type="checkbox" role="switch" />
          </label>
          <fieldset class="preview-modes">
            <legend>Preview as</legend>
            <div role="group" aria-label="Preview visualization">
              <button type="button" data-preview-mode="curve" aria-pressed="false">Curve</button>
              <button class="active" type="button" data-preview-mode="move" aria-pressed="true">Move</button>
              <button type="button" data-preview-mode="scale" aria-pressed="false">Scale</button>
              <button type="button" data-preview-mode="rotate" aria-pressed="false">Rotate</button>
            </div>
          </fieldset>
          <label class="duration-control" for="duration">
            <span class="duration-copy"><span>Playback duration</span><output id="duration-output" for="duration">1.8 s</output></span>
            <input id="duration" type="range" min="300" max="30000" value="1800" step="100" />
            <span class="duration-bounds" aria-hidden="true"><span>300 ms</span><span>30 s</span></span>
          </label>
          <label class="loop-control" for="loop-playback">
            <input id="loop-playback" type="checkbox" checked />
            <span><strong>Loop</strong><small>Keep comparisons moving</small></span>
          </label>
          <div class="sync-control">
            <span><output id="playing-count">0</output> playing in sync</span>
            <button id="stop-all" type="button" disabled>Stop all</button>
          </div>
        </div>
      </div>
      <div class="curve-grid" id="curve-grid"></div>
      <p class="empty-state" id="empty-state" hidden>No curves match that search.</p>
    </section>

    <section class="workshop-section" id="workshop" aria-labelledby="workshop-title">
      <div class="workshop-intro">
        <div class="workshop-heading">
          <p class="section-kicker light">Beyond the presets</p>
          <h2 id="workshop-title">Build something <em>with character.</em></h2>
        </div>
        <div class="workshop-guide">
          <p>The library's constructors and combinators turn a few expressive ingredients into reusable motion.</p>
          <div class="workshop-instruction">
            <span class="instruction-number">01</span>
            <span><strong>Choose a recipe</strong><small>It loads into the active player and starts immediately.</small></span>
            <span class="instruction-arrow" aria-hidden="true">↓</span>
          </div>
        </div>
      </div>
      <div class="recipe-grid" id="recipe-grid"></div>
    </section>

    <section class="utility-section" aria-labelledby="utilities-title">
      <div>
        <p class="section-kicker">Small tools, big range</p>
        <h2 id="utilities-title">Compose your own</h2>
        <p>Preview each operation on its own, or apply it directly to the curve in your active player.</p>
      </div>
      <div class="utility-list" id="utility-list"></div>
    </section>
  </main>

  <aside class="curve-companion visible" id="curve-companion" aria-label="Active curve player">
    <div class="companion-summary">
      <div class="companion-copy">
        <span class="companion-kicker">Active curve</span>
        <strong id="companion-name" aria-live="polite">Cubic In Out</strong>
        <span class="companion-values">
          <span>t</span><output id="companion-time">0.000</output>
          <span>y</span><output id="companion-value">0.000</output>
        </span>
      </div>
      <svg class="companion-graph" viewBox="0 0 120 64" aria-hidden="true">
        <path class="companion-grid" d="M8 56H112M8 56V8" />
        <path class="companion-reference" d="M8 56L112 8" />
        <path class="companion-path" id="companion-path" />
        <circle class="companion-marker-ring" id="companion-marker-ring" r="4.5" />
        <circle class="companion-marker" id="companion-marker" r="2.5" />
      </svg>
      <div class="companion-actions">
        <button class="companion-play" id="companion-play" type="button" aria-label="Play active curve">
          <svg class="play-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="m5 3 9 6-9 6z" /></svg>
          <svg class="pause-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3h3v12H5zm5 0h3v12h-3z" /></svg>
        </button>
        <button class="companion-details" id="companion-details" type="button" aria-expanded="false" aria-controls="companion-expanded">
          <span>Details</span>
          <svg class="expand-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 7V3h4M9 3h4v4M13 9v4H9M7 13H3V9" /></svg>
          <svg class="collapse-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M7 3v4H3M13 7H9V3M9 13V9h4M3 9h4v4" /></svg>
        </button>
      </div>
    </div>
    <div class="companion-expanded" id="companion-expanded">
      <div class="companion-detail-copy">
        <div>
          <p class="section-kicker">Selected curve</p>
          <p class="curve-description" id="curve-description"></p>
        </div>
        <div class="value-readout">
          <span>output</span>
          <strong id="value-output">0.000</strong>
        </div>
      </div>
      <div class="companion-detail-grid">
        <div class="companion-graph-detail">
          <svg class="main-graph" id="main-graph" viewBox="0 0 560 300" role="img" aria-labelledby="graph-title graph-description">
            <title id="graph-title">Easing curve graph</title>
            <desc id="graph-description">The selected easing curve, plotting normalized time against output.</desc>
            <g id="graph-grid"></g>
            <path class="graph-reference" d="M44 254L524 34" />
            <path class="graph-path-shadow" id="graph-shadow" />
            <path class="graph-path" id="graph-path" />
            <line class="graph-guide" id="graph-guide" />
            <circle class="graph-marker-ring" id="graph-marker-ring" r="9" />
            <circle class="graph-marker" id="graph-marker" r="4" />
          </svg>
          <div class="graph-axis"><span>time →</span><span>value ↑</span></div>
          <div class="companion-scrubber">
            <label class="scrubber">
              <span class="sr-only">Animation progress</span>
              <input id="progress" type="range" min="0" max="1" value="0" step="0.001" />
            </label>
            <output id="time-output" for="progress">0.000</output>
          </div>
        </div>
        <div class="code-card">
          <div class="code-topline"><span>TypeScript</span><button id="copy-code" type="button">Copy</button></div>
          <pre><code id="code-output"></code></pre>
        </div>
      </div>
      <section class="sandbox-card" aria-labelledby="sandbox-title">
        <div class="sandbox-heading">
          <div>
            <p class="section-kicker">Editable sandbox</p>
            <h3 id="sandbox-title">Transform the active curve</h3>
          </div>
          <p>Edit a JavaScript function body. <code>curve(time)</code> calls the currently selected easing.</p>
        </div>
        <label for="sandbox-code" class="sr-only">Sandbox function body</label>
        <textarea id="sandbox-code" spellcheck="false">const eased = curve(time);
return Math.min(1, Math.max(0, eased));</textarea>
        <div class="sandbox-actions">
          <output id="sandbox-status" aria-live="polite">Ready to run</output>
          <button id="run-sandbox" type="button">Run as active curve <span aria-hidden="true">→</span></button>
        </div>
      </section>
    </div>
  </aside>

  <footer>
    <div class="footer-mark" aria-hidden="true">
      <svg viewBox="0 0 72 72"><path d="M8 55c18 0 14-38 32-38 12 0 10 28 24 22" /></svg>
    </div>
    <p>Made to explore <a href="https://github.com/bluehexagons/easing" target="_blank" rel="noreferrer">@bluehexagons/easing</a>.</p>
    <p class="footer-note">TypeScript · No runtime dependencies beyond the curves</p>
  </footer>
`;

initializePlayground();
