import React from 'react';

export type DesignSystemContextValue = {
  experimentalFlags: {
    androidShadowsV2?: boolean;
  };
};

export const DesignSystemContext = React.createContext<DesignSystemContextValue>(
  {
    experimentalFlags: {
      androidShadowsV2: false,
    },
  }
);
