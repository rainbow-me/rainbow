/* eslint-disable sort-keys-fix/sort-keys-fix */
export const space = {
  '1px': 1,
  '2px': 2,
  '3px': 3,
  '4px': 4,
  '5px': 5,
  '6px': 6,
  '10px': 10,
  '12px': 12,
  '15px': 15,
  '19px': 19,
  '24px': 24,
  '30px': 30,
  '42px': 42,
  '60px': 60,
  '72px': 72,
} as const;

export const negativeSpace = {
  '-1px': -1,
  '-2px': -2,
  '-3px': -3,
  '-4px': -4,
  '-5px': -5,
  '-6px': -6,
  '-10px': -10,
  '-12px': -12,
  '-15px': -15,
  '-19px': -19,
  '-24px': -24,
  '-30px': -30,
  '-42px': -42,
  '-60px': -60,
  '-72px': -72,
} as const;

const spaceToNegativeSpace: Record<
  keyof typeof space,
  keyof typeof negativeSpace
> = {
  '1px': '-1px',
  '2px': '-2px',
  '3px': '-3px',
  '4px': '-4px',
  '5px': '-5px',
  '6px': '-6px',
  '10px': '-10px',
  '12px': '-12px',
  '15px': '-15px',
  '19px': '-19px',
  '24px': '-24px',
  '30px': '-30px',
  '42px': '-42px',
  '60px': '-60px',
  '72px': '-72px',
};

type CustomSpace = { custom: number };
export type Space = keyof typeof space | CustomSpace;
export type NegativeSpace = keyof typeof negativeSpace | CustomSpace;

export function negateSpace(space: Space): NegativeSpace {
  return typeof space === 'object'
    ? { custom: -space.custom }
    : spaceToNegativeSpace[space];
}
