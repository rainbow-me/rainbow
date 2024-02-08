import React from 'react';

import { ColorMode, ColorModeProvider } from '../color/ColorMode';

export function DesignSystemProvider({ children, colorMode }: { children: React.ReactNode; colorMode: ColorMode }) {
  return <ColorModeProvider value={colorMode}>{children}</ColorModeProvider>;
}
