import { ExtendedAnimatedAssetWithColors } from './assets';

export type inputKeys = 'inputAmount' | 'inputNativeValue' | 'outputAmount' | 'outputNativeValue';
export type inputMethods = inputKeys | 'slider';
export type inputValuesType = { [key in inputKeys]: number | string };

export type settingsKeys = 'swapFee' | 'slippage';

export enum SortMethod {
  token = 'token',
  chain = 'chain',
}

export enum SwapAssetType {
  inputAsset = 'inputAsset',
  outputAsset = 'outputAsset',
}

export interface RequestNewQuoteParams {
  assetToBuyUniqueId: string | undefined;
  assetToSellUniqueId: string | undefined;
  inputAmount: inputValuesType['inputAmount'];
  lastTypedInput: inputKeys;
  outputAmount: inputValuesType['outputAmount'];
}

export type RecentSwap = {
  swappedAt: number;
} & ExtendedAnimatedAssetWithColors;
