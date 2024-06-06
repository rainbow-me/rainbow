// import { device } from 'detox';
import {
  importWalletFlow,
  sendETHtoTestWallet,
  waitAndTap,
  checkIfVisible,
  beforeAllcleanApp,
  afterAllcleanApp,
  fetchElementAttributes,
  tap,
  disableSynchronization,
  delayTime,
  tapByText,
} from './helpers';

import { expect } from '@jest/globals';

// const ios = device.getPlatform() === 'ios';
// const android = device.getPlatform() === 'android';

import { quoteResponse } from './mocks/quoteResponse.mock';
import { fetchedPricesResponse } from './mocks/fetchedPrices.mock';
import { SwapProvider } from '@/__swaps__/screens/Swap/providers/swap-provider';

let executeSwapMock: jest.SpyInstance;

jest.mock('@/__swaps__/screens/Swap/hooks/useSwapInputsController', () => {
  const originalModule = jest.requireActual('@/__swaps__/screens/Swap/hooks/useSwapInputsController');
  return {
    ...originalModule,
    getQuote: jest.fn().mockImplementation(params => {
      return quoteResponse(params);
    }),
    getCrosschainQuote: jest.fn().mockImplementation(params => {
      return quoteResponse(params);
    }),

    // TODO: This needs proper data structure
    fetchAssetPrices: jest.fn().mockImplementation(() => fetchedPricesResponse),
  };
});

// trying to mock the swap-provider here and then call executeSwap
jest.mock('@/__swaps__/screens/Swap/providers/swap-provider');

describe('Swap Sheet Interaction Flow', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: true });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: true });
  });

  beforeEach(async () => {
    executeSwapMock = jest.spyOn(SwapProvider.prototype, 'executeSwap').mockImplementation(() => {
      // Mock implementation
    });
  });
  afterEach(async () => {
    executeSwapMock.mockRestore();
  });

  it('Import a wallet and go to welcome', async () => {
    await importWalletFlow({ seedPhrase: true });
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
    await delayTime('long');
    await waitAndTap('swap-button');
    await disableSynchronization();
    await tap('token-to-buy-dai-1');
    const swapInput = await fetchElementAttributes('swap-asset-input');

    // expect inputAsset === .5 * eth balance
    expect(swapInput.elements[0].label).toContain('Ethereum');
    expect(swapInput.elements[0].label).toContain('11');

    // TODO: fix. tests break when importing findNiceIncrement.
    //
    // const expectedBalance = await checkWalletBalance();
    // const swapInputLabel = swapInput.elements[0].label;
    // const inputAmount = findNiceIncrement((expectedBalance * 0.5).toString());
    // console.log('unrounded inputAmount', (expectedBalance * 0.5).toString());
    // console.log('inputAmount', inputAmount);
    // expect(swapInputLabel).toContain(inputAmount);
  });

  // TODO: Either mock quote here or wait for it to resolve which can be flaky.. prefer to mock this.
  it('Should be able to go to review and execute a swap', async () => {
    await tapByText('Review');
    await delayTime('long');
    const reviewActionElements = await fetchElementAttributes('swap-action-button');
    expect(reviewActionElements.elements[0].label).toContain('ETH');
    expect(reviewActionElements.elements[1].label).toContain('DAI');
    expect(reviewActionElements.elements[2].label).toContain('Tap to Swap');
    await tapByText('Tap to Swap');
    await delayTime('long');
    expect(executeSwapMock).toHaveBeenCalled();
    // TODO: add validation
    /**
     * tap swap button
     * wait for Swap header to be visible
     * grab highest user asset balance from userAssetsStore
     * expect inputAsset.uniqueId === highest user asset uniqueId
     */
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

  // other tests to consider
  /**
   * Flip assets
   * exchange button onPress
   * disable button states once https://github.com/rainbow-me/rainbow/pull/5785 gets merged
   * swap execution
   * token search (both from userAssets and output token list)
   * custom gas panel
   * flashbots
   * slippage
   * explainer sheets
   * switching wallets inside of swap screen
   *
   */
});
