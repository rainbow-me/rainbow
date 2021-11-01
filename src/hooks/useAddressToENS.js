import { web3Provider} from '@rainbow-me/handlers/web3';

export default async function useAddressToENS(address) {
  const ensName = await web3Provider.lookupAddress(address)

  if (ensName == null) {
    return address;
  }
  
  return ensName;
}