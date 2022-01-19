import React from 'react';

import { ColorMode, ColorModeProvider } from '../color/ColorMode';
import {
  ExperimentalFlags,
  ExperimentalFlagsProvider,
} from './ExperimentalFlagsContext';

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
  experimentalFlags?: ExperimentalFlags;
}) {
  return (
    <ExperimentalFlagsProvider value={experimentalFlags}>
      <ColorModeProvider value={colorMode}>{children}</ColorModeProvider>
    </ExperimentalFlagsProvider>
  );
}

export function useExperimentalFlags() {
  return React.useContext(DesignSystemContext).experimentalFlags;
}
