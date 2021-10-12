/* eslint-disable sort-keys-fix/sort-keys-fix */
const semanticSpace = {
  gutter: 19,
};

export const space = {
  gutter: semanticSpace.gutter, // eslint-disable-line prettier/prettier
  '3dp': 3,
  '6dp': 6,
  '10dp': 10,
  '12dp': 12,
  '15dp': 15,
  '19dp': 19,
  '24dp': 24,
  '30dp': 30,
  '42dp': 42,
} as const;

export type Space = keyof typeof space;

export const negativeSpace = {
  '-gutter': -semanticSpace.gutter,
  '-3dp': -3,
  '-6dp': -6,
  '-10dp': -10,
  '-12dp': -12,
  '-15dp': -15,
  '-19dp': -19,
  '-24dp': -24,
  '-30dp': -30,
  '-42dp': -42,
} as const;

export type NegativeSpace = keyof typeof negativeSpace;

const spaceToNegativeSpace: Record<Space, NegativeSpace> = {
  gutter: '-gutter', // eslint-disable-line prettier/prettier
  '3dp': '-3dp',
  '6dp': '-6dp',
  '10dp': '-10dp',
  '12dp': '-12dp',
  '15dp': '-15dp',
  '19dp': '-19dp',
  '24dp': '-24dp',
  '30dp': '-30dp',
  '42dp': '-42dp',
};

export const negateSpace = (space: Space): NegativeSpace =>
  spaceToNegativeSpace[space];
