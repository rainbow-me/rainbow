import { useCleanupOnExit } from '../hooks/useCleanupOnExit';

export const CleanupAssetsOnUnmount = () => {
  useCleanupOnExit();
  return null;
};
