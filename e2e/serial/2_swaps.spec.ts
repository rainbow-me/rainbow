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
  delayTime,
  swipeUntilVisible,
  tapAndLongPress,
} from '../helpers';

import { expect } from '@jest/globals';
import { WALLET_VARS } from '../testVariables';

describe('Swap Sheet Interaction Flow', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({});
  });
  afterAll(async () => {
    await afterAllcleanApp({});
  });

  it('Import a wallet and go to welcome', async () => {
    await importWalletFlow(WALLET_VARS.EMPTY_WALLET.PK);
  });

  it('Should send ETH to test wallet', async () => {
    // send 20 eth
    await sendETHtoTestWallet();
  });

  it('Should show Anvil Toast after pressing Connect To Anvil', async () => {
    await tap('dev-button-anvil');
    await checkIfVisible('testnet-toast-Anvil');

    // doesn't work atm
    // validate it has the expected funds of 20 eth
    // const attributes = await fetchElementAttributes('fast-coin-info');
    // expect(attributes.label).toContain('Ethereum');
    // expect(attributes.label).toContain('20');
  });

  it('Should open swap screen with 50% inputAmount for inputAsset', async () => {
    await device.disableSynchronization();
    await tap('swap-button');
    await delayTime('very-long');

    await swipeUntilVisible('token-to-buy-dai-1', 'token-to-buy-list', 'up', 100);

    await tap('token-to-buy-dai-1');
    await delayTime('very-long');

    const swapInput = await fetchElementAttributes('swap-asset-input');

    expect(swapInput.label).toContain('10');
    expect(swapInput.label).toContain('ETH');
  });

  it('Should be able to go to review and execute a swap', async () => {
    await tap('swap-bottom-action-button');
    const inputAssetActionButton = await fetchElementAttributes('swap-input-asset-action-button');
    const outputAssetActionButton = await fetchElementAttributes('swap-output-asset-action-button');
    const holdToSwapButton = await fetchElementAttributes('swap-bottom-action-button');

    expect(inputAssetActionButton.label).toBe('ETH 􀆏');
    expect(outputAssetActionButton.label).toBe('DAI 􀆏');
    expect(holdToSwapButton.label).toBe('􀎽 Hold to Swap');

    await tapAndLongPress('swap-bottom-action-button', 1500);

    // TODO: This doesn't work so need to figure this out eventually...
    // await checkIfVisible('profile-screen');
  });

  it.skip('Should be able to verify swap is happening', async () => {
    // await delayTime('very-long');
    // const activityListElements = await fetchElementAttributes('wallet-activity-list');
    // expect(activityListElements.label).toContain('ETH');
    // expect(activityListElements.label).toContain('DAI');
    // await tapByText('Swapping');
    // await delayTime('long');
    // const transactionSheet = await checkIfVisible('transaction-details-sheet');
    // expect(transactionSheet).toBeTruthy();
  });

  it.skip('Should open swap screen from ProfileActionRowButton with largest user asset', async () => {
    /**
     * tap swap button
     * wait for Swap header to be visible
     * grab highest user asset balance from userAssetsStore
     * expect inputAsset.uniqueId === highest user asset uniqueId
     */
  });

  it.skip('Should open swap screen from  asset chart with that asset selected', async () => {
    /**
     * tap any user asset (store const uniqueId here)
     * wait for Swap header to be visible
     * expect inputAsset.uniqueId === const uniqueId ^^
     */
  });

  it.skip('Should open swap screen from dapp browser control panel with largest user asset', async () => {
    /**
     * tap swap button
     * wait for Swap header to be visible
     * grab highest user asset balance from userAssetsStore
     * expect inputAsset.uniqueId === highest user asset uniqueId
     */
  });

  it.skip('Should not be able to type in output amount if cross-chain quote', async () => {
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
