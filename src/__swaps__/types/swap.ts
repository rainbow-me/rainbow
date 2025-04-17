import { ExtendedAnimatedAssetWithColors } from './assets';

export type InputKeys = 'inputAmount' | 'inputNativeValue' | 'outputAmount' | 'outputNativeValue';
export type InputMethods = InputKeys | 'slider';
export type InputValues = { [key in InputKeys]: number | string };

export type SettingsKeys = 'swapFee' | 'slippage';

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
  inputAmount: InputValues['inputAmount'];
  lastTypedInput: InputKeys;
  outputAmount: InputValues['outputAmount'];
}

export type RecentSwap = {
  swappedAt: number;
} & ExtendedAnimatedAssetWithColors;
