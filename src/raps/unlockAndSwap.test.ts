// import { Wallet } from '@ethersproject/wallet';
// import {
//   ChainId,
//   ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
//   Quote,
//   QuoteError,
//   SwapType,
//   getQuote,
// } from '@rainbow-me/swaps';
// import { getProvider } from '@wagmi/core';
// import { beforeAll, expect, test } from 'vitest';

// import {
//   ENS_MAINNET_ASSET,
//   ETH_MAINNET_ASSET,
//   TEST_ADDRESS_2,
//   TEST_PK_1,
//   USDC_MAINNET_ASSET,
//   WETH_MAINNET_ASSET,
//   delay,
// } from '~/test/utils';

// import { gasStore } from '../state';
// import { GasSpeed } from '../types/gas';
// import { createTestWagmiClient } from '../wagmi/createTestWagmiClient';

// import { walletExecuteRap } from './execute';
// import { createUnlockAndSwapRap, estimateUnlockAndSwap } from './unlockAndSwap';

// let swapGasLimit = 0;

// let needsUnlockQuote: Quote | QuoteError | null;
// let doesntNeedUnlockQuote: Quote | QuoteError | null;
// let ethToEnsQuote: Quote | QuoteError | null;
// let unwrapEthQuote: Quote | QuoteError | null;
// let wrapEthQuote: Quote | QuoteError | null;

// const SELECTED_GAS = {
//   display: '73 - 86 Gwei',
//   estimatedTime: { amount: 15, display: '~ 15 sec' },
//   gasFee: { amount: '4323764263200000', display: '$8.64' },
//   maxBaseFee: {
//     amount: '800000000000',
//     display: '800 Gwei',
//     gwei: '800',
//   },
//   maxPriorityFeePerGas: {
//     amount: '3000000000',
//     display: '3 Gwei',
//     gwei: '3',
//   },
//   option: GasSpeed.NORMAL,
//   transactionGasParams: {
//     maxPriorityFeePerGas: '0xb2d05e00',
//     maxFeePerGas: '0xba43b74000',
//   },
// };

// beforeAll(async () => {
//   createTestWagmiClient();
//   await delay(3000);
//   doesntNeedUnlockQuote = await getQuote({
//     chainId: 1,
//     fromAddress: TEST_ADDRESS_2,
//     sellTokenAddress: ETH_ADDRESS_AGGREGATORS,
//     buyTokenAddress: USDC_MAINNET_ASSET.address,
//     sellAmount: '1000000000000000000',
//     slippage: 5,
//     destReceiver: TEST_ADDRESS_2,
//     swapType: SwapType.normal,
//     toChainId: 1,
//   });
//   ethToEnsQuote = await getQuote({
//     chainId: 1,
//     fromAddress: TEST_ADDRESS_2,
//     sellTokenAddress: ETH_MAINNET_ASSET.address,
//     buyTokenAddress: ENS_MAINNET_ASSET.address,
//     sellAmount: '1000000000000000000',
//     slippage: 5,
//     destReceiver: TEST_ADDRESS_2,
//     swapType: SwapType.normal,
//     toChainId: 1,
//   });
//   needsUnlockQuote = await getQuote({
//     chainId: 1,
//     fromAddress: TEST_ADDRESS_2,
//     sellTokenAddress: ENS_MAINNET_ASSET.address,
//     buyTokenAddress: USDC_MAINNET_ASSET.address,
//     sellAmount: '1000000000000000000',
//     slippage: 5,
//     destReceiver: TEST_ADDRESS_2,
//     swapType: SwapType.normal,
//     toChainId: 1,
//   });
//   wrapEthQuote = await getQuote({
//     chainId: 1,
//     fromAddress: TEST_ADDRESS_2,
//     sellTokenAddress: ETH_MAINNET_ASSET.address,
//     buyTokenAddress: WETH_MAINNET_ASSET.address,
//     sellAmount: '1000000000000000000',
//     slippage: 5,
//     destReceiver: TEST_ADDRESS_2,
//     swapType: SwapType.normal,
//     toChainId: 1,
//   });
//   unwrapEthQuote = await getQuote({
//     chainId: 1,
//     fromAddress: TEST_ADDRESS_2,
//     sellTokenAddress: WETH_MAINNET_ASSET.address,
//     buyTokenAddress: ETH_MAINNET_ASSET.address,
//     sellAmount: '100000000000000000',
//     slippage: 5,
//     destReceiver: TEST_ADDRESS_2,
//     swapType: SwapType.normal,
//     toChainId: 1,
//   });
// }, 10000);

// test.skip('[rap/unlockAndSwap] :: estimate unlock and swap rap without unlock', async () => {
//   const gasLimit = await estimateUnlockAndSwap({
//     quote: doesntNeedUnlockQuote as Quote,
//     chainId: 1,
//     assetToSell: ETH_MAINNET_ASSET,
//     sellAmount: '1000000000000000000',
//     assetToBuy: USDC_MAINNET_ASSET,
//   });
//   expect(Number(gasLimit)).toBeGreaterThan(0);
//   swapGasLimit = Number(gasLimit);
// });

// test.skip('[rap/unlockAndSwap] :: estimate unlock and swap rap with unlock', async () => {
//   const gasLimit = await estimateUnlockAndSwap({
//     quote: needsUnlockQuote as Quote,
//     chainId: 1,
//     assetToSell: ENS_MAINNET_ASSET,
//     sellAmount: '1000000000000000000',
//     assetToBuy: USDC_MAINNET_ASSET,
//   });
//   expect(Number(gasLimit)).toBeGreaterThan(0);
//   expect(Number(gasLimit)).toBeGreaterThan(swapGasLimit);
// });

// test('[rap/unlockAndSwap] :: create unlock and swap rap without unlock', async () => {
//   const rap = await createUnlockAndSwapRap({
//     quote: doesntNeedUnlockQuote as Quote,
//     chainId: 1,
//     sellAmount: '1000000000000000000',
//     assetToSell: ETH_MAINNET_ASSET,
//     assetToBuy: USDC_MAINNET_ASSET,
//   });
//   expect(rap.actions.length).toBe(1);
// });

// test('[rap/unlockAndSwap] :: create unlock and swap rap without unlock and execute it', async () => {
//   const provider = getProvider({ chainId: ChainId.mainnet });
//   const wallet = new Wallet(TEST_PK_1, provider);
//   const swap = await walletExecuteRap(wallet, 'swap', {
//     quote: doesntNeedUnlockQuote as Quote,
//     chainId: 1,
//     sellAmount: '1000000000000000000',
//     assetToSell: ETH_MAINNET_ASSET,
//     assetToBuy: USDC_MAINNET_ASSET,
//   });
//   expect(swap.nonce).toBeDefined();
// });

// test('[rap/unlockAndSwap] :: create unlock and swap rap with unlock', async () => {
//   const rap = await createUnlockAndSwapRap({
//     quote: needsUnlockQuote as Quote,
//     chainId: 1,
//     sellAmount: '1000000000000000000',
//     assetToSell: ENS_MAINNET_ASSET,
//     assetToBuy: USDC_MAINNET_ASSET,
//   });
//   expect(rap.actions.length).toBe(2);
// });

// test('[rap/unlockAndSwap] :: create swap rap and execute it', async () => {
//   const { setSelectedGas } = gasStore.getState();
//   setSelectedGas({
//     selectedGas: SELECTED_GAS,
//   });
//   const provider = getProvider({ chainId: ChainId.mainnet });
//   const wallet = new Wallet(TEST_PK_1, provider);
//   const swap = await walletExecuteRap(wallet, 'swap', {
//     quote: ethToEnsQuote as Quote,
//     chainId: 1,
//     sellAmount: '1000000000000000000',
//     assetToSell: ETH_MAINNET_ASSET,
//     assetToBuy: ENS_MAINNET_ASSET,
//   });
//   expect(swap.nonce).toBeDefined();
// });

// test('[rap/unlockAndSwap] :: create unlock and swap rap with unlock and execute it', async () => {
//   const { setSelectedGas } = gasStore.getState();
//   setSelectedGas({
//     selectedGas: SELECTED_GAS,
//   });
//   const provider = getProvider({ chainId: ChainId.mainnet });
//   const wallet = new Wallet(TEST_PK_1, provider);
//   const swap = await walletExecuteRap(wallet, 'swap', {
//     quote: needsUnlockQuote as Quote,
//     chainId: 1,
//     sellAmount: '1000000000000000000',
//     assetToSell: ENS_MAINNET_ASSET,
//     assetToBuy: USDC_MAINNET_ASSET,
//   });
//   expect(swap.nonce).toBeDefined();
// });

// test('[rap/unlockAndSwap] :: create unlock and wrap eth rap with unlock and execute it', async () => {
//   const { setSelectedGas } = gasStore.getState();
//   setSelectedGas({
//     selectedGas: SELECTED_GAS,
//   });
//   const provider = getProvider({ chainId: ChainId.mainnet });
//   const wallet = new Wallet(TEST_PK_1, provider);
//   const swap = await walletExecuteRap(wallet, 'swap', {
//     quote: wrapEthQuote as Quote,
//     chainId: 1,
//     sellAmount: '1000000000000000000',
//     assetToSell: ETH_MAINNET_ASSET,
//     assetToBuy: WETH_MAINNET_ASSET,
//   });
//   expect(swap.nonce).toBeDefined();
// });

// test('[rap/unlockAndSwap] :: create unwrap eth rap', async () => {
//   const rap = await createUnlockAndSwapRap({
//     quote: unwrapEthQuote as Quote,
//     chainId: 1,
//     sellAmount: '100000000000000000',
//     assetToSell: WETH_MAINNET_ASSET,
//     assetToBuy: ETH_MAINNET_ASSET,
//   });
//   expect(rap.actions.length).toBe(1);
// });

// test('[rap/unlockAndSwap] :: create unwrap weth rap and execute it', async () => {
//   const { setSelectedGas } = gasStore.getState();
//   setSelectedGas({
//     selectedGas: SELECTED_GAS,
//   });
//   const provider = getProvider({ chainId: ChainId.mainnet });
//   const wallet = new Wallet(TEST_PK_1, provider);
//   const swap = await walletExecuteRap(wallet, 'swap', {
//     quote: unwrapEthQuote as Quote,
//     chainId: 1,
//     sellAmount: '100000000000000000',
//     assetToSell: WETH_MAINNET_ASSET,
//     assetToBuy: ETH_MAINNET_ASSET,
//   });
//   expect(swap.nonce).toBeDefined();
// });
