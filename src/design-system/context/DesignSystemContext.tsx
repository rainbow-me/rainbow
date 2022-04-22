import React from 'react';

import { ColorMode, ColorModeProvider } from '../color/ColorMode';
import {
  ExperimentalFlags,
  ExperimentalFlagsProvider,
} from './ExperimentalFlagsContext';

const defaultExperimentalFlags = {
  androidShadowsV2: false,
};

type DesignSystemContextValue = {
  experimentalFlags: {
    androidShadowsV2?: boolean;
  };
};

const DesignSystemContext = React.createContext<DesignSystemContextValue>({
  experimentalFlags: defaultExperimentalFlags,
});

export function DesignSystemProvider({
  children,
  colorMode,
  experimentalFlags = defaultExperimentalFlags,
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
