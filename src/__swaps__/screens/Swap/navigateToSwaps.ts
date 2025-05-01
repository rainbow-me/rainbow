import { enableActionsOnReadOnlyWallet } from '@/config';
import walletTypes from '@/helpers/walletTypes';
import { getRemoteConfig } from '@/model/remoteConfig';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import store from '@/redux/store';
import { divWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { SwapsState, useSwapsStore } from '@/state/swaps/swapsStore';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { GasSpeed } from '@/__swaps__/types/gas';
import { InputKeys, InputMethods } from '@/__swaps__/types/swap';
import {
  getDefaultSlippage,
  parseAssetAndExtend,
  slippageInBipsToString,
  trimCurrencyZeros,
  trimTrailingZeros,
} from '@/__swaps__/utils/swaps';
import { getInputValuesForSliderPositionWorklet } from '@/__swaps__/utils/flipAssets';
import { watchingAlert } from '@/utils';
import { INITIAL_SLIDER_POSITION, SLIDER_WIDTH } from './constants';
import { setSelectedGasSpeed } from './hooks/useSelectedGas';

// ============ navigateToSwaps ================================================ //

export type NavigateToSwapsParams<
  AssetType extends ExtendedAnimatedAssetWithColors | ParsedSearchAsset | null = ExtendedAnimatedAssetWithColors | ParsedSearchAsset | null,
> = Partial<
  Pick<SwapsState, 'slippage'> & {
    focusedInput: InputKeys;
    gasSpeed: GasSpeed;
    goBackOnSwapSubmit?: boolean;
    inputAsset: AssetType;
    outputAsset: AssetType;
    trackQuickBuyMetadata?: boolean;
  } & InputAmountRequest
>;

export function navigateToSwaps(params: NavigateToSwapsParams = {}) {
  if (!enableActionsOnReadOnlyWallet && isCurrentWalletReadOnly()) return watchingAlert();

  const chainId = params.inputAsset?.chainId || params.outputAsset?.chainId || store.getState().settings.chainId;
  if (params.gasSpeed && chainId) setSelectedGasSpeed(chainId, params.gasSpeed);

  const inputAsset = getInputAsset(params.inputAsset);
  const outputAsset = getOutputAsset(params.outputAsset);
  const inputMethod = getInputMethod({ ...params, inputAsset, outputAsset });
  const focusedInput = params.focusedInput ?? (inputMethod === 'slider' ? 'inputAmount' : inputMethod);

  const inputAmounts = getInputAmounts({ ...params, inputAsset, outputAsset });
  const inputChainId = inputAsset?.chainId || ChainId.mainnet;
  const quickBuyMetadata = params.trackQuickBuyMetadata ? getQuickBuyMetadata({ inputAmounts, inputAsset, outputAsset }) : undefined;
  const slippage =
    params.slippage && !isNaN(+params.slippage)
      ? slippageInBipsToString(+params.slippage)
      : getDefaultSlippage(inputChainId, getRemoteConfig().default_slippage_bips_chainId);

  useSwapsStore.setState(state => ({
    inputAsset,
    isSwapsOpen: true,
    outputAsset,
    percentageToSell: inputAmounts.percentageToSell,
    selectedOutputChainId: inputAsset?.chainId ?? state.preferredNetwork ?? state.selectedOutputChainId ?? ChainId.mainnet,
    slippage,
  }));

  Navigation.handleAction(Routes.SWAP, {
    ...inputAmounts,
    focusedInput,
    goBackOnSwapSubmit: params.goBackOnSwapSubmit ?? false,
    inputAsset,
    inputMethod,
    lastTypedInput: focusedInput,
    outputAsset,
    quickBuyMetadata,
    slippage,
  } satisfies SwapsParams);
}

// ============ getSwapsNavigationParams ======================================= //

export type SwapsParams = InputAmountsToSet & {
  focusedInput: InputKeys;
  goBackOnSwapSubmit: boolean;
  inputAsset: ExtendedAnimatedAssetWithColors | null;
  inputMethod: InputMethods;
  lastTypedInput: InputKeys;
  outputAsset: ExtendedAnimatedAssetWithColors | null;
  quickBuyMetadata:
    | {
        buyAmount: string;
        inputAssetUniqueId: string;
        nativeCurrencyBuyAmount: string;
        outputAssetUniqueId: string;
      }
    | undefined;
  slippage: string;
};

export function getSwapsNavigationParams(): SwapsParams {
  let params = Navigation.getActiveRoute<typeof Routes.SWAP>()?.params;
  if (!params) params = getFallbackParams();
  return params;
}

function getFallbackParams(): SwapsParams {
  const inputAsset = getInputAsset(null);
  const chainId = inputAsset?.chainId ?? store.getState().settings.chainId;
  return {
    focusedInput: 'inputAmount',
    goBackOnSwapSubmit: false,
    inputAsset,
    inputMethod: 'inputAmount',
    lastTypedInput: 'inputAmount',
    outputAsset: null,
    quickBuyMetadata: undefined,
    slippage: getDefaultSlippage(chainId, getRemoteConfig().default_slippage_bips_chainId),
    ...getInputAmounts({ inputAsset }),
  };
}

// ============ Helper Types =================================================== //

type InputAmountsToSet = {
  inputAmount: string | number;
  inputNativeValue: string | number;
  percentageToSell?: number | undefined;
};

type InputAmountRequest =
  | {
      inputAmount: string;
      inputNativeValue: undefined;
      percentageToSell: undefined;
    }
  | {
      inputAmount: undefined;
      inputNativeValue: string | number;
      percentageToSell: undefined;
    }
  | {
      inputAmount: undefined;
      inputNativeValue: undefined;
      percentageToSell: number;
    };

// ============ Helper Functions =============================================== //

function isCurrentWalletReadOnly(): boolean {
  return store.getState().wallets.selected?.type === walletTypes.readOnly;
}

function isExtendedAssetWithColors(
  asset: ExtendedAnimatedAssetWithColors | ParsedSearchAsset | null
): asset is ExtendedAnimatedAssetWithColors {
  return asset !== null && 'highContrastColor' in asset;
}

function getInputAsset(
  asset: ExtendedAnimatedAssetWithColors | ParsedSearchAsset | null | undefined
): ExtendedAnimatedAssetWithColors | null {
  if (!asset) return parseAssetAndExtend({ asset: useUserAssetsStore.getState().getHighestValueNativeAsset() });
  if (isExtendedAssetWithColors(asset)) return asset;
  return parseAssetAndExtend({ asset, insertUserAssetBalance: true });
}

function getOutputAsset(
  asset: ExtendedAnimatedAssetWithColors | ParsedSearchAsset | null | undefined
): ExtendedAnimatedAssetWithColors | null {
  if (!asset) return null;
  if (isExtendedAssetWithColors(asset)) return asset;
  return parseAssetAndExtend({ asset, insertUserAssetBalance: true });
}

function getInputMethod(params: NavigateToSwapsParams): InputMethods {
  if (params.percentageToSell) return 'slider';
  if (params.inputAsset && params.inputNativeValue) return 'inputNativeValue';
  if (params.inputAsset && params.inputAmount) return 'inputAmount';
  return 'slider';
}

function getInputAmounts(params: NavigateToSwapsParams<ExtendedAnimatedAssetWithColors | null>): InputAmountsToSet {
  const nativePrice = params.inputAsset?.nativePrice ?? params.inputAsset?.price?.value ?? 0;

  if (params.inputAmount) {
    return {
      inputAmount: trimTrailingZeros(toFixedWorklet(params.inputAmount, params.inputAsset?.decimals ?? 18)),
      inputNativeValue: mulWorklet(params.inputAmount, nativePrice),
    };
  }

  if (params.inputNativeValue) {
    const inputAmount = toFixedWorklet(divWorklet(params.inputNativeValue, nativePrice), params.inputAsset?.decimals ?? 18);
    const currency = userAssetsStoreManager.getState().currency;
    return {
      inputAmount,
      inputNativeValue: trimCurrencyZeros(params.inputNativeValue, currency),
    };
  }

  const percentageToSell = params.percentageToSell ?? INITIAL_SLIDER_POSITION;

  return {
    ...getInputValuesForSliderPositionWorklet({
      inputNativePrice: nativePrice,
      percentageToSwap: percentageToSell,
      selectedInputAsset: params.inputAsset ?? null,
      sliderXPosition: percentageToSell * SLIDER_WIDTH,
    }),
    percentageToSell,
  };
}

function getQuickBuyMetadata({
  inputAmounts,
  inputAsset,
  outputAsset,
}: {
  inputAmounts: InputAmountsToSet;
  inputAsset: ExtendedAnimatedAssetWithColors | null;
  outputAsset: ExtendedAnimatedAssetWithColors | null;
}): Required<SwapsParams['quickBuyMetadata']> {
  return {
    buyAmount: inputAmounts.inputAmount.toString(),
    inputAssetUniqueId: inputAsset?.uniqueId ?? 'None',
    nativeCurrencyBuyAmount: inputAmounts.inputNativeValue.toString(),
    outputAssetUniqueId: outputAsset?.uniqueId ?? 'None',
  };
}
