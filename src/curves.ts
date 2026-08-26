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
  if (name === 'smoothstep') return 'Cubic interpolation with zero slope at both endpoints.';
  if (name === 'smootherstep')
    return 'Quintic interpolation with zero first and second derivatives at both endpoints.';
  const direction = name.endsWith('InOut')
    ? 'ease-in-out'
    : name.endsWith('In')
      ? 'ease-in'
      : 'ease-out';
  return `${humanize(family)} ${direction} curve.`;
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
    eyebrow: 'spring',
    name: 'Damped spring',
    description: 'Normalized spring with stiffness 140, damping 15, and mass 1.',
    build: () => spring({ stiffness: 140, damping: 15, mass: 1, duration: 1 }),
    code: `import { spring } from '@bluehexagons/easing';\n\nconst curve = spring({\n  stiffness: 140,\n  damping: 15,\n  mass: 1,\n  duration: 1,\n});`,
  },
  {
    id: 'bezier',
    eyebrow: 'cubicBezier',
    name: 'Cubic Bézier',
    description: 'Cubic Bézier with control points (0.22, 1) and (0.36, 1).',
    build: () => cubicBezier(0.22, 1, 0.36, 1),
    code: `import { cubicBezier } from '@bluehexagons/easing';\n\nconst curve = cubicBezier(0.22, 1, 0.36, 1);`,
  },
  {
    id: 'steps',
    eyebrow: 'steps',
    name: 'Six steps',
    description: 'Six steps using end positioning.',
    build: () => steps(6, 'end'),
    code: `import { steps } from '@bluehexagons/easing';\n\nconst curve = steps(6, 'end');`,
  },
  {
    id: 'elastic',
    eyebrow: 'createElasticOut',
    name: 'Elastic out',
    description: 'Elastic-out curve with amplitude 1.2 and period 0.42.',
    build: () => createElasticOut({ amplitude: 1.2, period: 0.42 }),
    code: `import { createElasticOut } from '@bluehexagons/easing';\n\nconst curve = createElasticOut({\n  amplitude: 1.2,\n  period: 0.42,\n});`,
  },
  {
    id: 'compose',
    eyebrow: 'compose',
    name: 'Composed curve',
    description: 'Applies cubicInOut, then sineOut.',
    build: () => compose(easings.sineOut, easings.cubicInOut),
    code: `import { compose, sineOut, cubicInOut } from '@bluehexagons/easing';\n\nconst curve = compose(sineOut, cubicInOut);`,
  },
  {
    id: 'mix',
    eyebrow: 'mix',
    name: 'Mixed curve',
    description: 'Mixes quadOut and backOut with weight 0.42.',
    build: () => mix(easings.quadOut, easings.backOut, 0.42),
    code: `import { mix, quadOut, backOut } from '@bluehexagons/easing';\n\nconst curve = mix(quadOut, backOut, 0.42);`,
  },
  {
    id: 'spline',
    eyebrow: 'monotoneSpline',
    name: 'Monotone spline',
    description: 'Monotone interpolation through five normalized points.',
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
    eyebrow: 'alternate',
    name: 'Alternating curve',
    description: 'Three sineInOut passes with every second pass reversed.',
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
