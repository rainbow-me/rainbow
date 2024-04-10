export type inputKeys = 'inputAmount' | 'inputNativeValue' | 'outputAmount' | 'outputNativeValue';
export type settingsKeys = 'swapFee' | 'slippage' | 'flashbots';
export type inputMethods = inputKeys | 'slider';
export type SortMethod = 'token' | 'chain';
export enum assets {
  assetToSell = 'assetToSell',
  assetToBuy = 'assetToBuy',
}
