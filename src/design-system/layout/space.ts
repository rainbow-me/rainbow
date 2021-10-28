/* eslint-disable sort-keys-fix/sort-keys-fix */
export const space = {
  '3px': 3,
  '6px': 6,
  '10px': 10,
  '12px': 12,
  '15px': 15,
  '19px': 19,
  '24px': 24,
  '30px': 30,
  '42px': 42,
} as const;

export type Space = keyof typeof space;

export const negativeSpace = {
  '-3px': -3,
  '-6px': -6,
  '-10px': -10,
  '-12px': -12,
  '-15px': -15,
  '-19px': -19,
  '-24px': -24,
  '-30px': -30,
  '-42px': -42,
} as const;

export type NegativeSpace = keyof typeof negativeSpace;

const spaceToNegativeSpace: Record<Space, NegativeSpace> = {
  '3px': '-3px',
  '6px': '-6px',
  '10px': '-10px',
  '12px': '-12px',
  '15px': '-15px',
  '19px': '-19px',
  '24px': '-24px',
  '30px': '-30px',
  '42px': '-42px',
};

export const negateSpace = (space: Space): NegativeSpace =>
  spaceToNegativeSpace[space];
