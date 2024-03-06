import * as React from 'react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { Button } from './Button';
import * as modes from './colorModes.css';
import { sprinkles } from './sprinkles.css';

type ColorMode = 'dark' | 'light';
export const themeKey = 'rainbow-theme-pref';

interface ColorModeContextValues {
  colorMode: ColorMode | null;
  setColorMode: (colorMode: ColorMode) => void;
}

export const ColorModeContext = createContext<ColorModeContextValues>({
  colorMode: null,
  setColorMode: () => {},
});

export function ColorModeProvider({ children }: { children: ReactNode | ((colorMode: ColorMode) => ReactNode) }) {
  const [colorMode, setColorMode] = useState<ColorMode>('light');

  useEffect(() => {
    const currentColorMode = document.documentElement.classList.contains(modes.dark) ? 'dark' : 'light';
    document.documentElement.classList.add(modes[currentColorMode]);
    setColorMode(currentColorMode);
  }, []);

  const _setColorMode = (newColorMode: ColorMode) => {
    setColorMode(newColorMode);

    document.documentElement.classList.remove(modes.light, modes.dark);
    document.documentElement.classList.add(modes[newColorMode]);

    try {
      localStorage.setItem(themeKey, newColorMode);
    } catch (e) {} // eslint-disable-line no-empty
  };

  return (
    <ColorModeContext.Provider
      value={{
        colorMode,
        setColorMode: _setColorMode,
      }}
    >
      {typeof children === 'function' ? children(colorMode) : children}
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);

export function ColorModeToggle() {
  const { colorMode, setColorMode } = useColorMode();
  return (
    <div
      className={sprinkles({
        position: 'fixed',
        right: '16px',
        top: '16px',
      })}
    >
      <Button onClick={() => setColorMode(colorMode === 'light' ? 'dark' : 'light')}>
        <div className={sprinkles({ fontSize: '32px' })}>{colorMode === 'light' ? '🌞' : '🌛'}</div>
      </Button>
    </div>
  );
}

export function InitColorModeScript() {
  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `try{var mode=localStorage.getItem("${themeKey}"),defaultMode=matchMedia("(prefers-color-scheme:dark)").matches?"${modes.dark}":"${modes.light}";document.documentElement.classList.add(mode||defaultMode)}catch(e){}`,
      }}
    />
  );
}
