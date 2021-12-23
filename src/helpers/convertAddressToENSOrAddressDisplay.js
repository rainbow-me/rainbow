import { web3Provider } from '@rainbow-me/handlers/web3';

export default async function convertAddressToENSOrAddressDisplay(address) {
  const ensName = await web3Provider.lookupAddress(address);
  return ensName ?? address;
}
