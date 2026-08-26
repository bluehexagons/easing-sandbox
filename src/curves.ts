import {
  alternate,
  clamp,
  compose,
  cubicBezier,
  createElasticOut,
  invert,
  mix,
  monotoneSpline,
  piecewiseLinear,
  repeat,
  reverse,
  spring,
  steps,
  type EasingFunction,
} from '@bluehexagons/easing';
import { easings, type EasingName } from '@bluehexagons/easing/named';

export type CurveGroup = 'all' | 'classic' | 'expressive' | 'smooth';

export interface CurveDefinition {
  id: string;
  name: string;
  shortName: string;
  group: Exclude<CurveGroup, 'all'>;
  description: string;
  fn: EasingFunction;
  code: string;
  custom?: true;
}

const expressiveFamilies = new Set(['back', 'bounce', 'elastic']);
const smoothNames = new Set(['linear', 'smoothstep', 'smootherstep', 'sine']);

const humanize = (name: string): string =>
  name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());

const familyOf = (name: string): string => name.replace(/(InOut|In|Out)$/, '');

const describe = (name: string): string => {
  const family = familyOf(name);
  if (name === 'linear') return 'Constant speed from start to finish.';
  if (name === 'smoothstep') return 'Soft endpoints with zero starting and ending velocity.';
  if (name === 'smootherstep')
    return 'Extra-polished endpoints with zero velocity and acceleration.';
  const direction = name.endsWith('InOut')
    ? 'Accelerates, then settles'
    : name.endsWith('In')
      ? 'Builds momentum from rest'
      : 'Arrives with a gentle finish';
  const character = expressiveFamilies.has(family)
    ? ` with ${family} character.`
    : ` using a ${family} curve.`;
  return direction + character;
};

export const namedCurves: CurveDefinition[] = (
  Object.entries(easings) as [EasingName, EasingFunction][]
).map(([name, fn]) => {
  const family = familyOf(name);
  const group = expressiveFamilies.has(family)
    ? 'expressive'
    : smoothNames.has(family)
      ? 'smooth'
      : 'classic';

  return {
    id: name,
    name: humanize(name),
    shortName: name,
    group,
    description: describe(name),
    fn,
    code: `import { ${name} } from '@bluehexagons/easing';\n\nconst value = ${name}(time);`,
  };
});

export interface WorkshopRecipe {
  id: string;
  eyebrow: string;
  name: string;
  description: string;
  build: () => EasingFunction;
  code: string;
}

export const workshopRecipes: WorkshopRecipe[] = [
  {
    id: 'spring',
    eyebrow: 'Physics',
    name: 'Responsive spring',
    description: 'A normalized damped spring tuned for quick, tactile interface motion.',
    build: () => spring({ stiffness: 140, damping: 15, mass: 1, duration: 1 }),
    code: `import { spring } from '@bluehexagons/easing';\n\nconst curve = spring({\n  stiffness: 140,\n  damping: 15,\n  mass: 1,\n  duration: 1,\n});`,
  },
  {
    id: 'bezier',
    eyebrow: 'CSS familiar',
    name: 'Swift Bézier',
    description: 'A CSS-compatible cubic Bézier with a brisk launch and calm landing.',
    build: () => cubicBezier(0.22, 1, 0.36, 1),
    code: `import { cubicBezier } from '@bluehexagons/easing';\n\nconst curve = cubicBezier(0.22, 1, 0.36, 1);`,
  },
  {
    id: 'steps',
    eyebrow: 'Discrete',
    name: 'Six clean steps',
    description: 'Quantize continuous time into a precise sequence of visible states.',
    build: () => steps(6, 'end'),
    code: `import { steps } from '@bluehexagons/easing';\n\nconst curve = steps(6, 'end');`,
  },
  {
    id: 'elastic',
    eyebrow: 'Configurable',
    name: 'Elastic landing',
    description: 'A reusable elastic curve with explicit amplitude and period.',
    build: () => createElasticOut({ amplitude: 1.2, period: 0.42 }),
    code: `import { createElasticOut } from '@bluehexagons/easing';\n\nconst curve = createElasticOut({\n  amplitude: 1.2,\n  period: 0.42,\n});`,
  },
  {
    id: 'compose',
    eyebrow: 'Combine',
    name: 'Composed motion',
    description: 'Run one curve through another to create a new motion vocabulary.',
    build: () => compose(easings.sineOut, easings.cubicInOut),
    code: `import { compose, sineOut, cubicInOut } from '@bluehexagons/easing';\n\nconst curve = compose(sineOut, cubicInOut);`,
  },
  {
    id: 'mix',
    eyebrow: 'Blend',
    name: 'Balanced blend',
    description: 'Interpolate between two easing outputs without touching their math.',
    build: () => mix(easings.quadOut, easings.backOut, 0.42),
    code: `import { mix, quadOut, backOut } from '@bluehexagons/easing';\n\nconst curve = mix(quadOut, backOut, 0.42);`,
  },
  {
    id: 'spline',
    eyebrow: 'Draw with data',
    name: 'Monotone spline',
    description: 'A smooth, shape-preserving curve drawn through normalized stops.',
    build: () =>
      monotoneSpline([
        [0, 0],
        [0.2, 0.08],
        [0.55, 0.72],
        [0.78, 0.86],
        [1, 1],
      ]),
    code: `import { monotoneSpline } from '@bluehexagons/easing';\n\nconst curve = monotoneSpline([\n  [0, 0], [0.2, 0.08], [0.55, 0.72],\n  [0.78, 0.86], [1, 1],\n]);`,
  },
  {
    id: 'alternate',
    eyebrow: 'Sequence',
    name: 'Alternating pulse',
    description: 'Repeat a curve across time and reverse every other cycle.',
    build: () => alternate(easings.sineInOut, 3),
    code: `import { alternate, sineInOut } from '@bluehexagons/easing';\n\nconst curve = alternate(sineInOut, 3);`,
  },
];

const linearStops = piecewiseLinear([
  [0, 0],
  [0.35, 0.7],
  [0.7, 0.4],
  [1, 1],
]);

export const utilityRecipes: ReadonlyArray<{
  name: string;
  fn: EasingFunction;
  code: string;
  apply: (curve: EasingFunction) => EasingFunction;
}> = [
  {
    name: 'Clamp overshoot',
    fn: clamp(easings.backOut),
    code: `clamp(activeCurve)`,
    apply: (curve) => clamp(curve),
  },
  {
    name: 'Reverse direction',
    fn: reverse(easings.quadIn),
    code: `reverse(activeCurve)`,
    apply: (curve) => reverse(curve),
  },
  {
    name: 'Repeat × 3',
    fn: repeat(easings.sineInOut, 3),
    code: `repeat(activeCurve, 3)`,
    apply: (curve) => repeat(curve, 3),
  },
  {
    name: 'Remap through stops',
    fn: compose(linearStops, easings.sineInOut),
    code: `compose(stopsCurve, activeCurve)`,
    apply: (curve) => compose(linearStops, curve),
  },
  {
    name: 'Invert output',
    fn: invert(easings.smoothstep),
    code: `invert(activeCurve)`,
    apply: (curve) => invert(curve),
  },
];

export const customCurve = (recipe: WorkshopRecipe): CurveDefinition => ({
  id: `recipe-${recipe.id}`,
  name: recipe.name,
  shortName: recipe.id,
  group: 'expressive',
  description: recipe.description,
  fn: recipe.build(),
  code: recipe.code,
  custom: true,
});
