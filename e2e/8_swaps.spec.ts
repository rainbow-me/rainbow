/*
 *   // Other tests to consider:
 *       - Flip assets
 *       - exchange button onPress
 *       - disable button states once https://github.com/rainbow-me/rainbow/pull/5785 gets merged
 *       - swap execution
 *       - token search (both from userAssets and output token list)
 *       - custom gas panel
 *       - flashbots
 *       - slippage
 *       - explainer sheets
 *       - switching wallets inside of swap screen
 */

import {
  importWalletFlow,
  sendETHtoTestWallet,
  checkIfVisible,
  beforeAllcleanApp,
  afterAllcleanApp,
  fetchElementAttributes,
  tap,
  tapByText,
  delayTime,
} from './helpers';

import { expect } from '@jest/globals';
import { WALLET_VARS } from './testVariables';

describe('Swap Sheet Interaction Flow', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: true });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: true });
  });

  it('Import a wallet and go to welcome', async () => {
    await importWalletFlow(WALLET_VARS.EMPTY_WALLET.PK);
  });

  it('Should send ETH to test wallet', async () => {
    // send 20 eth
    await sendETHtoTestWallet();
  });

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await tap('dev-button-hardhat');
    await checkIfVisible('testnet-toast-Hardhat');

    // validate it has the expected funds of 20 eth
    const attributes = await fetchElementAttributes('fast-coin-info');
    expect(attributes.label).toContain('Ethereum');
    expect(attributes.label).toContain('20');
  });

  it('Should open swap screen with 50% inputAmount for inputAsset', async () => {
    await device.disableSynchronization();
    await tap('swap-button');
    await delayTime('long');
    await tap('token-to-buy-dai-1');
    const swapInput = await fetchElementAttributes('swap-asset-input');

    // expect inputAsset === .5 * eth balance
    expect(swapInput.label).toContain('ETH');
    expect(swapInput.label).toContain('10');
  });

  it('Should be able to go to review and execute a swap', async () => {
    await tapByText('Review');
    const reviewActionElements = await fetchElementAttributes('swap-action-button');
    expect(reviewActionElements.elements[0].label).toContain('ETH');
    expect(reviewActionElements.elements[1].label).toContain('DAI');
    expect(reviewActionElements.elements[2].label).toContain('Tap to Swap');

    /*
     *
     * Everything from this point fails. Un-comment out the following line to see behavior.
     * Currently some spots have chainId 1 and chainId 1337 for various things. I suspect
     * there is some issue with one of these things. Log the variables in getNonceAndPerformSwap
     * to see the behavior.
     *
     * To run this test:
     *
     * yarn clean:ios && yarn fast && yarn start:clean
     * yarn detox:ios:build && yarn detox test -c ios.sim.debug 8_swaps.spec.ts
     *
     */

    // await tapByText('Tap to Swap');
  });

  it('Should be able to verify swap is happening', async () => {
    // await delayTime('very-long');
    // const activityListElements = await fetchElementAttributes('wallet-activity-list');
    // expect(activityListElements.label).toContain('ETH');
    // expect(activityListElements.label).toContain('DAI');
    // await tapByText('Swapping');
    // await delayTime('long');
    // const transactionSheet = await checkIfVisible('transaction-details-sheet');
    // expect(transactionSheet).toBeTruthy();
  });

  it('Should open swap screen from ProfileActionRowButton with largest user asset', async () => {
    /**
     * tap swap button
     * wait for Swap header to be visible
     * grab highest user asset balance from userAssetsStore
     * expect inputAsset.uniqueId === highest user asset uniqueId
     */
  });

  it('Should open swap screen from  asset chart with that asset selected', async () => {
    /**
     * tap any user asset (store const uniqueId here)
     * wait for Swap header to be visible
     * expect inputAsset.uniqueId === const uniqueId ^^
     */
  });

  it('Should open swap screen from dapp browser control panel with largest user asset', async () => {
    /**
     * tap swap button
     * wait for Swap header to be visible
     * grab highest user asset balance from userAssetsStore
     * expect inputAsset.uniqueId === highest user asset uniqueId
     */
  });

  it('Should not be able to type in output amount if cross-chain quote', async () => {
    /**
     * tap swap button
     * wait for Swap header to be visible
     * select different chain in output list chain selector
     * select any asset in output token list
     * focus output amount
     * attempt to type any number in the SwapNumberPad
     * attempt to remove a character as well
     *
     * ^^ expect both of those to not change the outputAmount
     */
  });
});
