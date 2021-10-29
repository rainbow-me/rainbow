import { web3Provider} from '@rainbow-me/handlers/web3';

export default async function useReverseAddressDomainLookup(address) {
  const ensName = await web3Provider.lookupAddress(address)

  //no ens name. check unstoppable
  if (ensName == null) {
    return address;
  }
  
  return ensName;
}