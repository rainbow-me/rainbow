// import { Wallet } from '@ethersproject/wallet';
// import {
//   CrosschainQuote,
//   ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
//   QuoteError,
//   SwapType,
//   getCrosschainQuote,
// } from '@rainbow-me/swaps';
// import { getProvider } from '@wagmi/core';
// import { mainnet } from 'viem/chains';
// import { beforeAll, expect, test } from 'vitest';

// import { ChainId } from '~/core/types/chains';
// import {
//   TEST_ADDRESS_3,
//   TEST_PK_3,
//   USDC_ARBITRUM_ASSET,
//   delay,
// } from '~/test/utils';

// import { createTestWagmiClient } from '../../wagmi/createTestWagmiClient';

// import {
//   estimateCrosschainSwapGasLimit,
//   executeCrosschainSwap,
// } from './crosschainSwap';

// let crosschainQuote: CrosschainQuote | QuoteError | null;

// beforeAll(async () => {
//   createTestWagmiClient();
//   await delay(3000);
//   crosschainQuote = await getCrosschainQuote({
//     chainId: 1,
//     fromAddress: TEST_ADDRESS_3,
//     sellTokenAddress: ETH_ADDRESS_AGGREGATORS,
//     buyTokenAddress: USDC_ARBITRUM_ASSET.address,
//     sellAmount: '1000000000000000000',
//     slippage: 5,
//     destReceiver: TEST_ADDRESS_3,
//     swapType: SwapType.crossChain,
//     toChainId: ChainId.arbitrum,
//   });
// }, 20000);

// test('[rap/crosschainSwap] :: should estimate crosschain swap gas limit', async () => {
//   const swapGasLimit = await estimateCrosschainSwapGasLimit({
//     chainId: mainnet.id,
//     requiresApprove: false,
//     quote: crosschainQuote as CrosschainQuote,
//   });
//   expect(Number(swapGasLimit)).toBeGreaterThan(0);
// });

// test('[rap/crosschainSwap] :: should execute crosschain swap', async () => {
//   const provider = getProvider({ chainId: mainnet.id });
//   const wallet = new Wallet(TEST_PK_3, provider);

//   const swapTx = await executeCrosschainSwap({
//     gasLimit: '600000',
//     gasParams: {
//       maxFeePerGas: '2000000000000',
//       maxPriorityFeePerGas: '2000000000',
//     },
//     quote: crosschainQuote as CrosschainQuote,
//     wallet,
//   });

//   expect(swapTx?.hash).toBeDefined();
// });
