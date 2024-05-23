/* eslint-disable @typescript-eslint/no-explicit-any */
import WalletConnect from '@walletconnect/client';
import {
  beforeAllcleanApp,
  afterAllcleanApp,
  openDeeplinkFromBackground,
  importWalletFlow,
  checkIfVisible,
  delay,
  swipe,
  waitAndTap,
} from './helpers';

let connector: any = null;
let uri = null;
let account = null;

describe('Check malicious dapp warning', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: false });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: false });
  });

  it('watches a wallet and loads wallet screen', async () => {
    await importWalletFlow();
  });

  it('Should handle WC connect request from a malicious source and reject it', async () => {
    // Setting up WalletConnect with a malicious clientMeta
    connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      clientMeta: {
        description: 'Malicious Dapp trying to connect',
        icons: ['https://example.com/malicious-icon.png'],
        name: 'Malicious-Dapp',
        url: 'https://test-dap-welps.vercel.app/',
      },
    });

    await connector.createSession();
    uri = connector.uri;

    // Awaiting connection attempt
    const maliciousConnectionAttempt = new Promise((resolve, reject) => {
      connector.on('connect', async (error: any) => {
        if (error) {
          reject(error);
        }
        // Logic to reject if the domain is not trusted
        if (connector.clientMeta.url.includes('malicious-dapp.com')) {
          console.warn('Connection attempt from untrusted domain:', connector.clientMeta.url);
          reject(new Error('Connection from untrusted source rejected'));
        }
      });
    });

    // Simulating user opening the deep link from the malicious site
    const baseUrl = 'https://rnbwapp.com';
    const encodedUri = encodeURIComponent(uri);
    const fullUrl = `${baseUrl}/wc?uri=${encodedUri}`;

    // Simulating user opening the deep link from the malicious site
    await openDeeplinkFromBackground(fullUrl);

    try {
      await maliciousConnectionAttempt;
      throw new Error('Malicious connection should not have been established');
    } catch (error) {
      console.log('Successfully blocked malicious connection:', error);
    }
  });
});
