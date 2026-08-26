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
      <a href="#workshop">Examples</a>
      <a href="#advanced">Builders</a>
      <a class="source-link" href="https://github.com/bluehexagons/easing" target="_blank" rel="noreferrer">
        Source
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.5h8v8M12 4 4 12" /></svg>
      </a>
    </nav>
  </header>

  <main id="top">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> TypeScript playground</p>
        <h1 id="hero-title">Easing<br /><em>sandbox.</em></h1>
        <p class="hero-intro">Test and compose curves from <a href="https://github.com/bluehexagons/easing" target="_blank" rel="noreferrer">@bluehexagons/easing</a>.</p>
      </div>
    </section>

    <section class="curves-section" id="curves" aria-labelledby="curves-title">
      <div class="section-header">
        <div>
          <p class="section-kicker">Curves</p>
          <h2 id="curves-title">Preset curves</h2>
          <p>All parameter-free exports in the package. Select a card to inspect its graph and code.</p>
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
              <span class="autoplay-badge">Optional</span>
              <span><strong>Auto-play visible previews</strong><small>Starts previews as they enter the viewport. Uses more CPU.</small></span>
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
              <button type="button" data-preview-mode="color" aria-pressed="false">Color</button>
            </div>
          </fieldset>
          <label class="duration-control" for="duration">
            <span class="duration-copy"><span>Playback duration</span><output id="duration-output" for="duration">1.8 s</output></span>
            <input id="duration" type="range" min="300" max="30000" value="1800" step="100" />
            <span class="duration-bounds" aria-hidden="true"><span>300 ms</span><span id="duration-context">Per direction</span><span>30 s</span></span>
          </label>
          <div class="sync-control">
            <span><output id="playing-count">0</output> playing in sync</span>
            <button id="stop-all" type="button" disabled>Stop all</button>
          </div>
          <fieldset class="repeat-control">
            <legend>Repeat style</legend>
            <div role="group" aria-label="Repeat style">
              <button type="button" data-repeat-style="loop" aria-pressed="false"><strong>Loop</strong><small>Restart at 0</small></button>
              <button type="button" data-repeat-style="rewind" aria-pressed="false"><strong>Rewind</strong><small>Retrace the curve</small></button>
              <button class="active" type="button" data-repeat-style="alternate" aria-pressed="true"><strong>Alternate</strong><small>0→1 each way</small></button>
              <button type="button" data-repeat-style="once" aria-pressed="false"><strong>Once</strong><small>One pass only</small></button>
              <button type="button" data-repeat-style="custom" aria-pressed="false"><strong>Custom</strong><small>Use a timeline</small></button>
            </div>
            <p id="repeat-description" aria-live="polite">Runs 0→1 in each direction, applying the same easing on both passes.</p>
          </fieldset>
          <section class="custom-timeline" id="custom-timeline" aria-labelledby="custom-timeline-title" hidden>
            <div>
              <span class="custom-timeline-kicker">Custom timeline</span>
              <strong id="custom-timeline-title">Timeline source</strong>
            </div>
            <div class="timeline-presets" role="group" aria-label="Custom timeline recipe">
              <button type="button" data-timeline-preset="active" aria-pressed="false">
                <svg viewBox="0 0 80 32" aria-hidden="true"><path d="M3 28C22 28 20 5 42 9s18-5 35-5" /></svg>
                <span><strong>Active curve</strong><small id="active-timeline-name">Capture active</small></span>
              </button>
              <button class="active" type="button" data-timeline-preset="wobble" aria-pressed="true">
                <svg viewBox="0 0 80 32" aria-hidden="true"><path d="M3 28C10 28 12 4 40 4s30 24 37 24" /></svg>
                <span><strong>Sine wobble</strong><small>Smooth 0→1→0</small></span>
              </button>
              <button type="button" data-timeline-preset="steps" aria-pressed="false">
                <svg viewBox="0 0 80 32" aria-hidden="true"><path d="M3 28h10v-6h10v-6h10v-6h14v6h10v6h10v6h10" /></svg>
                <span><strong>Stepped timeline</strong><small>Five levels</small></span>
              </button>
              <button type="button" data-timeline-preset="bounce" aria-pressed="false">
                <svg viewBox="0 0 80 32" aria-hidden="true"><path d="M3 28c8 0 4-24 25-24 8 0 5 9 12 9s4-9 12-9c21 0 17 24 25 24" /></svg>
                <span><strong>Bounce timeline</strong><small>Bounce at 1 and 0</small></span>
              </button>
            </div>
            <code id="timeline-code">compose(sineInOut, triangle)</code>
          </section>
        </div>
      </div>
      <div class="curve-grid" id="curve-grid"></div>
      <p class="empty-state" id="empty-state" hidden>No curves match that search.</p>
    </section>

    <section class="workshop-section" id="workshop" aria-labelledby="workshop-title">
      <div class="workshop-intro">
        <div class="workshop-heading">
          <p class="section-kicker light">Constructors</p>
          <h2 id="workshop-title">Configured curves</h2>
        </div>
        <div class="workshop-guide">
          <p>Examples built with the package's constructors and combinators.</p>
          <div class="workshop-instruction">
            <span class="instruction-number">01</span>
            <span><strong>Select an example</strong><small>Inspect it in the active player. Use Play when auto-play is off.</small></span>
            <span class="instruction-arrow" aria-hidden="true">↓</span>
          </div>
        </div>
      </div>
      <div class="recipe-grid" id="recipe-grid"></div>
    </section>

    <section class="advanced-section" id="advanced" aria-labelledby="advanced-title">
      <header class="advanced-heading">
        <div>
          <p class="section-kicker">Advanced API</p>
          <h2 id="advanced-title">Tune a constructor</h2>
        </div>
        <p>Choose a function, adjust its inputs, and use the generated curve anywhere else on the page.</p>
      </header>
      <div class="advanced-workbench" data-advanced-curve="advanced-live">
        <div class="advanced-recipes" id="advanced-recipes" role="tablist" aria-label="Advanced easing functions"></div>
        <article class="advanced-stage" aria-labelledby="advanced-name">
          <div class="advanced-stage-heading">
            <div>
              <code id="advanced-api" data-copyable>spring(options)</code>
              <h3 id="advanced-name">Damped spring</h3>
            </div>
            <span id="advanced-category">Physics</span>
          </div>
          <p id="advanced-description"></p>
          <div class="advanced-visuals">
            <div class="advanced-preview" id="advanced-preview"></div>
            <div class="advanced-curve-readout">
              <span>Curve shape</span>
              <svg viewBox="0 0 120 64" role="img" aria-label="Current advanced curve shape">
                <path class="mini-grid" d="M8 56H112M8 56V8" />
                <path class="mini-reference" d="M8 56L112 8" />
                <path class="mini-curve" id="advanced-static-path" />
              </svg>
              <span aria-hidden="true"><span>0</span><span>1</span></span>
            </div>
          </div>
          <dl class="advanced-samples" id="advanced-samples" aria-label="Sample curve outputs"></dl>
          <div class="advanced-actions">
            <button class="advanced-use" id="advanced-use" type="button">Use in active player <span aria-hidden="true">↗</span></button>
            <button class="advanced-play" type="button" data-play-id="advanced-live" data-player-name="advanced curve" aria-pressed="false">
              <span class="play-label">Play preview</span><span class="pause-label">Pause preview</span>
              <svg class="play-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="m5 3 9 6-9 6z" /></svg>
              <svg class="pause-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3h3v12H5zm5 0h3v12h-3z" /></svg>
            </button>
          </div>
        </article>
        <aside class="advanced-editor" aria-label="Constructor inputs and generated code">
          <div class="advanced-controls-heading"><span>Inputs</span><button id="advanced-reset" type="button">Reset</button></div>
          <div class="advanced-controls" id="advanced-controls"></div>
          <div class="advanced-code">
            <div><span>Generated TypeScript</span><button id="advanced-copy" type="button">Copy</button></div>
            <pre><code id="advanced-code" data-copyable></code></pre>
          </div>
        </aside>
      </div>
    </section>

    <section class="utility-section" id="utilities" aria-labelledby="utilities-title">
      <div>
        <p class="section-kicker">Utilities</p>
        <h2 id="utilities-title">Transform a curve</h2>
        <p>Preview an operation or apply it to the active curve.</p>
      </div>
      <div class="utility-list" id="utility-list"></div>
    </section>
  </main>

  <aside class="curve-companion visible" id="curve-companion" aria-label="Active curve player">
    <button class="companion-close" id="companion-close" type="button" aria-label="Close active curve player">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8" /></svg>
    </button>
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
    <p>Built with <a href="https://github.com/bluehexagons/easing" target="_blank" rel="noreferrer">@bluehexagons/easing</a>.</p>
    <p class="footer-note">TypeScript · No runtime dependencies beyond the curves</p>
  </footer>
`;

initializePlayground();
