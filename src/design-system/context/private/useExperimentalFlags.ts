import { useContext } from 'react';

import { DesignSystemContext } from './DesignSystemContext';

export function useExperimentalFlags() {
  return useContext(DesignSystemContext).experimentalFlags;
}
