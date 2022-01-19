import React from 'react';

import { ColorModeProvider } from '../color/ColorMode';
import { ColorMode } from '../color/palettes';
import {
  DesignSystemContext,
  DesignSystemContextValue,
} from './private/DesignSystemContext';

export function DesignSystemProvider({
  children,
  colorMode,
  experimentalFlags = {},
}: {
  children: React.ReactNode;
  colorMode: ColorMode;
  experimentalFlags?: DesignSystemContextValue['experimentalFlags'];
}) {
  return (
    <DesignSystemContext.Provider value={{ experimentalFlags }}>
      <ColorModeProvider value={colorMode}>{children}</ColorModeProvider>
    </DesignSystemContext.Provider>
  );
}
