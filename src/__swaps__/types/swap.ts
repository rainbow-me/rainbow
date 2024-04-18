export type inputKeys = 'inputAmount' | 'inputNativeValue' | 'outputAmount' | 'outputNativeValue';
export type settingsKeys = 'swapFee' | 'slippage' | 'flashbots';
export type inputMethods = inputKeys | 'slider';
export enum SortMethod {
  token = 'token',
  chain = 'chain',
}
