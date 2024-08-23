// https://www.notion.so/rainbowdotme/Critical-Path-Checklist-a907ffa19e854e5492fcefd2bf79f8cd#68309b94f1e34a7abdc7fcbeece70a2e
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
  swipeUntilVisible,
  tapAndLongPressByText,
} from './helpers';

import { expect } from '@jest/globals';
import { WALLET_VARS } from './testVariables';
import { SUPPORTED_CHAIN_IDS } from '@/references';
import { swapsStore } from '@/state/swaps/swapsStore';

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
    await sendETHtoTestWallet();
  });

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await tap('dev-button-hardhat');
    await checkIfVisible('testnet-toast-Hardhat');

    const attributes = await fetchElementAttributes('fast-coin-info');
    expect(attributes.label).toContain('Ethereum');
    expect(attributes.label).toContain('20');
  });

  // it('Should open swap screen with 50% inputAmount for inputAsset', async () => {
  //   await device.disableSynchronization();
  //   await tap('swap-button');
  //   await delayTime('long');

  //   await swipeUntilVisible('token-to-buy-dai-1', 'token-to-buy-list', 'up');

  //   await tap('token-to-buy-dai-1');
  //   const swapInput = await fetchElementAttributes('swap-asset-input');

  //   // expect inputAsset === .5 * eth balance
  //   expect(swapInput.label).toContain('ETH');
  //   expect(swapInput.label).toContain('10');
  // });

  // it('Should be able to go to review and execute a swap', async () => {
  //   await tapByText('Review');
  //   const reviewActionElements = await fetchElementAttributes('swap-action-button');
  //   console.log('reviewActionElements: ', reviewActionElements);
  //   expect(reviewActionElements.elements[0].label).toContain('ETH');
  //   expect(reviewActionElements.elements[1].label).toContain('DAI');
  //   expect(reviewActionElements.elements[2].label).toContain('􀎽 Hold to Swap');

  //   // TODO: We probably need to write a custom method for press n hold buttons
  //   // I doubt calling longPress will work since we don't know the exact time to hold
  //   // await tapAndLongPressByText('􀎽 Hold to Swap');
  // });

  describe('Should swap between all types of assets', () => {
    SUPPORTED_CHAIN_IDS({ testnetMode: false }).forEach(chainId => {
      it(`Should swap native to ERC-20 on ${chainId}`, async () => {
        // TODO: Implement ETH to ERC-20 swap test
      });

      it(`Should swap ERC-20 to native on ${chainId}`, async () => {
        // TODO: Implement ERC-20 to ETH swap test
      });

      it(`Should swap ERC-20 to ERC-20 on ${chainId}`, async () => {
        // TODO: Implement ERC-20 to ERC-20 swap test
      });

      it(`Should wrap native to wrapped native on ${chainId}`, async () => {
        // TODO: Implement native to wrapped native swap test
      });

      it(`Should unwrap wrapped native to native on ${chainId}`, async () => {
        // TODO: Implement wrapped native to native swap test
      });

      it(`Should bridge native to L2 on ${chainId}`, async () => {
        // TODO: Implement native to L2 bridge test
      });
    });
  });

  describe('Should open swaps from all entry points', () => {
    for (const chainId of SUPPORTED_CHAIN_IDS({ testnetMode: false })) {
      describe(`for preferred network ${chainId}`, () => {
        // set the swap store preferred network right away
        swapsStore.getState().setPreferredNetwork(chainId);

        it(`[${chainId}]: Should open swaps from ProfileActionRowButton`, async () => {
          // TODO: Implement swaps from ProfileActionRowButton test
        });

        it(`[${chainId}]: Should open swaps from ExpandedAssetSheet`, async () => {
          // TODO: Implement swaps from ExpandedAssetSheet test
        });

        it(`[${chainId}]: Should open swaps from Discover 'Get token with' button`, async () => {
          // TODO: Implement swaps from Discover `Get {token} with` button test
        });

        it(`[${chainId}]: Should open swaps from Discover new token all chains selector`, async () => {
          // TODO: Implement swaps from Discover new token all chains selector test
        });
      });
    }

    describe(`for no preferred network`, () => {
      // set the swap store preferred network right away
      swapsStore.getState().setPreferredNetwork(undefined);

      it(`Should open swaps from ProfileActionRowButton`, async () => {
        // TODO: Implement swaps from ProfileActionRowButton test
      });

      it(`Should open swaps from ExpandedAssetSheet`, async () => {
        // TODO: Implement swaps from ExpandedAssetSheet test
      });

      it(`Should open swaps from Discover 'Get token with' button`, async () => {
        // TODO: Implement swaps from Discover `Get {token} with` button test
      });

      it(`Should open swaps from Discover new token all chains selector`, async () => {
        // TODO: Implement swaps from Discover new token all chains selector test
      });
    });
  });

  describe('Should handle max button + flip button correctly', () => {
    it('Should handle max button press for small balance inputAsset', async () => {
      // TODO: Implement max button for inputAsset test
    });

    it('Should handle max button press while not maxed out', async () => {
      // TODO: Implement max button for inputAsset test
    });

    it('Should handle max button press while maxed out', async () => {
      // TODO: Implement max button for inputAsset test
    });

    it('Should handle flip button press while max amount', async () => {
      // TODO: Implement max button for inputAsset test
    });

    it('Should handle flip button press while not max amount', async () => {
      // TODO: Implement max button for inputAsset test
    });

    it('Should handle flip button press while percentage to sell is 0', async () => {
      // TODO: Implement max button for inputAsset test
    });
  });

  describe('Should have correct page header', () => {
    it('for bridges', async () => {});
    it('for swaps', async () => {});
  });

  describe('Review panel', () => {
    describe('Should display correct network badges for all supported chains', () => {
      SUPPORTED_CHAIN_IDS({ testnetMode: false }).forEach(async chainId => {
        it(`Should display ${chainId} network badge`, async () => {
          // TODO: Implement network badge for chainId test
        });
      });
    });

    it('Should handle slippage change', async () => {
      // TODO: test up and down (should trigger refetch each time)
    });
  });
});
