export interface ZeroExQuote {
  price: string;
  guaranteedPrice: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  estimatedGas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  buyAmount: string;
  sellAmount: string;
  sources: string[];
  orders: string[];
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;
  allowanceTarget: string;
}

export interface ZeroExPayload {
  allowanceTarget: string;
  swapData: string;
  swapTarget: string;
}
