import type { Colors } from '../styles/colors';

interface CurrentColors {
  theme: 'dark' | 'light';
  themedColors: Colors | null;
}

const currentColors: CurrentColors = {
  theme: 'light',
  themedColors: null,
};

export default currentColors;
