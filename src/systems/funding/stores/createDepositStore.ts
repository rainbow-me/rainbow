import { isNativeAsset } from '@/handlers/assets';
import { divWorklet, greaterThanWorklet, powWorklet, subWorklet } from '@/framework/core/safeMath';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { GasSpeed } from '@/__swaps__/types/gas';
import { DepositConfig, DepositStoreState, DepositStoreType } from '../types';

// ============ Deposit Store Factory ========================================= //

export function createDepositStore(
  config: DepositConfig,
  initialAsset: ExtendedAnimatedAssetWithColors | null,
  initialGasSpeed: GasSpeed
): DepositStoreType {
  return createRainbowStore<DepositStoreState>((set, get) => ({
    asset: initialAsset,
    gasSpeed: initialGasSpeed,
    listChainId: undefined,

    getAsset: () => get().asset,
    getAssetChainId: () => (get().asset?.chainId != null ? Number(get().asset?.chainId) : config.to.chainId),
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

// ============ Max Swappable Amount ========================================== //

export function computeMaxSwappableAmount(
  asset: ExtendedAnimatedAssetWithColors | null,
  gasSettings: GasSettings | undefined,
  gasLimit: string | undefined
): string | undefined {
  if (!asset?.balance.amount) return undefined;

  const gasFee = gasSettings != null && gasLimit != null ? calculateGasFeeWorklet(gasSettings, gasLimit) : null;

  if (gasFee != null && isNativeAsset(asset.address, asset.chainId)) {
    const result = subWorklet(asset.balance.amount, divWorklet(gasFee, powWorklet(10, asset.decimals)));
    return greaterThanWorklet(result, '0') ? result : '0';
  }

  return asset.balance.amount;
}
