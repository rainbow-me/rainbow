import { useQuery } from '@tanstack/react-query';
import useAccountSettings from './useAccountSettings';
import {
  queryClient,
  QueryConfigDeprecated,
  UseQueryData,
} from '@/react-query';
import { EthereumAddress } from '@/entities';
import { getNFTOffers, saveNFTOffers } from '@/handlers/localstorage/nftOffers';
import { apiGetNFTOffers } from '@/handlers/opensea-api';
import useFetchUniqueTokens from './useFetchUniqueTokens';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';

const queryKey = (address: EthereumAddress) => ['nft-offers', address];

const STALE_TIME = 10000;

async function fetchNFTOffers(address: EthereumAddress) {
  const cachedOffers = await getNFTOffers(address);
  if (cachedOffers) {
    queryClient.setQueryData(queryKey(address), cachedOffers);
  }
  const offers = await apiGetNFTOffers(address);
  saveNFTOffers(address, offers);
  return offers;
}

export async function prefetchNFTOffers(address: EthereumAddress) {
  queryClient.prefetchQuery(
    queryKey(address),
    async () => fetchNFTOffers(address),
    {
      staleTime: STALE_TIME,
    }
  );
}

/**
 * @description Hook to fetch a whole ENS profile.
 *
 * WARNING: This will invoke several requests to the RPC. You may
 * be better off using the individual hooks (e.g. `useENSAvatar`, `useENSRecords`, etc)
 * if you do not need everything.
 */
export default function useNFTOffers({
  ...config
}: QueryConfigDeprecated<typeof fetchNFTOffers> & {
  supportedRecordsOnly?: boolean;
} = {}) {
  const { accountAddress } = useAccountSettings();
  const uniqueTokens = useSelector(
    ({ uniqueTokens }: AppState) => uniqueTokens.uniqueTokens
  );
  // console.log(uniqueTokens?.[0]);
  const uniqueTokenAddresses = uniqueTokens
    ?.map(token => token.asset_contract.address)
    .filter(address => !!address);
  const offerRequests = uniqueTokenAddresses?.map(address => {
    return async () => await fetchNFTOffers(address!);
  });
  // console.log(offerRequests);
  const x = async () => {
    // console.log('TEST');
    // Promise.all(offerRequests).then(values => console.log(values));
    offerRequests?.[0]().then(value => console.log(value));
  };

  // const { data, isLoading, isSuccess } = useQuery<
  //   UseQueryData<typeof fetchNFTOffers>
  // >(queryKey(accountAddress), async () => fetchNFTOffers(accountAddress), {
  //   ...config,
  //   // Data will be stale for 10s to avoid dupe queries
  //   staleTime: STALE_TIME,
  // });

  return {
    x,
  };
}
