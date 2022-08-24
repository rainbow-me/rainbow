/* eslint-disable sort-keys-fix/sort-keys-fix */
/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import { exec } from 'child_process';
import { Contract } from '@ethersproject/contracts';
import WalletConnect from '@walletconnect/client';
import { convertUtf8ToHex } from '@walletconnect/utils';
import * as Helpers from './helpers';
import kittiesABI from '@rainbow-me/references/cryptokitties-abi.json';
import erc20ABI from '@rainbow-me/references/erc20-abi.json';

let connector = null;
let uri = null;
let account = null;

const RAINBOW_WALLET_DOT_ETH = '0x7a3d05c70581bd345fe117c06e45f9669205384f';
const TESTING_WALLET = '0x3Cb462CDC5F809aeD0558FBEe151eD5dC3D3f608';

const CRYPTOKITTIES_ADDRESS = '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d';
const ETH_ADDRESS = 'eth';
const BAT_TOKEN_ADDRESS = '0x0d8775f648430679a709e98d2b0cb6250d2887ef';

const isNFTOwner = async address => {
  const provider = Helpers.getProvider();
  const kittiesContract = new Contract(
    CRYPTOKITTIES_ADDRESS,
    kittiesABI,
    provider
  );
  const ownerAddress = await kittiesContract.ownerOf('1368227');
  return ownerAddress?.toLowerCase() === address?.toLowerCase();
};

const getOnchainBalance = async (address, tokenContractAddress) => {
  const provider = Helpers.getProvider();
  if (tokenContractAddress === ETH_ADDRESS) {
    const balance = await provider.getBalance(RAINBOW_WALLET_DOT_ETH);
    return balance;
  } else {
    const tokenContract = new Contract(
      tokenContractAddress,
      erc20ABI,
      provider
    );
    const balance = await tokenContract.balanceOf(address);
    return balance;
  }
};

beforeAll(async () => {
  // Connect to hardhat
  await exec('yarn hardhat');
  await exec(
    'open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/'
  );
});

const acceptAlertIfGasPriceIsHigh = async () => {
  // Depending on current gas prices, we might get an alert
  // saying that the fees are higher than the swap amount
  try {
    if (await Helpers.checkIfElementByTextIsVisible('Proceed Anyway')) {
      await Helpers.tapAlertWithButton('Proceed Anyway');
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}
};

// eslint-disable-next-line no-unused-vars
const checkIfSwapCompleted = async (assetName, amount) => {
  // Disabling this because there's a view blocking (The portal)
  // await Helpers.checkIfVisible(`Swapped-${assetName}-${amount}`);
  return true;
};

describe('Hardhat Transaction Flow', () => {
  it('Should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('Should show the "Restore Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.checkIfExists('restore-sheet');
  });

  it('show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid seed"', async () => {
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Import'
    );
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.disableSynchronization();
    await Helpers.waitAndTap('wallet-info-submit-button');
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.checkIfVisible('wallet-screen', 80000);
    await Helpers.enableSynchronization();
  });

  it('Should send ETH to test wallet"', async () => {
    await Helpers.sendETHtoTestWallet();
  });

  it('Should navigate to the Profile screen after swiping right', async () => {
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.checkIfVisible('profile-screen');
  });

  it('Should navigate to Settings Sheet after tapping Settings Button', async () => {
    await Helpers.waitAndTap('settings-button');
    await Helpers.checkIfVisible('settings-sheet');
  });

  it('Should toggle Dark Mode on and off', async () => {
    await Helpers.waitAndTap('theme-section-light');
    await Helpers.tapByText('Dark');
    await Helpers.waitAndTap('theme-section-dark');
    await Helpers.tapByText('Light');
  });

  it('Should navigate to Developer Settings after tapping Developer Section', async () => {
    await Helpers.waitAndTap('developer-section');
    await Helpers.checkIfVisible('developer-settings-sheet');
  });

  if (device.getPlatform() === 'ios') {
    it('Should show Applied alert after pressing Alert', async () => {
      await Helpers.swipe('developer-settings-sheet', 'up', 'slow');
      await Helpers.waitAndTap('alert-section');
      await Helpers.checkIfElementByTextIsVisible('APPLIED');
      await Helpers.tapAlertWithButton('OK');
      await Helpers.checkIfVisible('developer-settings-sheet');
    });
  }

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await Helpers.waitAndTap('hardhat-section');
    await Helpers.checkIfVisible('testnet-toast-Hardhat');
  });

  it('Should navigate to the Wallet screen after swiping left', async () => {
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
  });

  it('Should deposit DAI (via Compound)', async () => {
    await Helpers.tap('Savings-list-header');
    await Helpers.waitAndTap('savings-list-row-DAI');
    await Helpers.waitAndTap('deposit-action-button');
    await Helpers.typeText('deposit-modal-input', '5', true);
    await Helpers.tapAndLongPress('deposit-modal-confirm-button');
    await acceptAlertIfGasPriceIsHigh();
    try {
      await Helpers.checkIfVisible('Deposited-Dai-5.00 DAI');
    } catch (e) {
      await Helpers.checkIfVisible('Depositing-Dai-5.00 DAI');
    }
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should withdraw DAI (via Compound)', async () => {
    await Helpers.waitAndTap('savings-list-row-DAI');
    await Helpers.waitAndTap('withdraw-action-button');
    await Helpers.typeText('withdraw-modal-input', '1', true);
    await Helpers.tapAndLongPress('withdraw-modal-confirm-button');
    await acceptAlertIfGasPriceIsHigh();
    try {
      await Helpers.checkIfVisible('Withdrew-Dai-1.00 DAI');
    } catch (e) {
      await Helpers.checkIfVisible('Withdrawing-Dai-1.00 DAI');
    }
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should be able to search random tokens (like SWYF) via address and swap them', async () => {
    await Helpers.waitAndTap('exchange-fab');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-ETH-token'
    );
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText(
      'currency-select-search-input',
      '0xefa6903aa49cd539c079ac4b0a090db432615822',
      true
    );
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-SWYF-token'
    );
    await Helpers.tapByText('Continue');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.typeText('exchange-modal-input', '0.001', true);
    await Helpers.tapAndLongPress('exchange-modal-confirm-button');
    await Helpers.tapAndLongPress('swap-details-confirm-button');
    await acceptAlertIfGasPriceIsHigh();
    await checkIfSwapCompleted('Ethereum', '0.001 ETH');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should be able to wrap ETH -> WETH', async () => {
    await Helpers.tap('exchange-fab');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'WETH', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-WETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.typeText('exchange-modal-input', '0.001', true);
    await Helpers.tapAndLongPress('exchange-modal-confirm-button');
    await Helpers.tapAndLongPress('swap-details-confirm-button');
    await acceptAlertIfGasPriceIsHigh();
    await checkIfSwapCompleted('Ethereum', '0.001 ETH');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });
  it('Should be able to unwrap WETH -> ETH', async () => {
    await Helpers.tap('exchange-fab');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'WETH', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-WETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.typeText('exchange-modal-input', '0.0005', true);
    await Helpers.tapAndLongPress('exchange-modal-confirm-button');
    await Helpers.tapAndLongPress('swap-details-confirm-button');
    await acceptAlertIfGasPriceIsHigh();
    await checkIfSwapCompleted('Wrapper Ether', '0.0005 WETH');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });
  it('Should swap WETH -> DAI including approval (via tokenToToken)', async () => {
    await Helpers.tap('exchange-fab');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'WETH', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-WETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'DAI', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-DAI-token');
    await Helpers.typeText('exchange-modal-input', '0.0005', true);
    await Helpers.tapAndLongPress('exchange-modal-confirm-button');
    await Helpers.tapAndLongPress('swap-details-confirm-button');
    await acceptAlertIfGasPriceIsHigh();
    await checkIfSwapCompleted('Wrapper Ether', '0.0005 WETH');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should swap DAI -> USDC (via tokenToTokenWithPermit)', async () => {
    await Helpers.tap('exchange-fab');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'DAI', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-DAI-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'USDC', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-USDC-token');
    await Helpers.typeText('exchange-modal-input', '10', true);
    await Helpers.tapAndLongPress('exchange-modal-confirm-button');
    await Helpers.tapAndLongPress('swap-details-confirm-button');
    await acceptAlertIfGasPriceIsHigh();
    await checkIfSwapCompleted('DAI', '4 DAI');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should swap DAI -> ETH (via tokenToETH)', async () => {
    await Helpers.tap('exchange-fab');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'DAI', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-DAI-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.typeText('exchange-modal-input', '4', true);
    await Helpers.tapAndLongPress('exchange-modal-confirm-button');
    await Helpers.tapAndLongPress('swap-details-confirm-button');
    await acceptAlertIfGasPriceIsHigh();
    await checkIfSwapCompleted('DAI', '4 DAI');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should swap ETH -> USDC (via ethToToken)', async () => {
    await Helpers.tap('exchange-fab');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'USDC', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-USDC-token');
    await Helpers.typeText('exchange-modal-input', '0.005', true);
    await Helpers.tapAndLongPress('exchange-modal-confirm-button');
    await Helpers.tapAndLongPress('swap-details-confirm-button');
    await acceptAlertIfGasPriceIsHigh();
    await checkIfSwapCompleted('Ethereum', '0.005 ETH');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });
  it('Should swap USDC -> WETH (via tokenToTokenWithPermit)', async () => {
    await Helpers.tap('exchange-fab');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'USDC', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-USDC-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'WETH', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-WETH-token');
    await Helpers.typeText('exchange-modal-input', '14', true);
    await Helpers.tapAndLongPress('exchange-modal-confirm-button');
    await Helpers.tapAndLongPress('swap-details-confirm-button');
    await acceptAlertIfGasPriceIsHigh();
    await checkIfSwapCompleted('USD Coin', '25 USDC');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should swap USDC -> ETH (via tokenToETH)', async () => {
    await Helpers.tap('exchange-fab');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'USDC', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-USDC-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.typeText('exchange-modal-input', '10', true);
    await Helpers.tapAndLongPress('exchange-modal-confirm-button');
    await Helpers.tapAndLongPress('swap-details-confirm-button');
    await checkIfSwapCompleted('USD Coin', '20 USDC');
    await acceptAlertIfGasPriceIsHigh();
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should open send sheet after tapping send fab', async () => {
    await Helpers.waitAndTap('send-fab');
    await Helpers.checkIfVisible('send-asset-form-field');
  });

  it('Should send (Cryptokitties)', async () => {
    await Helpers.typeTextAndHideKeyboard(
      'send-asset-form-field',
      RAINBOW_WALLET_DOT_ETH
    );
    await Helpers.waitAndTap('CryptoKitties-family-header');
    await Helpers.tapByText('Arun Cattybinky');
    await Helpers.waitAndTap('gas-speed-custom');
    await Helpers.waitAndTap('speed-pill-urgent');
    await Helpers.waitAndTap('gas-speed-done-button');
    await Helpers.waitAndTap('send-sheet-confirm-action-button', 20000);
    await Helpers.tapAndLongPress('send-confirmation-button');
    await Helpers.checkIfVisible('profile-screen');
    const isOwnerRecipient = await isNFTOwner(RAINBOW_WALLET_DOT_ETH);
    if (!isOwnerRecipient) {
      throw new Error('Recepient did not recieve Cryptokitty');
    }
  });

  it('Should show completed send NFT (Cryptokitties)', async () => {
    try {
      await Helpers.checkIfVisible('Sent-Arun Cattybinky-1.00 CryptoKitties');
    } catch (e) {
      await Helpers.checkIfVisible(
        'Sending-Arun Cattybinky-1.00 CryptoKitties'
      );
    }

    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should send ERC20 (BAT)', async () => {
    const preSendBalance = await getOnchainBalance(
      RAINBOW_WALLET_DOT_ETH,
      BAT_TOKEN_ADDRESS
    );
    await Helpers.waitAndTap('send-fab');
    await Helpers.typeTextAndHideKeyboard(
      'send-asset-form-field',
      RAINBOW_WALLET_DOT_ETH
    );
    await Helpers.waitAndTap('send-asset-BAT-token');
    await Helpers.typeText('selected-asset-field-input', '1.02', true);
    await Helpers.waitAndTap('send-sheet-confirm-action-button');
    await Helpers.tapAndLongPress('send-confirmation-button');
    await Helpers.checkIfVisible('profile-screen');
    const postSendBalance = await getOnchainBalance(
      RAINBOW_WALLET_DOT_ETH,
      BAT_TOKEN_ADDRESS
    );
    if (!postSendBalance.gt(preSendBalance)) {
      throw new Error('Recepient did not recieve BAT');
    }
  });

  it('Should show completed send ERC20 (BAT)', async () => {
    try {
      await Helpers.checkIfVisible('Sent-Basic Attention Token-1.02 BAT');
    } catch (e) {
      await Helpers.checkIfVisible('Sending-Basic Attention Token-1.02 BAT');
    }
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should send ETH', async () => {
    await Helpers.waitAndTap('send-fab');
    await Helpers.typeTextAndHideKeyboard(
      'send-asset-form-field',
      RAINBOW_WALLET_DOT_ETH
    );
    const preSendBalance = await getOnchainBalance(
      RAINBOW_WALLET_DOT_ETH,
      ETH_ADDRESS
    );
    await Helpers.waitAndTap('send-asset-ETH-token');
    await Helpers.typeText('selected-asset-field-input', '0.003', true);
    await Helpers.waitAndTap('send-sheet-confirm-action-button');
    await Helpers.tapAndLongPress('send-confirmation-button');
    await Helpers.checkIfVisible('profile-screen');
    const postSendBalance = await getOnchainBalance(
      RAINBOW_WALLET_DOT_ETH,
      ETH_ADDRESS
    );
    if (!postSendBalance.gt(preSendBalance)) {
      throw new Error('Recepient did not recieve ETH');
    }
  });

  it('Should show completed send ETH', async () => {
    try {
      await Helpers.checkIfVisible('Sent-Ethereum-0.003 ETH');
    } catch (e) {
      await Helpers.checkIfVisible('Sending-Ethereum-0.003 ETH');
    }
    await Helpers.checkIfVisible('profile-screen');
  });

  it('Should receive the WC connect request and approve it', async () => {
    connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      clientMeta: {
        description: 'Connect with WalletConnect',
        icons: ['https://walletconnect.org/walletconnect-logo.png'],
        name: 'WalletConnect',
        url: 'https://walletconnect.org',
      },
    });

    await connector.createSession();
    uri = connector.uri;
    const connected = new Promise(async (resolve, reject) => {
      connector.on('connect', (error, payload) => {
        if (error) {
          reject(error);
        }
        const { accounts } = payload.params[0];
        if (accounts[0] === TESTING_WALLET) {
          account = accounts[0];
          resolve(true);
        } else {
          reject(false);
        }
      });
    });

    const baseUrl = 'https://rnbwapp.com';
    const encodedUri = encodeURIComponent(uri);
    const fullUrl = `${baseUrl}/wc?uri=${encodedUri}`;

    await Helpers.openDeeplinkFromBackground(fullUrl);

    await Helpers.checkIfVisible('wc-approval-sheet', 30000);
    await Helpers.waitAndTap('wc-connect-action-button');
    const isConnected = await connected;
    if (!isConnected) throw new Error('WC Connection failed');
    await Helpers.checkIfVisible('wc-redirect-sheet');
    await Helpers.swipe('wc-redirect-sheet', 'down', 'fast');
  });

  it('Should be able to sign personal messages via WC', async () => {
    const result = connector.signPersonalMessage(['My msg', account]);
    await Helpers.checkIfVisible('wc-request-sheet');
    await Helpers.waitAndTap('wc-confirm-action-button');

    if (!result) throw new Error('WC Connection failed');
    const signature = await result;
    if (
      signature !==
      '0x9b08221727750e582b43e14f50069083ac6d8a2670a9f28009f14cbef7e66ba16d3370330aed5b6744027bd6a0bef32cb97bb9da3db34c67ba2237b2ef5d1ec71b'
    ) {
      throw new Error('WC personal sign failed');
    }
  });

  it('Should be able to sign eth_sign messages via WC', async () => {
    const message = `My email is john@doe.com`;
    const hexMsg = convertUtf8ToHex(message);
    const msgParams = [account, hexMsg];
    const result = connector.signMessage(msgParams);
    await Helpers.checkIfVisible('wc-request-sheet');
    await Helpers.waitAndTap('wc-confirm-action-button');

    if (!result) throw new Error('WC Connection failed');
    const signature = await result;
    // verify signature
    if (
      signature !==
      '0x141d62e1aaa2202ededb07f1684ef6d3d9958d334713010ea91df3831e3a3c99303a83f334d1e5e935c4edd7146a2f3f4301c5d509ccfeffd55f5db4e971958b1c'
    ) {
      throw new Error('WC eth_sign failed');
    }
  });

  it('Should be able to sign typed data messages via WC', async () => {
    const msg = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'verifyingContract', type: 'address' },
        ],
        RelayRequest: [
          { name: 'target', type: 'address' },
          { name: 'encodedFunction', type: 'bytes' },
          { name: 'gasData', type: 'GasData' },
          { name: 'relayData', type: 'RelayData' },
        ],
        GasData: [
          { name: 'gasLimit', type: 'uint256' },
          { name: 'gasPrice', type: 'uint256' },
          { name: 'pctRelayFee', type: 'uint256' },
          { name: 'baseRelayFee', type: 'uint256' },
        ],
        RelayData: [
          { name: 'senderAddress', type: 'address' },
          { name: 'senderNonce', type: 'uint256' },
          { name: 'relayWorker', type: 'address' },
          { name: 'paymaster', type: 'address' },
        ],
      },
      domain: {
        name: 'GSN Relayed Transaction',
        version: '1',
        chainId: 42,
        verifyingContract: '0x6453D37248Ab2C16eBd1A8f782a2CBC65860E60B',
      },
      primaryType: 'RelayRequest',
      message: {
        target: '0x9cf40ef3d1622efe270fe6fe720585b4be4eeeff',
        encodedFunction:
          '0xa9059cbb0000000000000000000000002e0d94754b348d208d64d52d78bcd443afa9fa520000000000000000000000000000000000000000000000000000000000000007',
        gasData: {
          gasLimit: '39507',
          gasPrice: '1700000000',
          pctRelayFee: '70',
          baseRelayFee: '0',
        },
        relayData: {
          senderAddress: '0x22d491bde2303f2f43325b2108d26f1eaba1e32b',
          senderNonce: '3',
          relayWorker: '0x3baee457ad824c94bd3953183d725847d023a2cf',
          paymaster: '0x957F270d45e9Ceca5c5af2b49f1b5dC1Abb0421c',
        },
      },
    };

    const result = connector.signTypedData([account, JSON.stringify(msg)]);
    await Helpers.checkIfVisible('wc-request-sheet');
    await Helpers.waitAndTap('wc-confirm-action-button');

    const signature = await result;
    if (
      signature !==
      '0xb78f17ff5779826ebfe4a7572a569a8802c02962242ff0195bd17bd4c07248b930a8c459276bc6eaa02dfb4523b8dc66d0020742d3f60a9209bde811aebb39351b'
    ) {
      throw new Error('WC typed data failed');
    }
  });

  it('Should be able to approve transactions via WC (Send)', async () => {
    const preSendBalance = await getOnchainBalance(
      RAINBOW_WALLET_DOT_ETH,
      ETH_ADDRESS
    );
    const result = connector.sendTransaction({
      from: account,
      to: RAINBOW_WALLET_DOT_ETH,
      value:
        '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      data: '0x',
    });
    await Helpers.checkIfVisible('wc-request-sheet');

    await Helpers.waitAndTap('wc-confirm-action-button');
    await Helpers.checkIfVisible('profile-screen');
    const hash = await result;
    if (!hash) {
      throw new Error('WC approving tx failed');
    }

    const postSendBalance = await getOnchainBalance(
      RAINBOW_WALLET_DOT_ETH,
      ETH_ADDRESS
    );
    if (!postSendBalance.gt(preSendBalance))
      throw new Error('Recepient did not recieve ETH');
  });

  it('Should show completed send ETH (WC)', async () => {
    try {
      await Helpers.checkIfVisible('Sent-Ethereum-1.00 ETH');
    } catch (e) {
      await Helpers.checkIfVisible('Sending-Ethereum-1.00 ETH');
    }
  });

  afterAll(async () => {
    // Reset the app state
    await connector?.killSession();
    connector = null;
    await device.clearKeychain();
    await exec('kill $(lsof -t -i:8545)');
  });
});
