export type inputKeys =
  | 'inputAmount'
  | 'inputNativeValue'
  | 'inputUserBalance'
  | 'inputAddress'
  | 'inputSymbol'
  | 'inputIconUrl'
  | 'inputTokenColor'
  | 'inputTokenShadowColor'
  | 'inputChainId'
  | 'outputAmount'
  | 'outputNativeValue'
  | 'outputUserBalance'
  | 'outputAddress'
  | 'outputSymbol'
  | 'outputIconUrl'
  | 'outputTokenColor'
  | 'outputTokenShadowColor'
  | 'outputChainId';
export type settingsKeys = 'swapFee' | 'slippage' | 'flashbots';
export type inputMethods = inputKeys | 'slider';
export type SortMethod = 'token' | 'chain';
