/* eslint-disable sort-keys */
export const palette = {
  appleBlue: '#0A84FF',
  greyDark: '#25292E',
  grey80: 'rgba(60, 66, 82, 0.8)',
  grey60: 'rgba(60, 66, 82, 0.6)',
  sky100: '#E0E8FF',
  sky80: 'rgba(88, 91, 100, 0.8)',
  sky60: 'rgba(88, 91, 100, 0.6)',
  white: '#FFFFFF',
} as const;

export const foreground = {
  neutral: { lightMode: palette.greyDark, darkMode: palette.sky100 },
  secondary: { lightMode: palette.grey80, darkMode: palette.sky80 },
  tertiary: { lightMode: palette.grey60, darkMode: palette.sky60 },
  action: palette.appleBlue,
  white: palette.white,
} as const;
