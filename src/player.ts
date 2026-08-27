import type { EasingFunction } from '@bluehexagons/easing';
import {
  advancedRecipes,
  defaultAdvancedValues,
  type AdvancedRecipe,
  type AdvancedValues,
} from './advanced';
import {
  customCurve,
  namedCurves,
  utilityRecipes,
  workshopRecipes,
  type CurveDefinition,
  type CurveGroup,
} from './curves';
import {
  repeatPeriod,
  timelineFrame,
  timelinePresets,
  type RepeatStyle,
  type TimelineFrame,
  type TimelinePreset,
} from './timeline';

const repeatDescriptions: Record<RepeatStyle, string> = {
  loop: 'Runs from 0→1, then immediately starts again at 0.',
  rewind: 'Runs 0→1, then retraces the easing curve from 1→0.',
  alternate: 'Runs 0→1 in each direction, applying the same easing on both passes.',
  once: 'Runs from 0→1 once, then stops at the final value.',
  custom: 'Uses a curve or composition to control time across each repeating cycle.',
};

const durationContexts: Record<RepeatStyle, string> = {
  loop: 'Per pass',
  rewind: 'Per direction',
  alternate: 'Per direction',
  once: 'One pass',
  custom: 'Full cycle',
};

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

const graphPoint = (time: number, value: number): { x: number; y: number } => ({
  x: 8 + Math.max(0, Math.min(1, time)) * 104,
  y: 56 - Math.max(-0.2, Math.min(1.2, value)) * 48,
});

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
    <span class="preview-scene preview-color-scene" data-preview-scene="color">
      <span class="preview-color-start" aria-hidden="true"></span>
      <span class="preview-color-swatch" aria-hidden="true"></span>
      <span class="preview-color-end" aria-hidden="true"></span>
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
  const durationContext = select<HTMLElement>('#duration-context');
  const autoplayInput = select<HTMLInputElement>('#autoplay-visible');
  const repeatDescription = select<HTMLElement>('#repeat-description');
  const customTimeline = select<HTMLElement>('#custom-timeline');
  const timelineCode = select<HTMLElement>('#timeline-code');
  const activeTimelineName = select<HTMLElement>('#active-timeline-name');
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
  const advancedWorkbench = select<HTMLElement>('.advanced-workbench');
  const advancedRecipesElement = select<HTMLElement>('#advanced-recipes');
  const advancedPreview = select<HTMLElement>('#advanced-preview');
  const advancedControls = select<HTMLElement>('#advanced-controls');
  const advancedApi = select<HTMLElement>('#advanced-api');
  const advancedName = select<HTMLElement>('#advanced-name');
  const advancedCategory = select<HTMLElement>('#advanced-category');
  const advancedDescription = select<HTMLElement>('#advanced-description');
  const advancedPresets = select<HTMLElement>('#advanced-presets');
  const advancedFormation = select<HTMLElement>('#advanced-formation');
  const advancedSamples = select<HTMLElement>('#advanced-samples');
  const advancedStaticPath = select<SVGPathElement>('#advanced-static-path');
  const advancedShapeEditor = select<SVGSVGElement>('#advanced-shape-editor');
  const advancedHandleLines = select<SVGGElement>('#advanced-handle-lines');
  const advancedHandles = select<SVGGElement>('#advanced-handles');
  const advancedDragHint = select<HTMLElement>('#advanced-drag-hint');
  const advancedCode = select<HTMLElement>('#advanced-code');
  const advancedUseButton = select<HTMLButtonElement>('#advanced-use');
  const advancedResetButton = select<HTMLButtonElement>('#advanced-reset');
  const advancedRandomizeButton = select<HTMLButtonElement>('#advanced-randomize');
  const advancedCopyButton = select<HTMLButtonElement>('#advanced-copy');
  const advancedPlayButton = select<HTMLButtonElement>('.advanced-play');
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
  const companionCloseButton = select<HTMLButtonElement>('#companion-close');
  const sandboxCode = select<HTMLTextAreaElement>('#sandbox-code');
  const sandboxStatus = select<HTMLOutputElement>('#sandbox-status');
  const runSandboxButton = select<HTMLButtonElement>('#run-sandbox');

  const recipeCurves = workshopRecipes.map(customCurve);
  const utilityCurves: CurveDefinition[] = utilityRecipes.map((utility, index) => ({
    id: `utility-${index}`,
    name: utility.name,
    shortName: utility.name,
    group: 'classic',
    description: `Example output for ${utility.name.toLowerCase()}.`,
    fn: utility.fn,
    code: `import { /* curves and utilities */ } from '@bluehexagons/easing';\n\nconst curve = ${utility.code};`,
    custom: true,
  }));
  const initialAdvancedRecipe = advancedRecipes[0];
  if (!initialAdvancedRecipe) throw new Error('No advanced curve recipes were loaded');
  let activeAdvancedRecipe: AdvancedRecipe = initialAdvancedRecipe;
  let advancedValues: AdvancedValues = defaultAdvancedValues(activeAdvancedRecipe);
  const buildAdvancedCurve = (): CurveDefinition => ({
    id: 'advanced-live',
    name: activeAdvancedRecipe.name,
    shortName: activeAdvancedRecipe.api,
    group: 'expressive',
    description: activeAdvancedRecipe.description,
    fn: activeAdvancedRecipe.build(advancedValues),
    code: activeAdvancedRecipe.code(advancedValues),
    custom: true,
  });
  let advancedCurve = buildAdvancedCurve();
  const playerDefinitions = new Map<string, CurveDefinition>();
  for (const curve of [...namedCurves, ...recipeCurves, ...utilityCurves, advancedCurve]) {
    playerDefinitions.set(curve.id, curve);
  }

  const initialCurve = namedCurves.find((curve) => curve.id === 'cubicInOut') ?? namedCurves[0];
  if (!initialCurve) throw new Error('No easing curves were loaded');
  let currentCurve: CurveDefinition = initialCurve;
  let activeFilter: CurveGroup = 'all';
  let progress = 0;
  let clockPosition = 0;
  let duration = Number(durationInput.value);
  let repeatStyle: RepeatStyle = 'alternate';
  let activeTimelinePreset: TimelinePreset =
    timelinePresets.find((preset) => preset.id === 'wobble') ?? timelinePresets[0]!;
  let visualMirrored = false;
  let visualBackwards = false;
  let autoplayVisible = autoplayInput.checked;
  let animationFrame: number | undefined;
  let animationStarted = 0;
  let graphRange = { min: 0, max: 1 };
  let companionExpanded = false;
  let selectionActive = true;
  let activeProgress = 0;
  let activeMirrored = false;
  let activeBackwards = false;
  let customCurveIndex = 0;
  const playingIds = new Set<string>();
  const manuallyPlayingIds = new Set<string>();
  const autoVisibleIds = new Set<string>();
  const autoPausedIds = new Set<string>();
  const playerProgress = new Map<string, number>([[initialCurve.id, 0]]);
  const playerMirrored = new Map<string, boolean>([[initialCurve.id, false]]);
  const playerBackwards = new Map<string, boolean>([[initialCurve.id, false]]);
  let autoplayObserver: IntersectionObserver | undefined;

  document.documentElement.dataset['previewMode'] = 'move';
  document.documentElement.dataset['autoplay'] = autoplayVisible ? 'on' : 'off';

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

  const updatePreview = (
    curve: CurveDefinition,
    time: number,
    mirrored = false,
    backwards = false,
  ): void => {
    const value = finiteValue(curve.fn, time);
    const visualValue = mirrored ? 1 - value : value;
    const graphValue = Math.max(-0.2, Math.min(1.2, value));
    const position = Math.max(0, Math.min(1, visualValue));
    const x = 8 + time * 104;
    const y = 56 - graphValue * 48;
    document.querySelectorAll<HTMLElement>(`[data-preview-id="${curve.id}"]`).forEach((preview) => {
      preview.dataset['direction'] = backwards ? 'reverse' : 'forward';
      preview.style.setProperty('--preview-position', `${position * 100}%`);
      preview.style.setProperty(
        '--preview-scale',
        String(Math.max(0.25, Math.min(1.5, 0.4 + visualValue))),
      );
      preview.style.setProperty('--preview-rotation', `${visualValue * 300}deg`);
      const colorMix = Math.max(0, Math.min(1, visualValue));
      const red = Math.round(255 + (50 - 255) * colorMix);
      const green = Math.round(101 + (93 - 101) * colorMix);
      const blue = Math.round(78 + (255 - 78) * colorMix);
      preview.style.setProperty('--preview-color', `rgb(${red} ${green} ${blue})`);
      const mover = preview.querySelector<HTMLElement>('.preview-mover');
      if (mover) mover.textContent = backwards ? '←' : '→';
      const rotateObject = preview.querySelector<HTMLElement>('.preview-rotate-object');
      if (rotateObject) rotateObject.textContent = backwards ? '↙' : '↗';
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
    updatePreview(currentCurve, activeProgress, activeMirrored, activeBackwards);
  };

  const refreshVisiblePreviews = (): void => {
    const visibleIds = new Set(
      [...document.querySelectorAll<HTMLElement>('[data-preview-id]')].map(
        (preview) => preview.dataset['previewId'] ?? '',
      ),
    );
    for (const id of visibleIds) {
      const curve = playerDefinitions.get(id);
      if (curve) {
        updatePreview(
          curve,
          playerProgress.get(curve.id) ?? 0,
          playerMirrored.get(curve.id) ?? false,
          playerBackwards.get(curve.id) ?? false,
        );
      }
    }
  };

  const updateSelectionState = (): void => {
    document.querySelectorAll<HTMLElement>('.curve-card').forEach((card) => {
      const selected = selectionActive && card.dataset['curve'] === currentCurve.id;
      card.classList.toggle('selected', selected);
      card
        .querySelector<HTMLButtonElement>('[data-select-curve]')
        ?.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll<HTMLElement>('.recipe-card').forEach((card) => {
      const selected = selectionActive && card.dataset['curve'] === currentCurve.id;
      card.classList.toggle('selected', selected);
      card
        .querySelector<HTMLButtonElement>('[data-select-curve]')
        ?.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll<HTMLElement>('.utility-card').forEach((card) => {
      const selected = selectionActive && card.dataset['utilityId'] === currentCurve.id;
      card.classList.toggle('selected', selected);
      card
        .querySelector<HTMLButtonElement>('[data-select-curve]')
        ?.setAttribute('aria-pressed', String(selected));
    });
    advancedWorkbench.classList.toggle(
      'selected',
      selectionActive && currentCurve.id === advancedCurve.id,
    );
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
    document.querySelectorAll<HTMLElement>('.recipe-card').forEach((card) => {
      card.classList.toggle('playing', playingIds.has(card.dataset['curve'] ?? ''));
    });
    advancedWorkbench.classList.toggle('playing', playingIds.has(advancedCurve.id));
    playingCount.value = String(playingIds.size);
    stopAllButton.disabled = playingIds.size === 0;
  };

  const selectCurve = (curve: CurveDefinition): void => {
    const previousHasControl = [...document.querySelectorAll<HTMLElement>('[data-play-id]')].some(
      (control) => control.dataset['playId'] === currentCurve.id,
    );
    if (currentCurve.id !== curve.id && currentCurve.custom && !previousHasControl) {
      playingIds.delete(currentCurve.id);
      manuallyPlayingIds.delete(currentCurve.id);
    }
    playerDefinitions.set(curve.id, curve);
    const changingCurve = currentCurve.id !== curve.id;
    if (!playerProgress.has(curve.id)) {
      playerProgress.set(curve.id, progress);
      playerMirrored.set(curve.id, visualMirrored);
      playerBackwards.set(curve.id, visualBackwards);
    }
    currentCurve = curve;
    selectionActive = true;
    companion.classList.add('visible');
    if (changingCurve) {
      activeProgress = playerProgress.get(curve.id) ?? progress;
      activeMirrored = playerMirrored.get(curve.id) ?? visualMirrored;
      activeBackwards = playerBackwards.get(curve.id) ?? visualBackwards;
    }
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
      if (curve) {
        updatePreview(
          curve,
          playerProgress.get(id) ?? progress,
          playerMirrored.get(id) ?? visualMirrored,
          playerBackwards.get(id) ?? visualBackwards,
        );
      }
    }
    if (playingIds.has(currentCurve.id)) {
      activeProgress = playerProgress.get(currentCurve.id) ?? activeProgress;
      activeMirrored = playerMirrored.get(currentCurve.id) ?? activeMirrored;
      activeBackwards = playerBackwards.get(currentCurve.id) ?? activeBackwards;
    }
    updateActiveCompanion();
  };

  const applyTimelineFrame = (frame: TimelineFrame): void => {
    progress = frame.time;
    visualMirrored = frame.mirrored;
    visualBackwards = frame.backwards;
    document.documentElement.dataset['timelineTime'] = progress.toFixed(4);
    document.documentElement.dataset['timelineDirection'] = visualBackwards ? 'reverse' : 'forward';
    for (const id of playingIds) {
      playerProgress.set(id, progress);
      playerMirrored.set(id, visualMirrored);
      playerBackwards.set(id, visualBackwards);
    }
  };

  const finishPlayers = (): void => {
    manuallyPlayingIds.clear();
    for (const id of autoVisibleIds) autoPausedIds.add(id);
    playingIds.clear();
    animationFrame = undefined;
    updatePlaybackControls();
  };

  const tick = (timestamp: number): void => {
    if (playingIds.size === 0) {
      animationFrame = undefined;
      return;
    }
    clockPosition = (timestamp - animationStarted) / duration;
    const period = repeatPeriod(repeatStyle);
    if (repeatStyle !== 'once' && clockPosition >= period) {
      const completedCycles = Math.floor(clockPosition / period);
      animationStarted += completedCycles * period * duration;
      clockPosition -= completedCycles * period;
    }
    const frame = timelineFrame(clockPosition, repeatStyle, activeTimelinePreset);
    applyTimelineFrame(frame);
    renderPlayingFrame();

    if (frame.complete) {
      finishPlayers();
      return;
    }
    animationFrame = requestAnimationFrame(tick);
  };

  const ensureClock = (): void => {
    if (animationFrame !== undefined || playingIds.size === 0) return;
    animationStarted = performance.now() - clockPosition * duration;
    animationFrame = requestAnimationFrame(tick);
  };

  const reconcilePlayingIds = (): void => {
    const desiredIds = new Set(manuallyPlayingIds);
    if (autoplayVisible) {
      for (const id of autoVisibleIds) {
        if (!autoPausedIds.has(id)) desiredIds.add(id);
      }
    }

    const clockWasStopped = playingIds.size === 0;
    const previouslyPlayingIds = new Set(playingIds);
    for (const id of playingIds) {
      if (!desiredIds.has(id)) playingIds.delete(id);
    }
    for (const id of desiredIds) {
      if (!playerDefinitions.has(id)) continue;
      if (!previouslyPlayingIds.has(id)) {
        playerProgress.set(id, progress);
        playerMirrored.set(id, visualMirrored);
        playerBackwards.set(id, visualBackwards);
      }
      playingIds.add(id);
    }

    if (playingIds.size === 0) {
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    } else {
      if (clockWasStopped) {
        if (repeatStyle === 'once' && clockPosition >= 1) {
          clockPosition = 0;
          applyTimelineFrame(timelineFrame(0, repeatStyle, activeTimelinePreset));
        }
        for (const id of playingIds) {
          playerProgress.set(id, progress);
          playerMirrored.set(id, visualMirrored);
          playerBackwards.set(id, visualBackwards);
        }
        animationStarted = performance.now() - clockPosition * duration;
      }
      ensureClock();
    }
    updatePlaybackControls();
    renderPlayingFrame();
  };

  const observeAutoplayPreviews = (): void => {
    autoplayObserver?.disconnect();
    autoVisibleIds.clear();
    reconcilePlayingIds();
    autoplayObserver ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset['previewId'];
          if (!id) continue;
          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            autoVisibleIds.add(id);
          } else {
            autoVisibleIds.delete(id);
            autoPausedIds.delete(id);
          }
        }
        reconcilePlayingIds();
      },
      { threshold: 0.15 },
    );
    document
      .querySelectorAll<HTMLElement>('[data-preview-id]')
      .forEach((preview) => autoplayObserver?.observe(preview));
  };

  const togglePlayer = (curve: CurveDefinition): void => {
    selectCurve(curve);
    if (playingIds.has(curve.id)) {
      manuallyPlayingIds.delete(curve.id);
      if (autoVisibleIds.has(curve.id)) autoPausedIds.add(curve.id);
    } else {
      autoPausedIds.delete(curve.id);
      manuallyPlayingIds.add(curve.id);
    }
    reconcilePlayingIds();
    updatePreview(
      curve,
      playerProgress.get(curve.id) ?? 0,
      playerMirrored.get(curve.id) ?? false,
      playerBackwards.get(curve.id) ?? false,
    );
    updateActiveCompanion();
  };

  const stopAllPlayers = (): void => {
    manuallyPlayingIds.clear();
    for (const id of autoVisibleIds) autoPausedIds.add(id);
    reconcilePlayingIds();
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
              <code class="curve-id" data-copyable>${escapeHtml(curve.shortName)}</code>
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
    observeAutoplayPreviews();
  };

  const renderRecipes = (): void => {
    recipeGrid.innerHTML = workshopRecipes
      .map((recipe, index) => {
        const curve = recipeCurves[index];
        if (!curve) return '';
        return `
          <article class="recipe-card" data-recipe="${recipe.id}" data-curve="${curve.id}">
            <span class="recipe-number">${String(index + 1).padStart(2, '0')}</span>
            ${previewMarkup(curve)}
            <span class="recipe-copy">
              <code class="recipe-eyebrow" data-copyable>${escapeHtml(recipe.eyebrow)}</code>
              <button class="recipe-select" type="button" data-select-curve="${curve.id}" aria-pressed="false">${escapeHtml(recipe.name)}</button>
              <span>${escapeHtml(recipe.description)}</span>
            </span>
            <div class="recipe-action">
              <button class="recipe-play" type="button" data-play-id="${curve.id}" data-player-name="${escapeHtml(curve.name)}" aria-pressed="false">
                <span class="play-label">Play</span><span class="pause-label">Pause</span>
                <svg class="play-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="m5 3 9 6-9 6z" /></svg>
                <svg class="pause-icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3h3v12H5zm5 0h3v12h-3z" /></svg>
              </button>
            </div>
          </article>`;
      })
      .join('');
    updateSelectionState();
    updatePlaybackControls();
    refreshVisiblePreviews();
    observeAutoplayPreviews();
  };

  const renderUtilities = (): void => {
    utilityList.innerHTML = utilityRecipes
      .map((utility, index) => {
        const curve = utilityCurves[index];
        if (!curve) return '';
        return `
          <article class="utility-card" data-utility-id="${curve.id}">
            ${previewMarkup(curve)}
            <span class="utility-copy"><button class="utility-select" type="button" data-select-curve="${curve.id}" aria-pressed="false">${escapeHtml(utility.name)}</button><code data-copyable>${escapeHtml(utility.code)}</code></span>
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
    observeAutoplayPreviews();
  };

  const renderAdvancedRecipeTabs = (): void => {
    advancedRecipesElement.innerHTML = advancedRecipes
      .map(
        (recipe, index) => `
          <button type="button" role="tab" data-advanced-recipe="${recipe.id}" aria-selected="${String(recipe.id === activeAdvancedRecipe.id)}" class="${recipe.id === activeAdvancedRecipe.id ? 'active' : ''}">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <span><code title="${escapeHtml(recipe.api)}">${escapeHtml(recipe.api)}</code><small>${escapeHtml(recipe.category)}</small></span>
            <span aria-hidden="true">→</span>
          </button>`,
      )
      .join('');
    const activeButton = advancedRecipesElement.querySelector<HTMLElement>('.active');
    if (activeButton && advancedRecipesElement.scrollWidth > advancedRecipesElement.clientWidth) {
      requestAnimationFrame(() => {
        const railBounds = advancedRecipesElement.getBoundingClientRect();
        const buttonBounds = activeButton.getBoundingClientRect();
        const buttonLeft = buttonBounds.left - railBounds.left + advancedRecipesElement.scrollLeft;
        advancedRecipesElement.scrollTo({
          left: buttonLeft - (advancedRecipesElement.clientWidth - activeButton.offsetWidth) / 2,
          behavior: 'smooth',
        });
      });
    }
  };

  const renderAdvancedControls = (): void => {
    advancedControls.innerHTML = activeAdvancedRecipe.controls
      .map((control) => {
        const value = advancedValues[control.key] ?? control.defaultValue;
        if (control.kind === 'choice') {
          return `
            <label class="advanced-choice">
              <span>${escapeHtml(control.label)}</span>
              <select data-advanced-input="${control.key}">
                ${control.options
                  .map(
                    (option) =>
                      `<option value="${escapeHtml(option.value)}" ${option.value === value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
                  )
                  .join('')}
              </select>
            </label>`;
        }
        const rangePosition = ((Number(value) - control.min) / (control.max - control.min)) * 100;
        return `
          <label class="advanced-range">
            <span><span>${escapeHtml(control.label)}</span><output data-advanced-output="${control.key}">${escapeHtml(String(value))}${escapeHtml(control.suffix ?? '')}</output></span>
            <input type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${value}" data-advanced-input="${control.key}" style="--range-progress: ${rangePosition}%" />
            <span class="advanced-range-bounds" aria-hidden="true"><span>${control.min}</span><span>${control.max}</span></span>
          </label>`;
      })
      .join('');
  };

  const syncAdvancedControls = (): void => {
    for (const control of activeAdvancedRecipe.controls) {
      const input = advancedControls.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[data-advanced-input="${control.key}"]`,
      );
      if (!input) continue;
      const value = advancedValues[control.key] ?? control.defaultValue;
      input.value = String(value);
      if (control.kind === 'range') {
        input.style.setProperty(
          '--range-progress',
          `${((Number(value) - control.min) / (control.max - control.min)) * 100}%`,
        );
        const output = advancedControls.querySelector<HTMLOutputElement>(
          `[data-advanced-output="${control.key}"]`,
        );
        if (output) output.value = `${value}${control.suffix ?? ''}`;
      }
    }
  };

  const renderAdvancedPresets = (): void => {
    advancedPresets.innerHTML = activeAdvancedRecipe.presets
      .map(
        (preset, index) =>
          `<button type="button" data-advanced-preset="${index}">${escapeHtml(preset.label)}</button>`,
      )
      .join('');
  };

  const formationNode = (value: string, label?: string): string =>
    `<span class="formation-node"><code>${escapeHtml(value)}</code>${label ? `<small>${escapeHtml(label)}</small>` : ''}</span>`;
  const formationArrow = (label = 'then'): string =>
    `<span class="formation-arrow"><small>${escapeHtml(label)}</small><span aria-hidden="true">→</span></span>`;

  const renderAdvancedFormation = (): void => {
    const value = (key: string): string => String(advancedValues[key] ?? '');
    switch (activeAdvancedRecipe.id) {
      case 'spring':
        advancedFormation.innerHTML = `${formationNode('mass + stiffness', 'system')}${formationArrow('damped by')}${formationNode(value('damping'), 'damping')}${formationArrow()}${formationNode('response')}`;
        break;
      case 'elastic':
        advancedFormation.innerHTML = `${formationNode(value('amplitude'), 'amplitude')}${formationArrow('+')}${formationNode(value('period'), 'period')}${formationArrow()}${formationNode('oscillation')}`;
        break;
      case 'bezier':
        advancedFormation.innerHTML = `${formationNode(`P1 (${value('x1')}, ${value('y1')})`)}${formationArrow('+')}${formationNode(`P2 (${value('x2')}, ${value('y2')})`)}${formationArrow()}${formationNode('timing curve')}`;
        break;
      case 'hermite':
        advancedFormation.innerHTML = `${formationNode(value('startSlope'), 'start slope')}${formationArrow('+')}${formationNode(value('endSlope'), 'end slope')}${formationArrow()}${formationNode('cubic')}`;
        break;
      case 'piecewise':
        advancedFormation.innerHTML = `${formationNode('P0')}${formationArrow()}${formationNode('P1')}${formationArrow()}${formationNode('P2')}${formationArrow()}${formationNode('P3')}${formationArrow()}${formationNode('P4')}`;
        break;
      case 'spline':
        advancedFormation.innerHTML = `${formationNode('4 keyframes')}${formationArrow('interpolate')}${formationNode('monotone spline', 'no overshoot')}`;
        break;
      case 'steps':
        advancedFormation.innerHTML = `${formationNode(value('count'), 'states')}${formationArrow(value('position'))}${formationNode('quantized time')}`;
        break;
      case 'mix':
        advancedFormation.innerHTML = `${formationNode(value('first'), `${(1 - Number(value('weight'))).toFixed(2)} weight`)}${formationArrow('blend')}${formationNode(value('second'), `${Number(value('weight')).toFixed(2)} weight`)}`;
        break;
      case 'compose':
        advancedFormation.innerHTML = `${formationNode(value('inner'), 'input')}${formationArrow('feeds')}${formationNode(value('outer'), 'output')}`;
        break;
      case 'combine':
        advancedFormation.innerHTML = `${formationNode(value('start'), '0 → 0.5')}${formationArrow('switch')}${formationNode(value('end'), '0.5 → 1')}`;
        break;
      default:
        advancedFormation.replaceChildren();
    }
  };

  const renderAdvancedHandles = (): void => {
    const handle = (time: number, value: number, label: string, attributes: string): string => {
      const point = graphPoint(time, value);
      return `<g class="advanced-handle" transform="translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})" data-advanced-handle ${attributes}>
        <circle class="advanced-handle-hit" r="8" />
        <circle class="advanced-handle-point" r="3.2" />
        <text x="5" y="-5">${escapeHtml(label)}</text>
      </g>`;
    };
    const line = (fromTime: number, fromValue: number, toTime: number, toValue: number): string => {
      const from = graphPoint(fromTime, fromValue);
      const to = graphPoint(toTime, toValue);
      return `<line x1="${from.x.toFixed(2)}" y1="${from.y.toFixed(2)}" x2="${to.x.toFixed(2)}" y2="${to.y.toFixed(2)}" />`;
    };
    const number = (key: string): number => Number(advancedValues[key]);
    let handles = '';
    let lines = '';
    switch (activeAdvancedRecipe.id) {
      case 'bezier':
        handles =
          handle(
            number('x1'),
            number('y1'),
            'P1',
            'data-handle-kind="bezier" data-x-key="x1" data-y-key="y1"',
          ) +
          handle(
            number('x2'),
            number('y2'),
            'P2',
            'data-handle-kind="bezier" data-x-key="x2" data-y-key="y2"',
          );
        lines = line(0, 0, number('x1'), number('y1')) + line(1, 1, number('x2'), number('y2'));
        break;
      case 'hermite': {
        const startValue = number('startSlope') * 0.2;
        const endValue = 1 - number('endSlope') * 0.2;
        handles =
          handle(
            0.2,
            startValue,
            'S',
            'data-handle-kind="slope" data-y-key="startSlope" data-side="start"',
          ) +
          handle(
            0.8,
            endValue,
            'E',
            'data-handle-kind="slope" data-y-key="endSlope" data-side="end"',
          );
        lines = line(0, 0, 0.2, startValue) + line(1, 1, 0.8, endValue);
        break;
      }
      case 'piecewise':
        handles =
          handle(0.2, number('p1'), 'P1', 'data-handle-kind="value" data-y-key="p1"') +
          handle(0.5, number('p2'), 'P2', 'data-handle-kind="value" data-y-key="p2"') +
          handle(0.8, number('p3'), 'P3', 'data-handle-kind="value" data-y-key="p3"');
        break;
      case 'spline':
        handles =
          handle(0.25, number('early'), 'P1', 'data-handle-kind="value" data-y-key="early"') +
          handle(0.65, number('late'), 'P2', 'data-handle-kind="value" data-y-key="late"');
        break;
    }
    advancedHandleLines.innerHTML = lines;
    advancedHandles.innerHTML = handles;
    advancedDragHint.textContent = handles ? 'Drag points' : '';
    advancedShapeEditor.classList.toggle('draggable', Boolean(handles));
  };

  const rebuildAdvancedCurve = (): void => {
    advancedCurve = buildAdvancedCurve();
    playerDefinitions.set(advancedCurve.id, advancedCurve);
    advancedApi.textContent = activeAdvancedRecipe.api;
    advancedName.textContent = activeAdvancedRecipe.name;
    advancedCategory.textContent = activeAdvancedRecipe.category;
    advancedDescription.textContent = activeAdvancedRecipe.description;
    renderAdvancedFormation();
    advancedCode.textContent = advancedCurve.code;
    advancedPlayButton.dataset['playerName'] = activeAdvancedRecipe.name;
    advancedPreview
      .querySelector<SVGPathElement>('.mini-curve')
      ?.setAttribute('d', miniPath(advancedCurve.fn));
    advancedStaticPath.setAttribute('d', miniPath(advancedCurve.fn));
    renderAdvancedHandles();
    advancedSamples.innerHTML = [0.25, 0.5, 0.75]
      .map(
        (time) =>
          `<div><dt>f(${time})</dt><dd>${finiteValue(advancedCurve.fn, time).toFixed(3)}</dd></div>`,
      )
      .join('');
    if (currentCurve.id === advancedCurve.id) selectCurve(advancedCurve);
    updatePreview(
      advancedCurve,
      playerProgress.get(advancedCurve.id) ?? progress,
      playerMirrored.get(advancedCurve.id) ?? visualMirrored,
      playerBackwards.get(advancedCurve.id) ?? visualBackwards,
    );
    updateSelectionState();
    updatePlaybackControls();
  };

  const renderAdvanced = (): void => {
    renderAdvancedRecipeTabs();
    renderAdvancedControls();
    renderAdvancedPresets();
    advancedPreview.innerHTML = previewMarkup(advancedCurve);
    rebuildAdvancedCurve();
    observeAutoplayPreviews();
  };

  companionPlayButton.addEventListener('click', () => togglePlayer(currentCurve));

  companionCloseButton.addEventListener('click', () => {
    selectionActive = false;
    companionExpanded = false;
    companion.classList.remove('visible', 'expanded');
    companionDetailsButton.setAttribute('aria-expanded', 'false');
    companionDetailsButton.querySelector('span')!.textContent = 'Details';
    updateSelectionState();
  });

  select<HTMLElement>('.companion-summary').addEventListener('click', (event) => {
    const target = event.target as Element;
    if (target.closest('#companion-play, #companion-close, #companion-details')) return;
    if (!companionExpanded) companionDetailsButton.click();
  });

  companionDetailsButton.addEventListener('click', () => {
    companionExpanded = !companionExpanded;
    companion.classList.toggle('expanded', companionExpanded);
    companionDetailsButton.setAttribute('aria-expanded', String(companionExpanded));
    companionDetailsButton.querySelector('span')!.textContent = companionExpanded
      ? 'Compact'
      : 'Details';
  });

  progressInput.addEventListener('input', () => {
    clockPosition = Number(progressInput.value);
    const frame = timelineFrame(clockPosition, repeatStyle, activeTimelinePreset);
    progress = frame.time;
    visualMirrored = frame.mirrored;
    visualBackwards = frame.backwards;
    playerProgress.set(currentCurve.id, progress);
    playerMirrored.set(currentCurve.id, visualMirrored);
    playerBackwards.set(currentCurve.id, visualBackwards);
    activeProgress = progress;
    activeMirrored = visualMirrored;
    activeBackwards = visualBackwards;
    for (const id of playingIds) {
      playerProgress.set(id, progress);
      playerMirrored.set(id, visualMirrored);
      playerBackwards.set(id, visualBackwards);
    }
    if (playingIds.size > 0) {
      animationStarted = performance.now() - clockPosition * duration;
    }
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
    if (playingIds.size > 0) {
      animationStarted = performance.now() - clockPosition * duration;
    }
  });

  document.querySelector('.repeat-control')?.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-repeat-style]');
    if (!button) return;
    repeatStyle = (button.dataset['repeatStyle'] ?? 'alternate') as RepeatStyle;
    document.querySelectorAll<HTMLButtonElement>('[data-repeat-style]').forEach((styleButton) => {
      const active = styleButton === button;
      styleButton.classList.toggle('active', active);
      styleButton.setAttribute('aria-pressed', String(active));
    });
    repeatDescription.textContent = repeatDescriptions[repeatStyle];
    durationContext.textContent = durationContexts[repeatStyle];
    customTimeline.hidden = repeatStyle !== 'custom';
    clockPosition = 0;
    applyTimelineFrame(timelineFrame(0, repeatStyle, activeTimelinePreset));
    playerProgress.set(currentCurve.id, progress);
    playerMirrored.set(currentCurve.id, visualMirrored);
    playerBackwards.set(currentCurve.id, visualBackwards);
    if (playingIds.size > 0) animationStarted = performance.now();
    renderPlayingFrame();
  });

  customTimeline.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-timeline-preset]');
    if (!button) return;
    const preset = timelinePresets.find(
      (candidate) => candidate.id === button.dataset['timelinePreset'],
    );
    if (!preset) return;
    activeTimelinePreset =
      preset.id === 'active'
        ? {
            ...preset,
            name: currentCurve.name,
            fn: currentCurve.fn,
            code: `activeCurve /* ${currentCurve.name} */`,
          }
        : preset;
    if (preset.id === 'active') activeTimelineName.textContent = currentCurve.name;
    document
      .querySelectorAll<HTMLButtonElement>('[data-timeline-preset]')
      .forEach((presetButton) => {
        const active = presetButton === button;
        presetButton.classList.toggle('active', active);
        presetButton.setAttribute('aria-pressed', String(active));
      });
    timelineCode.textContent = activeTimelinePreset.code;
    clockPosition = 0;
    applyTimelineFrame(timelineFrame(0, repeatStyle, activeTimelinePreset));
    playerProgress.set(currentCurve.id, progress);
    playerMirrored.set(currentCurve.id, visualMirrored);
    playerBackwards.set(currentCurve.id, visualBackwards);
    if (playingIds.size > 0) animationStarted = performance.now();
    renderPlayingFrame();
  });

  autoplayInput.addEventListener('change', () => {
    autoplayVisible = autoplayInput.checked;
    document.documentElement.dataset['autoplay'] = autoplayVisible ? 'on' : 'off';
    if (autoplayVisible) manuallyPlayingIds.clear();
    autoPausedIds.clear();
    reconcilePlayingIds();
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

  advancedRecipesElement.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-advanced-recipe]');
    if (!button) return;
    const recipe = advancedRecipes.find(
      (candidate) => candidate.id === button.dataset['advancedRecipe'],
    );
    if (!recipe || recipe.id === activeAdvancedRecipe.id) return;
    activeAdvancedRecipe = recipe;
    advancedValues = defaultAdvancedValues(recipe);
    renderAdvancedRecipeTabs();
    renderAdvancedControls();
    renderAdvancedPresets();
    rebuildAdvancedCurve();
  });

  const animateAdvancedChange = (): void => {
    advancedWorkbench.classList.remove('changed');
    requestAnimationFrame(() => advancedWorkbench.classList.add('changed'));
    window.setTimeout(() => advancedWorkbench.classList.remove('changed'), 420);
  };

  advancedPresets.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-advanced-preset]');
    if (!button) return;
    const preset = activeAdvancedRecipe.presets[Number(button.dataset['advancedPreset'])];
    if (!preset) return;
    advancedValues = {
      ...defaultAdvancedValues(activeAdvancedRecipe),
      ...preset.values,
    };
    syncAdvancedControls();
    rebuildAdvancedCurve();
    animateAdvancedChange();
  });

  advancedRandomizeButton.addEventListener('click', () => {
    const randomizedValues: AdvancedValues = Object.fromEntries(
      activeAdvancedRecipe.controls.map((control) => {
        if (control.kind === 'choice') {
          const option = control.options[Math.floor(Math.random() * control.options.length)];
          return [control.key, option?.value ?? control.defaultValue];
        }
        const steps = Math.round((control.max - control.min) / control.step);
        const value = control.min + Math.floor(Math.random() * (steps + 1)) * control.step;
        return [control.key, Number(value.toFixed(6))];
      }),
    );
    const unchanged = activeAdvancedRecipe.controls.every(
      (control) => randomizedValues[control.key] === advancedValues[control.key],
    );
    const firstControl = activeAdvancedRecipe.controls[0];
    if (unchanged && firstControl) {
      if (firstControl.kind === 'choice') {
        const currentIndex = firstControl.options.findIndex(
          (option) => option.value === randomizedValues[firstControl.key],
        );
        randomizedValues[firstControl.key] =
          firstControl.options[(currentIndex + 1) % firstControl.options.length]?.value ??
          firstControl.defaultValue;
      } else {
        const current = Number(randomizedValues[firstControl.key]);
        randomizedValues[firstControl.key] =
          current + firstControl.step <= firstControl.max
            ? current + firstControl.step
            : firstControl.min;
      }
    }
    advancedValues = randomizedValues;
    syncAdvancedControls();
    rebuildAdvancedCurve();
    animateAdvancedChange();
  });

  const setAdvancedRangeValue = (key: string, value: number): void => {
    const control = activeAdvancedRecipe.controls.find(
      (candidate) => candidate.kind === 'range' && candidate.key === key,
    );
    if (!control || control.kind !== 'range') return;
    const clamped = Math.max(control.min, Math.min(control.max, value));
    const stepped = control.min + Math.round((clamped - control.min) / control.step) * control.step;
    advancedValues[key] = Number(stepped.toFixed(6));
  };

  let draggedAdvancedHandle:
    | {
        pointerId: number;
        kind: string;
        xKey?: string;
        yKey?: string;
        side?: string;
      }
    | undefined;

  advancedShapeEditor.addEventListener('pointerdown', (event) => {
    const handle = (event.target as Element).closest<SVGGElement>('[data-advanced-handle]');
    if (!handle) return;
    event.preventDefault();
    draggedAdvancedHandle = {
      pointerId: event.pointerId,
      kind: handle.dataset['handleKind'] ?? 'value',
      xKey: handle.dataset['xKey'],
      yKey: handle.dataset['yKey'],
      side: handle.dataset['side'],
    };
    advancedShapeEditor.setPointerCapture(event.pointerId);
    advancedWorkbench.classList.add('dragging');
  });

  advancedShapeEditor.addEventListener('pointermove', (event) => {
    if (!draggedAdvancedHandle || draggedAdvancedHandle.pointerId !== event.pointerId) return;
    event.preventDefault();
    const bounds = advancedShapeEditor.getBoundingClientRect();
    const graphX = ((event.clientX - bounds.left) / bounds.width) * 120;
    const graphY = ((event.clientY - bounds.top) / bounds.height) * 64;
    const time = (graphX - 8) / 104;
    const value = (56 - graphY) / 48;
    if (draggedAdvancedHandle.kind === 'bezier' && draggedAdvancedHandle.xKey) {
      setAdvancedRangeValue(draggedAdvancedHandle.xKey, time);
    }
    if (draggedAdvancedHandle.kind === 'slope' && draggedAdvancedHandle.yKey) {
      setAdvancedRangeValue(
        draggedAdvancedHandle.yKey,
        draggedAdvancedHandle.side === 'start' ? value / 0.2 : (1 - value) / 0.2,
      );
    } else if (draggedAdvancedHandle.yKey) {
      setAdvancedRangeValue(draggedAdvancedHandle.yKey, value);
    }
    syncAdvancedControls();
    rebuildAdvancedCurve();
  });

  const finishAdvancedDrag = (event: PointerEvent): void => {
    if (!draggedAdvancedHandle || draggedAdvancedHandle.pointerId !== event.pointerId) return;
    draggedAdvancedHandle = undefined;
    advancedWorkbench.classList.remove('dragging');
  };
  advancedShapeEditor.addEventListener('pointerup', finishAdvancedDrag);
  advancedShapeEditor.addEventListener('pointercancel', finishAdvancedDrag);

  advancedControls.addEventListener('input', (event) => {
    const input = (event.target as Element).closest<HTMLInputElement | HTMLSelectElement>(
      '[data-advanced-input]',
    );
    if (!input) return;
    const key = input.dataset['advancedInput'];
    if (!key) return;
    const control = activeAdvancedRecipe.controls.find((candidate) => candidate.key === key);
    if (!control) return;
    advancedValues[key] = control.kind === 'range' ? Number(input.value) : input.value;
    if (control.kind === 'range') {
      const output = advancedControls.querySelector<HTMLOutputElement>(
        `[data-advanced-output="${key}"]`,
      );
      if (output) output.value = `${input.value}${control.suffix ?? ''}`;
      input.style.setProperty(
        '--range-progress',
        `${((Number(input.value) - control.min) / (control.max - control.min)) * 100}%`,
      );
    }
    rebuildAdvancedCurve();
  });

  advancedResetButton.addEventListener('click', () => {
    advancedValues = defaultAdvancedValues(activeAdvancedRecipe);
    renderAdvancedControls();
    rebuildAdvancedCurve();
    animateAdvancedChange();
  });

  advancedUseButton.addEventListener('click', () => selectCurve(advancedCurve));
  advancedPlayButton.addEventListener('click', () => togglePlayer(advancedCurve));

  advancedCopyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(advancedCurve.code);
      advancedCopyButton.textContent = 'Copied';
    } catch {
      advancedCopyButton.textContent = 'Select text';
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(advancedCode);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    window.setTimeout(() => {
      advancedCopyButton.textContent = 'Copy';
    }, 1600);
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
    const target = event.target as Element;
    const playButton = target.closest<HTMLButtonElement>('[data-play-id]');
    if (playButton) {
      const curve = playerDefinitions.get(playButton.dataset['playId'] ?? '');
      if (curve) togglePlayer(curve);
      return;
    }
    if (target.closest('[data-copyable]')) return;
    const card = target.closest<HTMLElement>('.recipe-card');
    const curve = card ? playerDefinitions.get(card.dataset['curve'] ?? '') : undefined;
    if (curve) selectCurve(curve);
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
    if (!applyButton) {
      if (target.closest('[data-copyable]')) return;
      const card = target.closest<HTMLElement>('.utility-card');
      const curve = card ? playerDefinitions.get(card.dataset['utilityId'] ?? '') : undefined;
      if (curve) selectCurve(curve);
      return;
    }
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
    if (!selectionActive) return;
    event.preventDefault();
    togglePlayer(currentCurve);
  });

  drawGrid();
  renderAdvanced();
  renderCurves();
  renderRecipes();
  renderUtilities();
  durationInput.dispatchEvent(new Event('input'));
  applyTimelineFrame(timelineFrame(0, repeatStyle, activeTimelinePreset));
  selectCurve(currentCurve);
};
