// import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
// import { beforeAll, expect, test } from 'vitest';

// import {
//   ENS_MAINNET_ASSET,
//   ETH_MAINNET_ASSET,
//   TEST_ADDRESS_2,
//   USDC_ARBITRUM_ASSET,
//   delay,
// } from '~/test/utils';

// import { createTestWagmiClient } from '../wagmi/createTestWagmiClient';

// import {
//   createUnlockAndCrosschainSwapRap,
//   estimateUnlockAndCrosschainSwap,
// } from './unlockAndCrosschainSwap';

// let swapGasLimit = 0;

// const needsUnlockQuote: Quote | QuoteError | null = {
//   chainId: 1,
//   buyAmount: '22815411',
//   buyAmountDisplay: '22815411',
//   buyAmountInEth: '7674057708816777',
//   buyTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
//   data: '0x415565b0000000000000000000000000c18360217d8f7ab5e7c516566761ea12ce7f9d72000...',
//   defaultGasLimit: '350000',
//   fee: '8500000000000000',
//   feeInEth: '62648258821781',
//   feePercentageBasisPoints: 8500000000000000,
//   from: '0x5B570F0F8E2a29B7bCBbfC000f9C7b78D45b7C35',
//   protocols: [
//     {
//       name: 'Uniswap_V3',
//       part: 100,
//     },
//   ],
//   sellAmount: '1000000000000000000',
//   sellAmountDisplay: '1000000000000000000',
//   sellAmountInEth: '7370383390797876',
//   sellAmountMinusFees: '991500000000000000',
//   sellTokenAddress: '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72',
//   swapType: 'normal',
//   to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
//   tradeAmountUSD: 21.84463710898238,
//   value: '0',
// };

// const doesntNeedUnlockQuote: Quote | QuoteError | null = {
//   chainId: 1,
//   buyAmount: '2934529154',
//   buyAmountDisplay: '2934529154',
//   buyAmountInEth: '988585673036047522',
//   buyTokenAddress: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
//   data: '0x37c6145a...',
//   defaultGasLimit: '520000',
//   fee: '10978750000000000',
//   feeInEth: '10978750000000000',
//   feePercentageBasisPoints: 10978750000000000,
//   from: TEST_ADDRESS_2,
//   protocols: [
//     {
//       name: 'rainbow',
//       part: 100,
//     },
//     {
//       name: 'hop',
//       part: 100,
//     },
//   ],
//   sellAmount: '1000000000000000000',
//   sellAmountDisplay: '1000000000000000000',
//   sellAmountInEth: '1000000000000000000',
//   sellAmountMinusFees: '989021250000000000',
//   sellTokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
//   swapType: 'cross-chain',
//   to: TEST_ADDRESS_2,
//   tradeAmountUSD: 2963.84,
//   value: '0x0de0b6b3a7640000',
// };

// beforeAll(async () => {
//   createTestWagmiClient();
//   await delay(3000);
// });

// test.skip('[rap/unlockAndCrosschainSwap] :: estimate unlock and crosschain swap rap without unlock', async () => {
//   const gasLimit = await estimateUnlockAndCrosschainSwap({
//     quote: doesntNeedUnlockQuote as CrosschainQuote,
//     chainId: 1,
//     assetToSell: ETH_MAINNET_ASSET,
//     sellAmount: '1000000000000000000',
//     assetToBuy: USDC_ARBITRUM_ASSET,
//   });
//   swapGasLimit = Number(gasLimit);
//   expect(swapGasLimit).toBeGreaterThan(0);
// });

// test.skip('[rap/unlockAndCrosschainSwap] :: estimate unlock and crosschain swap rap with unlock', async () => {
//   const gasLimit = await estimateUnlockAndCrosschainSwap({
//     quote: needsUnlockQuote as CrosschainQuote,
//     chainId: 1,
//     assetToSell: ENS_MAINNET_ASSET,
//     sellAmount: '1000000000000000000',
//     assetToBuy: USDC_ARBITRUM_ASSET,
//   });
//   expect(Number(gasLimit)).toBeGreaterThan(0);
//   expect(Number(gasLimit)).toBeGreaterThan(swapGasLimit);
// });

// test('[rap/unlockAndCrosschainSwap] :: create unlock and crosschain swap rap without unlock', async () => {
//   const rap = await createUnlockAndCrosschainSwapRap({
//     quote: doesntNeedUnlockQuote as CrosschainQuote,
//     chainId: 1,
//     sellAmount: '1000000000000000000',
//     assetToSell: ETH_MAINNET_ASSET,
//     assetToBuy: USDC_ARBITRUM_ASSET,
//   });
//   expect(rap.actions.length).toBe(1);
// });

// test('[rap/unlockAndCrosschainSwap] :: create unlock and crosschain swap rap with unlock', async () => {
//   const rap = await createUnlockAndCrosschainSwapRap({
//     quote: needsUnlockQuote as CrosschainQuote,
//     chainId: 1,
//     sellAmount: '1000000000000000000',
//     assetToSell: ENS_MAINNET_ASSET,
//     assetToBuy: USDC_ARBITRUM_ASSET,
//   });
//   expect(rap.actions.length).toBe(2);
// });
