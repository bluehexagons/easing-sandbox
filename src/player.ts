import type { EasingFunction } from '@bluehexagons/easing';
import {
  customCurve,
  namedCurves,
  utilityRecipes,
  workshopRecipes,
  type CurveDefinition,
  type CurveGroup,
} from './curves';

const select = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Element not found: ${selector}`);
  return element;
};

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ??
      character,
  );

const finiteValue = (fn: EasingFunction, time: number): number => {
  try {
    const value = fn(time);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
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

const previewMarkup = (curve: CurveDefinition): string => `
  <span class="preview-visualization" data-preview-id="${curve.id}" aria-hidden="true">
    <svg class="preview-scene preview-curve-scene" data-preview-scene="curve" viewBox="0 0 120 64">
      <path class="mini-grid" d="M8 56H112M8 56V8" />
      <path class="mini-reference" d="M8 56L112 8" />
      <path class="mini-curve" d="${miniPath(curve.fn)}" />
      <line class="card-player-guide" data-preview-guide x1="8" x2="8" y1="56" y2="56" />
      <circle class="card-player-ring" data-preview-marker cx="8" cy="56" r="4.5" />
      <circle class="card-player-marker" data-preview-marker cx="8" cy="56" r="2.5" />
    </svg>
    <span class="preview-scene preview-move-scene" data-preview-scene="move">
      <span class="preview-rail"><span class="preview-mover">→</span></span>
    </span>
    <span class="preview-scene preview-scale-scene" data-preview-scene="scale">
      <span class="preview-scale-guide"></span><span class="preview-scale-object"></span>
    </span>
    <span class="preview-scene preview-rotate-scene" data-preview-scene="rotate">
      <span class="preview-orbit"></span><span class="preview-rotate-object">↗</span>
    </span>
  </span>`;

export const initializePlayground = (): void => {
  const curveDescription = select<HTMLElement>('#curve-description');
  const codeOutput = select<HTMLElement>('#code-output');
  const valueOutput = select<HTMLElement>('#value-output');
  const timeOutput = select<HTMLOutputElement>('#time-output');
  const durationOutput = select<HTMLOutputElement>('#duration-output');
  const progressInput = select<HTMLInputElement>('#progress');
  const durationInput = select<HTMLInputElement>('#duration');
  const loopInput = select<HTMLInputElement>('#loop-playback');
  const playingCount = select<HTMLOutputElement>('#playing-count');
  const stopAllButton = select<HTMLButtonElement>('#stop-all');
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
  const companion = select<HTMLElement>('#curve-companion');
  const companionName = select<HTMLElement>('#companion-name');
  const companionTime = select<HTMLOutputElement>('#companion-time');
  const companionValue = select<HTMLOutputElement>('#companion-value');
  const companionPath = select<SVGPathElement>('#companion-path');
  const companionMarker = select<SVGCircleElement>('#companion-marker');
  const companionMarkerRing = select<SVGCircleElement>('#companion-marker-ring');
  const companionPlayButton = select<HTMLButtonElement>('#companion-play');
  const companionDetailsButton = select<HTMLButtonElement>('#companion-details');
  const sandboxCode = select<HTMLTextAreaElement>('#sandbox-code');
  const sandboxStatus = select<HTMLOutputElement>('#sandbox-status');
  const runSandboxButton = select<HTMLButtonElement>('#run-sandbox');

  const recipeCurves = workshopRecipes.map(customCurve);
  const utilityCurves: CurveDefinition[] = utilityRecipes.map((utility, index) => ({
    id: `utility-${index}`,
    name: utility.name,
    shortName: utility.name,
    group: 'classic',
    description: `A focused example of the ${utility.name.toLowerCase()} operation.`,
    fn: utility.fn,
    code: `import { /* curves and utilities */ } from '@bluehexagons/easing';\n\nconst curve = ${utility.code};`,
    custom: true,
  }));
  const playerDefinitions = new Map<string, CurveDefinition>();
  for (const curve of [...namedCurves, ...recipeCurves, ...utilityCurves]) {
    playerDefinitions.set(curve.id, curve);
  }

  const initialCurve = namedCurves.find((curve) => curve.id === 'cubicInOut') ?? namedCurves[0];
  if (!initialCurve) throw new Error('No easing curves were loaded');
  let currentCurve: CurveDefinition = initialCurve;
  let activeFilter: CurveGroup = 'all';
  let progress = 0;
  let duration = Number(durationInput.value);
  let loopPlayback = loopInput.checked;
  let animationFrame: number | undefined;
  let animationStarted = 0;
  let graphRange = { min: 0, max: 1 };
  let companionExpanded = false;
  let customCurveIndex = 0;
  const playingIds = new Set<string>();
  const playerProgress = new Map<string, number>([[initialCurve.id, 0]]);

  document.documentElement.dataset['previewMode'] = 'move';

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

  const updatePreview = (curve: CurveDefinition, time: number): void => {
    const value = finiteValue(curve.fn, time);
    const displayValue = Math.max(-0.2, Math.min(1.2, value));
    const position = Math.max(0, Math.min(1, value));
    const x = 8 + time * 104;
    const y = 56 - displayValue * 48;
    document.querySelectorAll<HTMLElement>(`[data-preview-id="${curve.id}"]`).forEach((preview) => {
      preview.style.setProperty('--preview-position', `${position * 100}%`);
      preview.style.setProperty(
        '--preview-scale',
        String(Math.max(0.25, Math.min(1.5, 0.4 + value))),
      );
      preview.style.setProperty('--preview-rotation', `${value * 300}deg`);
      const guide = preview.querySelector<SVGLineElement>('[data-preview-guide]');
      guide?.setAttribute('x1', x.toFixed(2));
      guide?.setAttribute('x2', x.toFixed(2));
      guide?.setAttribute('y1', y.toFixed(2));
      preview.querySelectorAll<SVGCircleElement>('[data-preview-marker]').forEach((marker) => {
        marker.setAttribute('cx', x.toFixed(2));
        marker.setAttribute('cy', y.toFixed(2));
      });
    });
  };

  const updateActiveCompanion = (): void => {
    const activeProgress = playerProgress.get(currentCurve.id) ?? 0;
    const value = finiteValue(currentCurve.fn, activeProgress);
    const displayValue = Math.max(-0.2, Math.min(1.2, value));
    progressInput.value = String(activeProgress);
    progressInput.style.setProperty('--range-progress', `${activeProgress * 100}%`);
    timeOutput.value = activeProgress.toFixed(3);
    valueOutput.textContent = value.toFixed(3);
    companionTime.value = activeProgress.toFixed(3);
    companionValue.value = value.toFixed(3);

    const companionX = 8 + activeProgress * 104;
    const companionY = 56 - displayValue * 48;
    for (const marker of [companionMarker, companionMarkerRing]) {
      marker.setAttribute('cx', companionX.toFixed(2));
      marker.setAttribute('cy', companionY.toFixed(2));
    }

    const markerX = 44 + activeProgress * 480;
    const markerY = 254 - ((value - graphRange.min) / (graphRange.max - graphRange.min)) * 220;
    for (const marker of [graphMarker, graphMarkerRing]) {
      marker.setAttribute('cx', markerX.toFixed(2));
      marker.setAttribute('cy', markerY.toFixed(2));
    }
    graphGuide.setAttribute('x1', markerX.toFixed(2));
    graphGuide.setAttribute('x2', markerX.toFixed(2));
    graphGuide.setAttribute('y1', markerY.toFixed(2));
    graphGuide.setAttribute('y2', '254');
    updatePreview(currentCurve, activeProgress);
  };

  const refreshVisiblePreviews = (): void => {
    const visibleIds = new Set(
      [...document.querySelectorAll<HTMLElement>('[data-preview-id]')].map(
        (preview) => preview.dataset['previewId'] ?? '',
      ),
    );
    for (const id of visibleIds) {
      const curve = playerDefinitions.get(id);
      if (curve) updatePreview(curve, playerProgress.get(curve.id) ?? 0);
    }
  };

  const updateSelectionState = (): void => {
    document.querySelectorAll<HTMLElement>('.curve-card').forEach((card) => {
      const selected = card.dataset['curve'] === currentCurve.id;
      card.classList.toggle('selected', selected);
      card
        .querySelector<HTMLButtonElement>('[data-select-curve]')
        ?.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll<HTMLElement>('.recipe-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset['playId'] === currentCurve.id);
    });
    document.querySelectorAll<HTMLElement>('.utility-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset['utilityId'] === currentCurve.id);
    });
  };

  const updatePlaybackControls = (): void => {
    const activePlaying = playingIds.has(currentCurve.id);
    companionPlayButton.classList.toggle('playing', activePlaying);
    companionPlayButton.setAttribute(
      'aria-label',
      activePlaying ? 'Pause active curve' : 'Play active curve',
    );
    document.querySelectorAll<HTMLButtonElement>('[data-play-id]').forEach((button) => {
      const id = button.dataset['playId'] ?? '';
      const playing = playingIds.has(id);
      const name = button.dataset['playerName'] ?? 'curve';
      button.classList.toggle('playing', playing);
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${name}`);
      const actionLabel = button.querySelector<HTMLElement>('[data-play-label]');
      if (actionLabel) actionLabel.textContent = playing ? 'Pause' : 'Load + play';
    });
    document.querySelectorAll<HTMLElement>('.curve-card').forEach((card) => {
      card.classList.toggle('playing', playingIds.has(card.dataset['curve'] ?? ''));
    });
    document.querySelectorAll<HTMLElement>('.utility-card').forEach((card) => {
      card.classList.toggle('playing', playingIds.has(card.dataset['utilityId'] ?? ''));
    });
    playingCount.value = String(playingIds.size);
    stopAllButton.disabled = playingIds.size === 0;
  };

  const selectCurve = (curve: CurveDefinition): void => {
    const previousHasControl = [...document.querySelectorAll<HTMLElement>('[data-play-id]')].some(
      (control) => control.dataset['playId'] === currentCurve.id,
    );
    if (currentCurve.id !== curve.id && currentCurve.custom && !previousHasControl) {
      playingIds.delete(currentCurve.id);
    }
    playerDefinitions.set(curve.id, curve);
    if (!playerProgress.has(curve.id)) playerProgress.set(curve.id, 0);
    currentCurve = curve;
    companionName.textContent = curve.name;
    companionPath.setAttribute('d', miniPath(curve.fn));
    curveDescription.textContent = curve.description;
    codeOutput.textContent = curve.code;
    drawGraph();
    updateSelectionState();
    updatePlaybackControls();
    updateActiveCompanion();
  };

  const renderPlayingFrame = (): void => {
    for (const id of playingIds) {
      const curve = playerDefinitions.get(id);
      if (curve) updatePreview(curve, playerProgress.get(id) ?? progress);
    }
    updateActiveCompanion();
  };

  const tick = (timestamp: number): void => {
    if (playingIds.size === 0) {
      animationFrame = undefined;
      return;
    }
    let elapsed = timestamp - animationStarted;
    if (loopPlayback && elapsed >= duration) {
      const completedCycles = Math.floor(elapsed / duration);
      animationStarted += completedCycles * duration;
      elapsed -= completedCycles * duration;
    }
    progress = Math.min(1, elapsed / duration);
    for (const id of playingIds) playerProgress.set(id, progress);
    renderPlayingFrame();

    if (!loopPlayback && elapsed >= duration) {
      playingIds.clear();
      animationFrame = undefined;
      updatePlaybackControls();
      return;
    }
    animationFrame = requestAnimationFrame(tick);
  };

  const ensureClock = (): void => {
    if (animationFrame !== undefined || playingIds.size === 0) return;
    animationStarted = performance.now() - progress * duration;
    animationFrame = requestAnimationFrame(tick);
  };

  const togglePlayer = (curve: CurveDefinition): void => {
    selectCurve(curve);
    if (playingIds.has(curve.id)) {
      playingIds.delete(curve.id);
      if (playingIds.size === 0 && animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame);
        animationFrame = undefined;
      }
    } else {
      if (playingIds.size === 0) {
        const savedProgress = playerProgress.get(curve.id) ?? 0;
        progress = savedProgress >= 1 ? 0 : savedProgress;
        animationStarted = performance.now() - progress * duration;
      }
      playerProgress.set(curve.id, progress);
      playingIds.add(curve.id);
      ensureClock();
    }
    updatePlaybackControls();
    updatePreview(curve, playerProgress.get(curve.id) ?? 0);
    updateActiveCompanion();
  };

  const stopAllPlayers = (): void => {
    playingIds.clear();
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    updatePlaybackControls();
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
          <article class="curve-card" data-curve="${curve.id}">
            <button class="curve-card-select" type="button" data-select-curve="${curve.id}" aria-pressed="false" aria-label="Select ${escapeHtml(curve.name)}">
              <span class="curve-card-top"><span>${escapeHtml(curve.name)}</span><span class="curve-arrow">↗</span></span>
              ${previewMarkup(curve)}
            </button>
            <div class="curve-card-footer">
              <span class="curve-family">${escapeHtml(curve.group)}</span>
              <button class="curve-card-play" type="button" data-play-id="${curve.id}" data-player-name="${escapeHtml(curve.name)}" aria-pressed="false">
                <span class="play-label">Play</span><span class="pause-label">Pause</span>
                <svg class="play-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="m5 3 9 6-9 6z" /></svg>
                <svg class="pause-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3h3v12H5zm5 0h3v12h-3z" /></svg>
              </button>
            </div>
          </article>`,
      )
      .join('');
    emptyState.hidden = visible.length > 0;
    updateSelectionState();
    updatePlaybackControls();
    refreshVisiblePreviews();
  };

  const renderRecipes = (): void => {
    recipeGrid.innerHTML = workshopRecipes
      .map((recipe, index) => {
        const curve = recipeCurves[index];
        if (!curve) return '';
        return `
          <button class="recipe-card" type="button" data-recipe="${recipe.id}" data-play-id="${curve.id}" data-player-name="${escapeHtml(curve.name)}" aria-pressed="false">
            <span class="recipe-number">${String(index + 1).padStart(2, '0')}</span>
            ${previewMarkup(curve)}
            <span class="recipe-copy">
              <span class="recipe-eyebrow">${escapeHtml(recipe.eyebrow)}</span>
              <strong>${escapeHtml(recipe.name)}</strong>
              <span>${escapeHtml(recipe.description)}</span>
            </span>
            <span class="recipe-action"><span data-play-label>Load + play</span><span aria-hidden="true">→</span></span>
          </button>`;
      })
      .join('');
    updateSelectionState();
    updatePlaybackControls();
    refreshVisiblePreviews();
  };

  const renderUtilities = (): void => {
    utilityList.innerHTML = utilityRecipes
      .map((utility, index) => {
        const curve = utilityCurves[index];
        if (!curve) return '';
        return `
          <article class="utility-card" data-utility-id="${curve.id}">
            ${previewMarkup(curve)}
            <span class="utility-copy"><strong>${escapeHtml(utility.name)}</strong><code>${escapeHtml(utility.code)}</code></span>
            <button class="utility-play" type="button" data-play-id="${curve.id}" data-player-name="${escapeHtml(curve.name)}" aria-pressed="false">
              <span class="play-label">Play</span><span class="pause-label">Pause</span>
              <svg class="play-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="m5 3 9 6-9 6z" /></svg>
              <svg class="pause-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3h3v12H5zm5 0h3v12h-3z" /></svg>
            </button>
            <button class="utility-apply" type="button" data-apply-utility="${index}">Apply to active <span aria-hidden="true">+</span></button>
          </article>`;
      })
      .join('');
    updateSelectionState();
    updatePlaybackControls();
    refreshVisiblePreviews();
  };

  companionPlayButton.addEventListener('click', () => togglePlayer(currentCurve));

  companionDetailsButton.addEventListener('click', () => {
    companionExpanded = !companionExpanded;
    companion.classList.toggle('expanded', companionExpanded);
    companionDetailsButton.setAttribute('aria-expanded', String(companionExpanded));
    companionDetailsButton.querySelector('span')!.textContent = companionExpanded
      ? 'Compact'
      : 'Details';
  });

  progressInput.addEventListener('input', () => {
    progress = Number(progressInput.value);
    playerProgress.set(currentCurve.id, progress);
    for (const id of playingIds) playerProgress.set(id, progress);
    if (playingIds.size > 0) animationStarted = performance.now() - progress * duration;
    renderPlayingFrame();
  });

  durationInput.addEventListener('input', () => {
    duration = Number(durationInput.value);
    const seconds = duration / 1000;
    durationOutput.value =
      duration < 1000
        ? `${duration} ms`
        : `${seconds.toFixed(Number.isInteger(seconds) ? 0 : 1)} s`;
    durationInput.style.setProperty(
      '--range-progress',
      `${((duration - 300) / (30000 - 300)) * 100}%`,
    );
    if (playingIds.size > 0) animationStarted = performance.now() - progress * duration;
  });

  loopInput.addEventListener('change', () => {
    loopPlayback = loopInput.checked;
    if (playingIds.size > 0) animationStarted = performance.now() - progress * duration;
  });

  stopAllButton.addEventListener('click', stopAllPlayers);

  document.querySelector('.preview-modes')?.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-preview-mode]');
    if (!button) return;
    document.documentElement.dataset['previewMode'] = button.dataset['previewMode'] ?? 'curve';
    document.querySelectorAll<HTMLButtonElement>('[data-preview-mode]').forEach((modeButton) => {
      const active = modeButton === button;
      modeButton.classList.toggle('active', active);
      modeButton.setAttribute('aria-pressed', String(active));
    });
  });

  curveGrid.addEventListener('click', (event) => {
    const target = event.target as Element;
    const playButton = target.closest<HTMLButtonElement>('[data-play-id]');
    if (playButton) {
      const curve = playerDefinitions.get(playButton.dataset['playId'] ?? '');
      if (curve) togglePlayer(curve);
      return;
    }
    const selectButton = target.closest<HTMLButtonElement>('[data-select-curve]');
    const curve = selectButton
      ? playerDefinitions.get(selectButton.dataset['selectCurve'] ?? '')
      : undefined;
    if (curve) selectCurve(curve);
  });

  recipeGrid.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-play-id]');
    const curve = button ? playerDefinitions.get(button.dataset['playId'] ?? '') : undefined;
    if (curve) togglePlayer(curve);
  });

  utilityList.addEventListener('click', (event) => {
    const target = event.target as Element;
    const playButton = target.closest<HTMLButtonElement>('[data-play-id]');
    if (playButton) {
      const curve = playerDefinitions.get(playButton.dataset['playId'] ?? '');
      if (curve) togglePlayer(curve);
      return;
    }
    const applyButton = target.closest<HTMLButtonElement>('[data-apply-utility]');
    if (!applyButton) return;
    const index = Number(applyButton.dataset['applyUtility']);
    const utility = utilityRecipes[index];
    if (!utility) return;
    const baseCurve = currentCurve;
    const appliedCurve: CurveDefinition = {
      id: `applied-${index}-${customCurveIndex++}`,
      name: `${utility.name} · ${baseCurve.name}`,
      shortName: utility.name,
      group: 'expressive',
      description: `${utility.name} applied to ${baseCurve.name}.`,
      fn: utility.apply(baseCurve.fn),
      code: `// activeCurve is ${baseCurve.name}\nconst composedCurve = ${utility.code};`,
      custom: true,
    };
    togglePlayer(appliedCurve);
  });

  runSandboxButton.addEventListener('click', () => {
    const baseCurve = currentCurve;
    try {
      const evaluator = Function('time', 'curve', `"use strict";\n${sandboxCode.value}`) as (
        time: number,
        curve: EasingFunction,
      ) => unknown;
      for (let index = 0; index <= 20; index += 1) {
        const result = evaluator(index / 20, baseCurve.fn);
        if (typeof result !== 'number' || !Number.isFinite(result)) {
          throw new Error('The function must return a finite number.');
        }
      }
      const sandboxCurve: CurveDefinition = {
        id: `sandbox-${customCurveIndex++}`,
        name: `Sandbox · ${baseCurve.name}`,
        shortName: 'sandboxCurve',
        group: 'expressive',
        description: `An editable sandbox transformation based on ${baseCurve.name}.`,
        fn: (time) => {
          const result = evaluator(time, baseCurve.fn);
          return typeof result === 'number' && Number.isFinite(result) ? result : 0;
        },
        code: `const sandboxCurve = (time: number) => {\n${sandboxCode.value}\n};`,
        custom: true,
      };
      sandboxStatus.value = `Running with ${baseCurve.name}`;
      sandboxStatus.classList.remove('error');
      togglePlayer(sandboxCurve);
    } catch (error) {
      sandboxStatus.value = error instanceof Error ? error.message : 'Unable to run this function.';
      sandboxStatus.classList.add('error');
    }
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
    togglePlayer(currentCurve);
  });

  drawGrid();
  renderCurves();
  renderRecipes();
  renderUtilities();
  durationInput.dispatchEvent(new Event('input'));
  selectCurve(currentCurve);

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setTimeout(() => togglePlayer(currentCurve), 500);
  }
};
