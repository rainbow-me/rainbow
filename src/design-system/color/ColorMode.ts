import { createContext, useContext } from 'react';

export type ColorMode = 'lightMode' | 'darkMode';
const ColorModeContext = createContext<ColorMode>('lightMode');

export const ColorModeProvider = ColorModeContext.Provider;
export const useColorMode = () => useContext(ColorModeContext);
