import ENS from '@ensdomains/ensjs';
import { web3Provider } from '@rainbow-me/handlers/web3';

new ENS({
  ensAddress: '0x123',
  networkId: '1',
  provider: web3Provider,
});
