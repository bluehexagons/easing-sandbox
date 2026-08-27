import {
  createElasticOut,
  combineInOut,
  compose,
  cubicBezier,
  hermite,
  mix,
  monotoneSpline,
  piecewiseLinear,
  spring,
  steps,
  type EasingFunction,
  type StepPosition,
} from '@bluehexagons/easing';
import { easings, type EasingName } from '@bluehexagons/easing/named';

export type AdvancedValue = number | string;
export type AdvancedValues = Record<string, AdvancedValue>;

interface RangeControl {
  kind: 'range';
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  suffix?: string;
}

interface ChoiceControl {
  kind: 'choice';
  key: string;
  label: string;
  defaultValue: string;
  options: ReadonlyArray<{ label: string; value: string }>;
}

export type AdvancedControl = RangeControl | ChoiceControl;

export interface AdvancedRecipe {
  id: string;
  api: string;
  name: string;
  category: string;
  description: string;
  controls: readonly AdvancedControl[];
  presets: ReadonlyArray<{ label: string; values: AdvancedValues }>;
  build: (values: AdvancedValues) => EasingFunction;
  code: (values: AdvancedValues) => string;
}

const numeric = (values: AdvancedValues, key: string): number => Number(values[key]);
const text = (values: AdvancedValues, key: string): string => String(values[key]);
const fixed = (value: number, places = 2): string => Number(value.toFixed(places)).toString();

const namedOptions: ReadonlyArray<{ label: string; value: EasingName }> = [
  { label: 'Cubic in out', value: 'cubicInOut' },
  { label: 'Back out', value: 'backOut' },
  { label: 'Bounce out', value: 'bounceOut' },
  { label: 'Sine in', value: 'sineIn' },
  { label: 'Expo out', value: 'expoOut' },
];

export const advancedRecipes: readonly AdvancedRecipe[] = [
  {
    id: 'spring',
    api: 'spring(options)',
    name: 'Damped spring',
    category: 'Physics',
    description: 'Tune mass, stiffness, damping, initial velocity, and simulated time.',
    controls: [
      {
        kind: 'range',
        key: 'stiffness',
        label: 'Stiffness',
        min: 30,
        max: 320,
        step: 5,
        defaultValue: 140,
      },
      {
        kind: 'range',
        key: 'damping',
        label: 'Damping',
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 15,
      },
      { kind: 'range', key: 'mass', label: 'Mass', min: 0.25, max: 3, step: 0.05, defaultValue: 1 },
      {
        kind: 'range',
        key: 'velocity',
        label: 'Velocity',
        min: -8,
        max: 8,
        step: 0.25,
        defaultValue: 0,
      },
      {
        kind: 'range',
        key: 'duration',
        label: 'Simulation',
        min: 0.25,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        suffix: ' s',
      },
    ],
    presets: [
      {
        label: 'Snappy',
        values: { stiffness: 240, damping: 24, mass: 0.8, velocity: 0, duration: 0.7 },
      },
      {
        label: 'Bouncy',
        values: { stiffness: 120, damping: 7, mass: 1, velocity: 0, duration: 1.4 },
      },
      {
        label: 'Heavy',
        values: { stiffness: 90, damping: 18, mass: 2.4, velocity: -1, duration: 2.2 },
      },
    ],
    build: (values) =>
      spring({
        stiffness: numeric(values, 'stiffness'),
        damping: numeric(values, 'damping'),
        mass: numeric(values, 'mass'),
        velocity: numeric(values, 'velocity'),
        duration: numeric(values, 'duration'),
      }),
    code: (values) => `import { spring } from '@bluehexagons/easing';

const curve = spring({
  stiffness: ${fixed(numeric(values, 'stiffness'))},
  damping: ${fixed(numeric(values, 'damping'))},
  mass: ${fixed(numeric(values, 'mass'))},
  velocity: ${fixed(numeric(values, 'velocity'))},
  duration: ${fixed(numeric(values, 'duration'))},
});`,
  },
  {
    id: 'elastic',
    api: 'createElasticOut(options)',
    name: 'Elastic response',
    category: 'Oscillation',
    description: 'Separate the amount of overshoot from the oscillation period.',
    controls: [
      {
        kind: 'range',
        key: 'amplitude',
        label: 'Amplitude',
        min: 1,
        max: 3,
        step: 0.05,
        defaultValue: 1.35,
      },
      {
        kind: 'range',
        key: 'period',
        label: 'Period',
        min: 0.1,
        max: 1,
        step: 0.01,
        defaultValue: 0.42,
      },
    ],
    presets: [
      { label: 'Subtle', values: { amplitude: 1.05, period: 0.28 } },
      { label: 'Rubber', values: { amplitude: 1.6, period: 0.48 } },
      { label: 'Wild', values: { amplitude: 2.7, period: 0.72 } },
    ],
    build: (values) =>
      createElasticOut({
        amplitude: numeric(values, 'amplitude'),
        period: numeric(values, 'period'),
      }),
    code: (values) => `import { createElasticOut } from '@bluehexagons/easing';

const curve = createElasticOut({
  amplitude: ${fixed(numeric(values, 'amplitude'))},
  period: ${fixed(numeric(values, 'period'))},
});`,
  },
  {
    id: 'bezier',
    api: 'cubicBezier(x1, y1, x2, y2)',
    name: 'Cubic Bézier',
    category: 'CSS compatible',
    description: 'Edit the four control coordinates used by CSS cubic-bezier().',
    controls: [
      { kind: 'range', key: 'x1', label: 'x1', min: 0, max: 1, step: 0.01, defaultValue: 0.22 },
      { kind: 'range', key: 'y1', label: 'y1', min: -1, max: 2, step: 0.01, defaultValue: 1 },
      { kind: 'range', key: 'x2', label: 'x2', min: 0, max: 1, step: 0.01, defaultValue: 0.36 },
      { kind: 'range', key: 'y2', label: 'y2', min: -1, max: 2, step: 0.01, defaultValue: 1 },
    ],
    presets: [
      { label: 'CSS ease', values: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 } },
      { label: 'Quick exit', values: { x1: 0.2, y1: 0.8, x2: 0.2, y2: 1 } },
      { label: 'Overshoot', values: { x1: 0.34, y1: 1.4, x2: 0.64, y2: 1 } },
    ],
    build: (values) =>
      cubicBezier(
        numeric(values, 'x1'),
        numeric(values, 'y1'),
        numeric(values, 'x2'),
        numeric(values, 'y2'),
      ),
    code: (values) => `import { cubicBezier } from '@bluehexagons/easing';

const curve = cubicBezier(
  ${fixed(numeric(values, 'x1'))}, ${fixed(numeric(values, 'y1'))},
  ${fixed(numeric(values, 'x2'))}, ${fixed(numeric(values, 'y2'))},
);`,
  },
  {
    id: 'hermite',
    api: 'hermite(options)',
    name: 'Endpoint slopes',
    category: 'Velocity control',
    description: 'Set the velocity entering and leaving a cubic Hermite curve.',
    controls: [
      {
        kind: 'range',
        key: 'startSlope',
        label: 'Start slope',
        min: -3,
        max: 5,
        step: 0.1,
        defaultValue: 0,
      },
      {
        kind: 'range',
        key: 'endSlope',
        label: 'End slope',
        min: -3,
        max: 5,
        step: 0.1,
        defaultValue: 0,
      },
    ],
    presets: [
      { label: 'Smooth', values: { startSlope: 0, endSlope: 0 } },
      { label: 'Fast start', values: { startSlope: 3.5, endSlope: 0 } },
      { label: 'Anticipate', values: { startSlope: -1.4, endSlope: 0.4 } },
    ],
    build: (values) =>
      hermite({
        startSlope: numeric(values, 'startSlope'),
        endSlope: numeric(values, 'endSlope'),
      }),
    code: (values) => `import { hermite } from '@bluehexagons/easing';

const curve = hermite({
  startSlope: ${fixed(numeric(values, 'startSlope'))},
  endSlope: ${fixed(numeric(values, 'endSlope'))},
});`,
  },
  {
    id: 'piecewise',
    api: 'piecewiseLinear(points)',
    name: 'Drawn with points',
    category: 'Data path',
    description: 'Place independent stops to draw ramps, reversals, and holds.',
    controls: [
      {
        kind: 'range',
        key: 'p1',
        label: 'Value at 20%',
        min: -0.25,
        max: 1.25,
        step: 0.01,
        defaultValue: 0.15,
      },
      {
        kind: 'range',
        key: 'p2',
        label: 'Value at 50%',
        min: -0.25,
        max: 1.25,
        step: 0.01,
        defaultValue: 0.85,
      },
      {
        kind: 'range',
        key: 'p3',
        label: 'Value at 80%',
        min: -0.25,
        max: 1.25,
        step: 0.01,
        defaultValue: 0.55,
      },
    ],
    presets: [
      { label: 'Zigzag', values: { p1: 0.8, p2: 0.2, p3: 1.1 } },
      { label: 'Hold then go', values: { p1: 0, p2: 0.05, p3: 0.9 } },
      { label: 'Overshoot', values: { p1: 0.15, p2: 1.18, p3: 0.92 } },
    ],
    build: (values) =>
      piecewiseLinear([
        [0, 0],
        [0.2, numeric(values, 'p1')],
        [0.5, numeric(values, 'p2')],
        [0.8, numeric(values, 'p3')],
        [1, 1],
      ]),
    code: (values) => `import { piecewiseLinear } from '@bluehexagons/easing';

const curve = piecewiseLinear([
  [0, 0],
  [0.2, ${fixed(numeric(values, 'p1'))}],
  [0.5, ${fixed(numeric(values, 'p2'))}],
  [0.8, ${fixed(numeric(values, 'p3'))}],
  [1, 1],
]);`,
  },
  {
    id: 'spline',
    api: 'monotoneSpline(points)',
    name: 'Data-driven spline',
    category: 'Keyframes',
    description: 'Move two intermediate values without introducing overshoot between them.',
    controls: [
      {
        kind: 'range',
        key: 'early',
        label: 'Value at 25%',
        min: 0,
        max: 0.45,
        step: 0.01,
        defaultValue: 0.08,
      },
      {
        kind: 'range',
        key: 'late',
        label: 'Value at 65%',
        min: 0.55,
        max: 1,
        step: 0.01,
        defaultValue: 0.78,
      },
    ],
    presets: [
      { label: 'Late', values: { early: 0.02, late: 0.58 } },
      { label: 'Balanced', values: { early: 0.24, late: 0.72 } },
      { label: 'Front-loaded', values: { early: 0.42, late: 0.94 } },
    ],
    build: (values) =>
      monotoneSpline([
        [0, 0],
        [0.25, numeric(values, 'early')],
        [0.65, numeric(values, 'late')],
        [1, 1],
      ]),
    code: (values) => `import { monotoneSpline } from '@bluehexagons/easing';

const curve = monotoneSpline([
  [0, 0],
  [0.25, ${fixed(numeric(values, 'early'))}],
  [0.65, ${fixed(numeric(values, 'late'))}],
  [1, 1],
]);`,
  },
  {
    id: 'steps',
    api: 'steps(count, position)',
    name: 'Discrete states',
    category: 'Quantization',
    description: 'Choose the number of states and which side owns each boundary.',
    controls: [
      { kind: 'range', key: 'count', label: 'Steps', min: 2, max: 16, step: 1, defaultValue: 6 },
      {
        kind: 'choice',
        key: 'position',
        label: 'Position',
        defaultValue: 'end',
        options: [
          { label: 'End', value: 'end' },
          { label: 'Start', value: 'start' },
        ],
      },
    ],
    presets: [
      { label: 'Four states', values: { count: 4, position: 'end' } },
      { label: 'Clock ticks', values: { count: 12, position: 'end' } },
      { label: 'Start owned', values: { count: 6, position: 'start' } },
    ],
    build: (values) => steps(numeric(values, 'count'), text(values, 'position') as StepPosition),
    code: (values) => `import { steps } from '@bluehexagons/easing';

const curve = steps(${numeric(values, 'count')}, '${text(values, 'position')}');`,
  },
  {
    id: 'mix',
    api: 'mix(first, second, weight)',
    name: 'Weighted blend',
    category: 'Composition',
    description: 'Blend two named curves without changing either function.',
    controls: [
      {
        kind: 'choice',
        key: 'first',
        label: 'First curve',
        defaultValue: 'cubicInOut',
        options: namedOptions,
      },
      {
        kind: 'choice',
        key: 'second',
        label: 'Second curve',
        defaultValue: 'backOut',
        options: namedOptions,
      },
      {
        kind: 'range',
        key: 'weight',
        label: 'Second weight',
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.42,
      },
    ],
    presets: [
      { label: 'Soft landing', values: { first: 'cubicInOut', second: 'sineIn', weight: 0.35 } },
      { label: 'Bounce blend', values: { first: 'cubicInOut', second: 'bounceOut', weight: 0.62 } },
      { label: 'Sharp exit', values: { first: 'backOut', second: 'expoOut', weight: 0.72 } },
    ],
    build: (values) => {
      const first = text(values, 'first') as EasingName;
      const second = text(values, 'second') as EasingName;
      return mix(easings[first], easings[second], numeric(values, 'weight'));
    },
    code: (values) => {
      const first = text(values, 'first');
      const second = text(values, 'second');
      const imports = [...new Set(['mix', first, second])].join(', ');
      return `import { ${imports} } from '@bluehexagons/easing';

const curve = mix(${first}, ${second}, ${fixed(numeric(values, 'weight'))});`;
    },
  },
  {
    id: 'compose',
    api: 'compose(outer, inner)',
    name: 'Curve pipeline',
    category: 'Composition',
    description: 'Send the output of one named curve through another.',
    controls: [
      {
        kind: 'choice',
        key: 'inner',
        label: 'Runs first',
        defaultValue: 'cubicInOut',
        options: namedOptions,
      },
      {
        kind: 'choice',
        key: 'outer',
        label: 'Runs second',
        defaultValue: 'sineIn',
        options: namedOptions,
      },
    ],
    presets: [
      { label: 'Soft launch', values: { inner: 'cubicInOut', outer: 'sineIn' } },
      { label: 'Back bounce', values: { inner: 'backOut', outer: 'bounceOut' } },
      { label: 'Hard finish', values: { inner: 'sineIn', outer: 'expoOut' } },
    ],
    build: (values) => {
      const inner = text(values, 'inner') as EasingName;
      const outer = text(values, 'outer') as EasingName;
      return compose(easings[outer], easings[inner]);
    },
    code: (values) => {
      const inner = text(values, 'inner');
      const outer = text(values, 'outer');
      const imports = [...new Set(['compose', outer, inner])].join(', ');
      return `import { ${imports} } from '@bluehexagons/easing';

const curve = compose(${outer}, ${inner});`;
    },
  },
  {
    id: 'combine',
    api: 'combineInOut(start, end)',
    name: 'Two-part curve',
    category: 'Split timing',
    description: 'Use a different easing function on each half of the timeline.',
    controls: [
      {
        kind: 'choice',
        key: 'start',
        label: 'First half',
        defaultValue: 'backOut',
        options: namedOptions,
      },
      {
        kind: 'choice',
        key: 'end',
        label: 'Second half',
        defaultValue: 'bounceOut',
        options: namedOptions,
      },
    ],
    presets: [
      { label: 'Rise and settle', values: { start: 'expoOut', end: 'bounceOut' } },
      { label: 'Pull and release', values: { start: 'backOut', end: 'cubicInOut' } },
      { label: 'Soft halves', values: { start: 'sineIn', end: 'cubicInOut' } },
    ],
    build: (values) => {
      const start = text(values, 'start') as EasingName;
      const end = text(values, 'end') as EasingName;
      return combineInOut(easings[start], easings[end]);
    },
    code: (values) => {
      const start = text(values, 'start');
      const end = text(values, 'end');
      const imports = [...new Set(['combineInOut', start, end])].join(', ');
      return `import { ${imports} } from '@bluehexagons/easing';

const curve = combineInOut(${start}, ${end});`;
    },
  },
];

export const defaultAdvancedValues = (recipe: AdvancedRecipe): AdvancedValues =>
  Object.fromEntries(recipe.controls.map((control) => [control.key, control.defaultValue]));
