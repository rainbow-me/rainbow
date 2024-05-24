import { useCleanupOnExit } from '../hooks/useCleanupOnExit';
import { useSwapContext } from '../providers/swap-provider';

export const CleanupAssetsOnUnmount = () => {
  const { SwapInputsController, inputProgress, outputProgress, internalSelectedInputAsset, internalSelectedOutputAsset } = useSwapContext();

  useCleanupOnExit({
    SwapInputsController,
    inputProgress,
    outputProgress,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
  });

  return null;
};
