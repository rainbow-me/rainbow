const fraction = (numerator: number, denominator: number) => `${(numerator * 100) / denominator}%`;

export const widths = {
  '1/2': fraction(1, 2),
  '1/3': fraction(1, 3),
  '1/4': fraction(1, 4),
  '1/5': fraction(1, 5),
  '2/3': fraction(2, 3),
  '2/5': fraction(2, 5),
  '3/4': fraction(3, 4),
  '3/5': fraction(3, 5),
  '4/5': fraction(4, 5),
  'full': '100%',
} as const;

export const heights = {
  '1/2': fraction(1, 2),
  '1/3': fraction(1, 3),
  '1/4': fraction(1, 4),
  '1/5': fraction(1, 5),
  '104px': 104,
  '126px': 126,
  '2/3': fraction(2, 3),
  '2/5': fraction(2, 5),
  '3/4': fraction(3, 4),
  '3/5': fraction(3, 5),
  '30px': 30,
  '36px': 36,
  '4/5': fraction(4, 5),
  '40px': 40,
  '46px': 46,
  '56px': 56,
  '64px': 64,
  '68px': 68,
  'full': '100%',
} as const;

type CustomSize = { custom: number };
export type Width = keyof typeof widths | CustomSize;
export type Height = keyof typeof heights | CustomSize;
