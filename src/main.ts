import type { EasingFunction } from '@bluehexagons/easing';
import {
  customCurve,
  namedCurves,
  utilityRecipes,
  workshopRecipes,
  type CurveDefinition,
  type CurveGroup,
} from './curves';
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

    <section class="playground" aria-labelledby="playground-title">
      <div class="playground-topline">
        <div>
          <p class="section-kicker">Live playground</p>
          <h2 id="playground-title">Feel the curve</h2>
        </div>
        <div class="live-indicator"><span></span> Interactive preview</div>
      </div>

      <div class="playground-grid">
        <article class="motion-panel">
          <div class="motion-stage" id="motion-stage">
            <div class="stage-labels"><span>0</span><span>time</span><span>1</span></div>
            <div class="track">
              <div class="track-line"></div>
              <div class="runner" id="runner"><span></span></div>
            </div>
            <div class="ghost-track" aria-hidden="true">
              <div class="ghost ghost-one"></div>
              <div class="ghost ghost-two"></div>
              <div class="ghost ghost-three"></div>
            </div>
          </div>

          <div class="transport">
            <button class="play-button" id="play-button" type="button" aria-label="Play animation">
              <svg class="play-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="m5 3 9 6-9 6z" /></svg>
              <svg class="pause-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3h3v12H5zm5 0h3v12h-3z" /></svg>
            </button>
            <label class="scrubber">
              <span class="sr-only">Animation progress</span>
              <input id="progress" type="range" min="0" max="1" value="0" step="0.001" />
            </label>
            <output id="time-output" for="progress">0.000</output>
          </div>
        </article>

        <article class="graph-panel">
          <div class="graph-heading">
            <div>
              <p class="section-kicker">Selected curve</p>
              <h3 id="selected-name">Cubic In Out</h3>
            </div>
            <div class="value-readout">
              <span>output</span>
              <strong id="value-output">0.000</strong>
            </div>
          </div>
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
        </article>

        <aside class="inspector" aria-label="Curve inspector">
          <div>
            <p class="section-kicker">Inspector</p>
            <p class="curve-description" id="curve-description"></p>
          </div>
          <label class="control-row" for="duration">
            <span>Duration</span>
            <output id="duration-output" for="duration">1200 ms</output>
          </label>
          <input id="duration" type="range" min="300" max="3000" value="1200" step="50" />
          <div class="code-card">
            <div class="code-topline"><span>TypeScript</span><button id="copy-code" type="button">Copy</button></div>
            <pre><code id="code-output"></code></pre>
          </div>
        </aside>
      </div>
    </section>

    <section class="curves-section" id="curves" aria-labelledby="curves-title">
      <div class="section-header">
        <div>
          <p class="section-kicker">The collection</p>
          <h2 id="curves-title">Find your rhythm</h2>
          <p>Every parameter-free curve in the package, ready to audition.</p>
        </div>
        <label class="search-box">
          <span class="sr-only">Search curves</span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
          <input id="curve-search" type="search" placeholder="Search curves" autocomplete="off" />
        </label>
      </div>
      <div class="filters" role="group" aria-label="Filter curve collection">
        <button class="filter active" type="button" data-filter="all">All <span>${namedCurves.length}</span></button>
        <button class="filter" type="button" data-filter="classic">Classic</button>
        <button class="filter" type="button" data-filter="smooth">Smooth</button>
        <button class="filter" type="button" data-filter="expressive">Expressive</button>
      </div>
      <div class="curve-grid" id="curve-grid"></div>
      <p class="empty-state" id="empty-state" hidden>No curves match that search.</p>
    </section>

    <section class="workshop-section" id="workshop" aria-labelledby="workshop-title">
      <div class="workshop-intro">
        <p class="section-kicker light">Beyond the presets</p>
        <h2 id="workshop-title">Build something<br /><em>with character.</em></h2>
        <p>The library is more than a list of equations. Its constructors and combinators make new curves from a few expressive ingredients.</p>
        <div class="workshop-arrow" aria-hidden="true"><span>try a recipe</span><svg viewBox="0 0 100 45"><path d="M2 5c20 35 58 31 88 17m-11-9 12 9-10 10" /></svg></div>
      </div>
      <div class="recipe-grid" id="recipe-grid"></div>
    </section>

    <section class="utility-section" aria-labelledby="utilities-title">
      <div>
        <p class="section-kicker">Small tools, big range</p>
        <h2 id="utilities-title">Compose your own</h2>
      </div>
      <div class="utility-list" id="utility-list"></div>
    </section>
  </main>

  <footer>
    <div class="footer-mark" aria-hidden="true">
      <svg viewBox="0 0 72 72"><path d="M8 55c18 0 14-38 32-38 12 0 10 28 24 22" /></svg>
    </div>
    <p>Made to explore <a href="https://github.com/bluehexagons/easing" target="_blank" rel="noreferrer">@bluehexagons/easing</a>.</p>
    <p class="footer-note">TypeScript · No runtime dependencies beyond the curves</p>
  </footer>
`;

const select = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Element not found: ${selector}`);
  return element;
};

const selectedName = select<HTMLElement>('#selected-name');
const curveDescription = select<HTMLElement>('#curve-description');
const codeOutput = select<HTMLElement>('#code-output');
const valueOutput = select<HTMLOutputElement>('#value-output');
const timeOutput = select<HTMLOutputElement>('#time-output');
const durationOutput = select<HTMLOutputElement>('#duration-output');
const progressInput = select<HTMLInputElement>('#progress');
const durationInput = select<HTMLInputElement>('#duration');
const playButton = select<HTMLButtonElement>('#play-button');
const runner = select<HTMLElement>('#runner');
const motionStage = select<HTMLElement>('#motion-stage');
const graphPath = select<SVGPathElement>('#graph-path');
const graphShadow = select<SVGPathElement>('#graph-shadow');
const graphMarker = select<SVGCircleElement>('#graph-marker');
const graphMarkerRing = select<SVGCircleElement>('#graph-marker-ring');
const graphGuide = select<SVGLineElement>('#graph-guide');
const graphGrid = select<SVGGElement>('#graph-grid');
const curveGrid = select<HTMLElement>('#curve-grid');
const recipeGrid = select<HTMLElement>('#recipe-grid');
const utilityList = select<HTMLElement>('#utility-list');
const emptyState = select<HTMLElement>('#empty-state');
const searchInput = select<HTMLInputElement>('#curve-search');

const initialCurve = namedCurves.find((curve) => curve.id === 'cubicInOut') ?? namedCurves[0];
if (!initialCurve) throw new Error('No easing curves were loaded');
let currentCurve: CurveDefinition = initialCurve;
let activeFilter: CurveGroup = 'all';
let progress = 0;
let duration = Number(durationInput.value);
let animationFrame: number | undefined;
let animationStarted = 0;
let graphRange = { min: 0, max: 1 };

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ??
      character,
  );

const finiteValue = (fn: EasingFunction, time: number): number => {
  const value = fn(time);
  return Number.isFinite(value) ? value : 0;
};

const miniPath = (fn: EasingFunction): string => {
  const points: string[] = [];
  for (let index = 0; index <= 48; index += 1) {
    const time = index / 48;
    const value = finiteValue(fn, time);
    const x = 8 + time * 104;
    const y = 56 - Math.max(-0.2, Math.min(1.2, value)) * 48;
    points.push(`${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.join('');
};

const drawGrid = (): void => {
  const horizontal = [34, 89, 144, 199, 254]
    .map((y) => `<line x1="44" y1="${y}" x2="524" y2="${y}" />`)
    .join('');
  const vertical = [44, 164, 284, 404, 524]
    .map((x) => `<line x1="${x}" y1="34" x2="${x}" y2="254" />`)
    .join('');
  graphGrid.innerHTML = horizontal + vertical;
};

const drawGraph = (): void => {
  const samples = Array.from({ length: 181 }, (_, index) => ({
    time: index / 180,
    value: finiteValue(currentCurve.fn, index / 180),
  }));
  const values = samples.map(({ value }) => value);
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(1, ...values);
  const padding = Math.max(0.04, (rawMax - rawMin) * 0.1);
  graphRange = { min: rawMin - padding, max: rawMax + padding };

  const path = samples
    .map(({ time, value }, index) => {
      const x = 44 + time * 480;
      const y = 254 - ((value - graphRange.min) / (graphRange.max - graphRange.min)) * 220;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join('');
  graphPath.setAttribute('d', path);
  graphShadow.setAttribute('d', path);
};

const updateProgress = (nextProgress: number): void => {
  progress = Math.max(0, Math.min(1, nextProgress));
  const value = finiteValue(currentCurve.fn, progress);
  const displayValue = Math.max(-0.2, Math.min(1.2, value));
  const runnerPosition = 7 + ((displayValue + 0.2) / 1.4) * 86;
  runner.style.left = `${runnerPosition}%`;
  runner.style.setProperty('--runner-scale', `${1 + Math.sin(progress * Math.PI) * 0.12}`);
  motionStage.style.setProperty('--motion-value', String(displayValue));
  progressInput.value = String(progress);
  progressInput.style.setProperty('--range-progress', `${progress * 100}%`);
  timeOutput.value = progress.toFixed(3);
  valueOutput.value = value.toFixed(3);

  const markerX = 44 + progress * 480;
  const markerY = 254 - ((value - graphRange.min) / (graphRange.max - graphRange.min)) * 220;
  for (const marker of [graphMarker, graphMarkerRing]) {
    marker.setAttribute('cx', markerX.toFixed(2));
    marker.setAttribute('cy', markerY.toFixed(2));
  }
  graphGuide.setAttribute('x1', markerX.toFixed(2));
  graphGuide.setAttribute('x2', markerX.toFixed(2));
  graphGuide.setAttribute('y1', markerY.toFixed(2));
  graphGuide.setAttribute('y2', '254');
};

const stopAnimation = (): void => {
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
  animationFrame = undefined;
  playButton.classList.remove('playing');
  playButton.setAttribute('aria-label', 'Play animation');
};

const tick = (timestamp: number): void => {
  const elapsed = timestamp - animationStarted;
  updateProgress(Math.min(1, elapsed / duration));
  if (elapsed < duration) {
    animationFrame = requestAnimationFrame(tick);
  } else {
    stopAnimation();
  }
};

const play = (): void => {
  stopAnimation();
  updateProgress(0);
  animationStarted = performance.now();
  playButton.classList.add('playing');
  playButton.setAttribute('aria-label', 'Pause animation');
  animationFrame = requestAnimationFrame(tick);
};

const updateCurveCards = (): void => {
  document.querySelectorAll<HTMLButtonElement>('.curve-card').forEach((card) => {
    const isSelected = card.dataset['curve'] === currentCurve.id;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', String(isSelected));
  });
  document.querySelectorAll<HTMLButtonElement>('.recipe-card').forEach((card) => {
    const isSelected = `recipe-${card.dataset['recipe']}` === currentCurve.id;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', String(isSelected));
  });
};

const selectCurve = (curve: CurveDefinition, shouldPlay = true): void => {
  currentCurve = curve;
  selectedName.textContent = curve.name;
  curveDescription.textContent = curve.description;
  codeOutput.textContent = curve.code;
  drawGraph();
  updateProgress(0);
  updateCurveCards();
  if (shouldPlay) play();
};

const renderCurves = (): void => {
  const query = searchInput.value.trim().toLowerCase();
  const visible = namedCurves.filter(
    (curve) =>
      (activeFilter === 'all' || curve.group === activeFilter) &&
      `${curve.name} ${curve.shortName} ${curve.description}`.toLowerCase().includes(query),
  );
  curveGrid.innerHTML = visible
    .map(
      (curve) => `
        <button class="curve-card${curve.id === currentCurve.id ? ' selected' : ''}" type="button" data-curve="${curve.id}" aria-pressed="${curve.id === currentCurve.id}">
          <span class="curve-card-top"><span>${escapeHtml(curve.name)}</span><span class="curve-arrow">↗</span></span>
          <svg viewBox="0 0 120 64" aria-hidden="true">
            <path class="mini-grid" d="M8 56H112M8 56V8" />
            <path class="mini-reference" d="M8 56L112 8" />
            <path class="mini-curve" d="${miniPath(curve.fn)}" />
          </svg>
          <span class="curve-family">${escapeHtml(curve.group)}</span>
        </button>`,
    )
    .join('');
  emptyState.hidden = visible.length > 0;
};

const renderRecipes = (): void => {
  recipeGrid.innerHTML = workshopRecipes
    .map(
      (recipe, index) => `
        <button class="recipe-card" type="button" data-recipe="${recipe.id}" aria-pressed="false">
          <span class="recipe-number">${String(index + 1).padStart(2, '0')}</span>
          <span class="recipe-copy">
            <span class="recipe-eyebrow">${escapeHtml(recipe.eyebrow)}</span>
            <strong>${escapeHtml(recipe.name)}</strong>
            <span>${escapeHtml(recipe.description)}</span>
          </span>
          <svg viewBox="0 0 120 64" aria-hidden="true"><path d="${miniPath(recipe.build())}" /></svg>
        </button>`,
    )
    .join('');
};

const renderUtilities = (): void => {
  utilityList.innerHTML = utilityRecipes
    .map(
      (recipe, index) => `
        <button type="button" data-utility="${index}">
          <svg viewBox="0 0 80 42" aria-hidden="true"><path d="${miniPath(recipe.fn)}" /></svg>
          <span><strong>${escapeHtml(recipe.name)}</strong><code>${escapeHtml(recipe.code)}</code></span>
          <span class="utility-plus">+</span>
        </button>`,
    )
    .join('');
};

playButton.addEventListener('click', () => {
  if (animationFrame !== undefined) stopAnimation();
  else play();
});

progressInput.addEventListener('input', () => {
  stopAnimation();
  updateProgress(Number(progressInput.value));
});

durationInput.addEventListener('input', () => {
  duration = Number(durationInput.value);
  durationOutput.value = `${duration} ms`;
  durationInput.style.setProperty(
    '--range-progress',
    `${((duration - 300) / (3000 - 300)) * 100}%`,
  );
});

curveGrid.addEventListener('click', (event) => {
  const card = (event.target as Element).closest<HTMLButtonElement>('[data-curve]');
  if (!card) return;
  const curve = namedCurves.find(({ id }) => id === card.dataset['curve']);
  if (curve) selectCurve(curve);
});

recipeGrid.addEventListener('click', (event) => {
  const card = (event.target as Element).closest<HTMLButtonElement>('[data-recipe]');
  if (!card) return;
  const recipe = workshopRecipes.find(({ id }) => id === card.dataset['recipe']);
  if (!recipe) return;
  selectCurve(customCurve(recipe));
  document.querySelector('.playground')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

utilityList.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-utility]');
  if (!button) return;
  const index = Number(button.dataset['utility']);
  const utility = utilityRecipes[index];
  if (!utility) return;
  selectCurve({
    id: `utility-${index}`,
    name: utility.name,
    shortName: utility.name,
    group: 'classic',
    description: `A focused example of the ${utility.name.toLowerCase()} utility.`,
    fn: utility.fn,
    code: `import { /* curves and utilities */ } from '@bluehexagons/easing';\n\nconst curve = ${utility.code};`,
    custom: true,
  });
  document.querySelector('.playground')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.querySelector('.filters')?.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-filter]');
  if (!button) return;
  activeFilter = (button.dataset['filter'] ?? 'all') as CurveGroup;
  document.querySelectorAll<HTMLButtonElement>('.filter').forEach((filter) => {
    filter.classList.toggle('active', filter === button);
  });
  renderCurves();
});

searchInput.addEventListener('input', renderCurves);

select<HTMLButtonElement>('#copy-code').addEventListener('click', async (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  try {
    await navigator.clipboard.writeText(currentCurve.code);
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Select text';
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(codeOutput);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  window.setTimeout(() => {
    button.textContent = 'Copy';
  }, 1600);
});

window.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  if (event.code !== 'Space' || ['INPUT', 'BUTTON', 'TEXTAREA'].includes(target.tagName)) return;
  event.preventDefault();
  if (animationFrame === undefined) play();
  else stopAnimation();
});

drawGrid();
renderCurves();
renderRecipes();
renderUtilities();
durationInput.dispatchEvent(new Event('input'));
selectCurve(currentCurve, false);

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.setTimeout(play, 500);
}
