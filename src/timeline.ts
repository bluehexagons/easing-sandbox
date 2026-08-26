import { compose, steps, type EasingFunction } from '@bluehexagons/easing';
import { easings } from '@bluehexagons/easing/named';

export type RepeatStyle = 'loop' | 'rewind' | 'alternate' | 'once' | 'custom';
export type TimelinePresetId = 'active' | 'wobble' | 'steps' | 'bounce';

export interface TimelineFrame {
  time: number;
  mirrored: boolean;
  backwards: boolean;
  complete: boolean;
}

export interface TimelinePreset {
  id: TimelinePresetId;
  name: string;
  description: string;
  fn: EasingFunction;
  code: string;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const cycleProgress = (position: number, period = 1): number =>
  ((position % period) + period) % period;
const triangle: EasingFunction = (time) =>
  time <= 0.5 ? clamp01(time * 2) : clamp01((1 - time) * 2);

const sineWobble = compose(easings.sineInOut, triangle);
const rigidSteps = compose(steps(5, 'end'), triangle);
const bouncingReturn: EasingFunction = (time) =>
  time <= 0.5 ? easings.bounceOut(time * 2) : 1 - easings.bounceOut((time - 0.5) * 2);

export const timelinePresets: readonly TimelinePreset[] = [
  {
    id: 'active',
    name: 'Active curve',
    description: 'Use the selected curve or composition as the shared timeline.',
    fn: easings.linear,
    code: `activeCurve`,
  },
  {
    id: 'wobble',
    name: 'Sine wobble',
    description: 'Smooth 0→1→0 timeline using sineInOut.',
    fn: sineWobble,
    code: `compose(sineInOut, triangle)`,
  },
  {
    id: 'steps',
    name: 'Stepped timeline',
    description: '0→1→0 timeline quantized into five levels.',
    fn: rigidSteps,
    code: `compose(steps(5, 'end'), triangle)`,
  },
  {
    id: 'bounce',
    name: 'Bounce timeline',
    description: 'Uses bounceOut while moving to 1 and back to 0.',
    fn: bouncingReturn,
    code: `t <= 0.5 ? bounceOut(t * 2) : 1 - bounceOut((t - 0.5) * 2)`,
  },
] as const;

export const repeatPeriod = (style: RepeatStyle): number =>
  style === 'rewind' || style === 'alternate' ? 2 : 1;

export const timelineFrame = (
  position: number,
  style: RepeatStyle,
  preset: TimelinePreset,
): TimelineFrame => {
  if (style === 'once') {
    return {
      time: clamp01(position),
      mirrored: false,
      backwards: false,
      complete: position >= 1,
    };
  }

  if (style === 'rewind') {
    const cycle = cycleProgress(position, 2);
    return {
      time: cycle <= 1 ? cycle : 2 - cycle,
      mirrored: false,
      backwards: cycle > 1,
      complete: false,
    };
  }

  if (style === 'alternate') {
    const cycle = cycleProgress(position, 2);
    return {
      time: cycleProgress(cycle),
      mirrored: cycle >= 1,
      backwards: cycle >= 1,
      complete: false,
    };
  }

  const phase = cycleProgress(position);
  return {
    time: style === 'custom' ? clamp01(preset.fn(phase)) : phase,
    mirrored: false,
    backwards: style === 'custom' && phase >= 0.5,
    complete: false,
  };
};
