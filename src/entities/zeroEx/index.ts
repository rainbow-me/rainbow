export interface ZeroExQuote {
  allowanceTarget: string;
  buyAmount: string;
  buyTokenAddress: string;
  buyTokenToEthRate: string;
  data: string;
  estimatedGas: string;
  gas: string;
  gasPrice: string;
  guaranteedPrice: string;
  minimumProtocolFee: string;
  orders: string[];
  price: string;
  protocolFee: string;
  sellAmount: string;
  sellTokenAddress: string;
  sellTokenToEthRate: string;
  sources: string[];
  to: string;
  value: string;
}

export interface ZeroExPayload {
  allowanceTarget: string;
  swapPayload: string;
  swapTarget: string;
}
