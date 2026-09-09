import type { Colors } from '../styles/colors';

interface CurrentColors {
  theme: 'dark' | 'light';
  themedColors: Colors | null;
}

export const currentColors: CurrentColors = {
  theme: 'light',
  themedColors: null,
};
