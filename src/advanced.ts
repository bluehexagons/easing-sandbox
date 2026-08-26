import {
  createElasticOut,
  cubicBezier,
  hermite,
  mix,
  monotoneSpline,
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
];

export const defaultAdvancedValues = (recipe: AdvancedRecipe): AdvancedValues =>
  Object.fromEntries(recipe.controls.map((control) => [control.key, control.defaultValue]));
