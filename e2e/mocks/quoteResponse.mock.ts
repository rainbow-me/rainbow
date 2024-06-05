import { BigNumber } from '@ethersproject/bignumber';
import { QuoteParams } from '@rainbow-me/swaps';

export const quoteResponse = ({ fromAddress, buyTokenAddress, sellTokenAddress, buyAmount, sellAmount }: QuoteParams) => ({
  allowanceTarget: '0x111111125421ca6dc452d289314280a0f8842a65',
  buyAmount: buyAmount,
  buyAmountDisplay: buyAmount,
  buyAmountInEth: '267457542707662',
  buyAmountMinusFees: buyAmount,
  buyTokenAddress: buyTokenAddress,
  chainId: 1,
  data: '0xa76dfc3b00000000000000000000000000000000000000000000000000000000000f535800000000000000003b6d0340b4e16d0168e52d35cacd2c6185b44281ec28c9dcd6f29312',
  defaultGasLimit: '350000',
  fee: BigNumber.from(sellAmount).div(100),
  feeInEth: BigNumber.from(sellAmount).div(100),
  feePercentageBasisPoints: '8500000000000000',
  from: fromAddress,
  gasPrice: '24991566341',
  protocols: [
    {
      name: 'UNISWAP_V2',
      part: 100,
    },
  ],
  sellAmount: sellAmount,
  sellAmountDisplay: sellAmount,
  sellAmountInEth: sellAmount,
  sellAmountMinusFees: BigNumber.from(sellAmount).sub(BigNumber.from(sellAmount).div(100)),
  sellTokenAddress: sellTokenAddress,
  source: '1inch',
  swapType: 'normal',
  to: '0x111111125421ca6dc452d289314280a0f8842a65',
  tradeAmountUSD: 1.0239453,
  tradeType: 'exact_input',
  txTarget: '0x00000000009726632680fb29d3f7a9734e3010e2',
  value: sellAmount,
});
