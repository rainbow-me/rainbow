import WalletConnectProvider from '@walletconnect/web3-provider';
import provider from 'eth-provider';

const wcProvider = new WalletConnectProvider({
  infuraId: process.env.INFURA_PROJECT_ID,
  qrcode: false,
});

wcProvider.connector.on('display_uri', (err, payload) => {
  window.location.href = `https://rnbwapp.com/wc?uri=${encodeURIComponent(
    payload.params[0]
  )}`;
});

const fallbackProvider = provider([
  `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
]);

fallbackProvider.enable = () => {
  window.ethereum = wcProvider;

  return wcProvider.enable();
};

window.ethereum = fallbackProvider;
