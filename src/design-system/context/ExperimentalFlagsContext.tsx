import React from 'react';

export type ExperimentalFlags = {
  androidShadowsV2?: boolean;
};

const ExperimentalFlagsContext = React.createContext<ExperimentalFlags>({
  androidShadowsV2: false,
});

export function ExperimentalFlagsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ExperimentalFlags;
}) {
  return (
    <ExperimentalFlagsContext.Provider value={value}>
      {children}
    </ExperimentalFlagsContext.Provider>
  );
}

export function useExperimentalFlags() {
  return React.useContext(ExperimentalFlagsContext);
}
