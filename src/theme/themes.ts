export const Themes = Object.freeze({
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
});

export type ThemesType = (typeof Themes)[keyof typeof Themes];
