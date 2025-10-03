import { isNativeAsset } from '@/handlers/assets';
import { divWorklet, powWorklet, subWorklet } from '@/safe-math/SafeMath';
import { ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowStore } from '@/state/internal/types';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { GasSpeed } from '@/__swaps__/types/gas';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';

type PerpsDepositStoreState = PerpsDepositState & PerpsDepositActions;

type PerpsDepositState = {
  asset: ExtendedAnimatedAssetWithColors | null;
  listChainId: ChainId | undefined;
  gasSpeed: GasSpeed;
};

type PerpsDepositActions = {
  getAsset: () => ExtendedAnimatedAssetWithColors | null;
  getAssetChainId: () => ChainId;
  getAssetDecimals: () => number;
  getGasSpeed: () => GasSpeed;
  getListChainId: () => ChainId | undefined;
  hasAsset: () => boolean;
  setAsset: (asset: ExtendedAnimatedAssetWithColors | null) => void;
  setGasSpeed: (gasSpeed: GasSpeed) => void;
  setListChainId: (chainId: ChainId | undefined) => void;
};

export type PerpsDepositStoreType = RainbowStore<PerpsDepositStoreState>;

export function createPerpsDepositStore(initialAsset: ExtendedAnimatedAssetWithColors | null, initialGasSpeed: GasSpeed) {
  return createRainbowStore<PerpsDepositStoreState>((set, get) => ({
    asset: initialAsset,
    listChainId: undefined,
    gasSpeed: initialGasSpeed,

    getAsset: () => get().asset,
    getAssetChainId: () => get().asset?.chainId ?? ChainId.mainnet,
    getAssetDecimals: () => get().asset?.decimals ?? 18,
    getGasSpeed: () => get().gasSpeed,
    getListChainId: () => get().listChainId,
    hasAsset: () => get().asset !== null,

    setAsset: asset =>
      set(state => {
        if (state.asset === asset) return state;
        return { asset };
      }),

    setGasSpeed: gasSpeed =>
      set(state => {
        if (state.gasSpeed === gasSpeed) return state;
        return { gasSpeed };
      }),

    setListChainId: chainId =>
      set(state => {
        if (state.listChainId === chainId) return state;
        return { listChainId: chainId };
      }),
  }));
}

export function computeMaxSwappableAmount(
  asset: ExtendedAnimatedAssetWithColors | null,
  gasSettings: GasSettings | undefined,
  gasLimit: string | undefined
): string | undefined {
  if (!asset?.balance.amount) return undefined;

  const gasFee = gasSettings != null && gasLimit != null ? calculateGasFeeWorklet(gasSettings, gasLimit) : null;

  if (gasFee != null && isNativeAsset(asset.address, asset.chainId)) {
    return subWorklet(asset.balance.amount, divWorklet(gasFee, powWorklet(10, asset.decimals)));
  }

  return asset.balance.amount;
}
