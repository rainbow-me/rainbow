import { UniqueId } from './assets';

export type inputKeys = 'inputAmount' | 'inputNativeValue' | 'outputAmount' | 'outputNativeValue';
export type settingsKeys = 'swapFee' | 'slippage' | 'flashbots';
export type inputMethods = inputKeys | 'slider';
export enum SortMethod {
  token = 'token',
  chain = 'chain',
}

export enum SwapAssetType {
  inputAsset = 'inputAsset',
  outputAsset = 'outputAsset',
}

export type PrefillAssetData = {
  // assets
  inputAssetUniqueId?: UniqueId;
  outputAssetUniqueId?: UniqueId;

  // amounts
  percentageOfInputAssetToSell?: number;
  percentageOfOutputAssetToBuy?: number;
  amountOfInputAssetToSell?: number;
  amountOfOutputAssetToBuy?: number;
};
