import React from 'react';

import { ColorModeProvider } from './color/ColorMode';
import { ColorMode } from './color/palettes';

type DesignSystemContextValue = {
  experimentalFlags: {
    androidShadowsV2?: boolean;
  };
};

const DesignSystemContext = React.createContext<DesignSystemContextValue>({
  experimentalFlags: {
    androidShadowsV2: false,
  },
});

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

export function useExperimentalFlags() {
  return React.useContext(DesignSystemContext).experimentalFlags;
}
