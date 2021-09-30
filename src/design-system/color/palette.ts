/* eslint-disable sort-keys-fix/sort-keys-fix */
export const palette = {
  appleBlue: '#0A84FF',
  greyDark: '#25292E',
  grey100: '#3C4242',
  grey80: 'rgba(60, 66, 82, 0.8)',
  grey70: 'rgba(60, 66, 82, 0.7)',
  grey60: 'rgba(60, 66, 82, 0.6)',
  grey50: 'rgba(60, 66, 82, 0.5)',
  grey40: 'rgba(60, 66, 82, 0.4)',
  grey30: 'rgba(60, 66, 82, 0.3)',
  sky100: '#E0E8FF',
  sky80: 'rgba(88, 91, 100, 0.8)',
  sky70: 'rgba(88, 91, 100, 0.7)',
  sky60: 'rgba(88, 91, 100, 0.6)',
  sky50: 'rgba(88, 91, 100, 0.5)',
  sky40: 'rgba(88, 91, 100, 0.4)',
  sky30: 'rgba(88, 91, 100, 0.3)',
  white: '#FFFFFF',
} as const;

export const foreground = {
  neutral: { lightMode: palette.greyDark, darkMode: palette.sky100 },
  secondary: { lightMode: palette.grey100, darkMode: palette.sky100 },
  secondary80: { lightMode: palette.grey80, darkMode: palette.sky80 },
  secondary70: { lightMode: palette.grey70, darkMode: palette.sky70 },
  secondary60: { lightMode: palette.grey60, darkMode: palette.sky60 },
  secondary50: { lightMode: palette.grey50, darkMode: palette.sky50 },
  secondary40: { lightMode: palette.grey40, darkMode: palette.sky40 },
  secondary30: { lightMode: palette.grey30, darkMode: palette.sky30 },
  action: palette.appleBlue,
  white: palette.white,
} as const;
