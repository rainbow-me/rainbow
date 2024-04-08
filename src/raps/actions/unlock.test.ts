// import { Wallet } from '@ethersproject/wallet';
// import { getRainbowRouterContractAddress } from '@rainbow-me/swaps';
// import { getProvider } from '@wagmi/core';
// import { mainnet } from 'viem/chains';
// import { beforeAll, expect, test } from 'vitest';

// import {
//   RAINBOW_WALLET_ADDRESS,
//   TEST_PK_1,
//   USDC_MAINNET_ASSET,
//   delay,
// } from '~/test/utils';

// import { createTestWagmiClient } from '../../wagmi/createTestWagmiClient';

// import {
//   assetNeedsUnlocking,
//   estimateApprove,
//   executeApprove,
//   getAssetRawAllowance,
// } from './unlock';

// beforeAll(async () => {
//   createTestWagmiClient();
//   await delay(3000);
// });

// test('[rap/unlock] :: get raw allowance', async () => {
//   const rawAllowance = await getAssetRawAllowance({
//     owner: RAINBOW_WALLET_ADDRESS,
//     assetAddress: USDC_MAINNET_ASSET.address,
//     spender: getRainbowRouterContractAddress(mainnet.id),
//     chainId: mainnet.id,
//   });
//   expect(rawAllowance).toBe('0');
// });

// test('[rap/unlock] :: asset needs unlocking', async () => {
//   const needsUnlocking = await assetNeedsUnlocking({
//     amount: '1000',
//     owner: RAINBOW_WALLET_ADDRESS,
//     assetToUnlock: USDC_MAINNET_ASSET,
//     spender: getRainbowRouterContractAddress(mainnet.id),
//     chainId: mainnet.id,
//   });
//   expect(needsUnlocking).toBe(true);
// });

// test('[rap/unlock] :: estimate approve', async () => {
//   const approveGasLimit = await estimateApprove({
//     owner: RAINBOW_WALLET_ADDRESS,
//     tokenAddress: USDC_MAINNET_ASSET.address,
//     spender: getRainbowRouterContractAddress(mainnet.id),
//     chainId: mainnet.id,
//   });
//   expect(Number(approveGasLimit)).toBeGreaterThan(0);
// });

// test('[rap/unlock] :: should execute approve', async () => {
//   const provider = getProvider({ chainId: mainnet.id });
//   const wallet = new Wallet(TEST_PK_1, provider);
//   const approvalTx = await executeApprove({
//     chainId: mainnet.id,
//     gasLimit: '60000',
//     gasParams: {
//       maxFeePerGas: '800000000000',
//       maxPriorityFeePerGas: '2000000000',
//     },
//     spender: getRainbowRouterContractAddress(mainnet.id),
//     tokenAddress: USDC_MAINNET_ASSET.address,
//     wallet,
//   });
//   expect(approvalTx.hash).toBeDefined();
// });
