import { analytics } from '@/analytics';
import { UniqueAsset } from '@/entities';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '@/handlers/localstorage/accountLocal';
import { START_CURSOR } from '@/handlers/simplehash';
import { Network } from '@/helpers';
import { logger, RainbowError } from '@/logger';
import { parseSimplehashNFTs } from '@/parsers';
import { fetchNfts, NftsQueryConfigType } from '@/resources/nftsQuery';
import { fetchPolygonAllowlist } from '@/resources/polygonAllowlistQuery';
import { promiseUtils } from '@/utils';
import { captureException } from '@sentry/react-native';
import { uniqBy } from 'lodash';
import { useEffect, useState } from 'react';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import useIsMounted from './useIsMounted';

const POAP_ADDRESS = '0x22c1f6050e56d2876009903609a2cc3fef83b415';
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

export const filterNfts = (nfts: UniqueAsset[], polygonAllowlist: string[]) =>
  nfts.filter((nft: UniqueAsset) => {
    if (nft.collection.name === null) return false;

    // filter out spam
    if (nft.spamScore >= 85) return false;

    // filter gnosis NFTs that are not POAPs
    if (
      nft.network === Network.gnosis &&
      nft.asset_contract &&
      nft?.asset_contract?.address?.toLowerCase() !== POAP_ADDRESS
    )
      return false;

    if (
      nft.network === Network.polygon &&
      !polygonAllowlist.includes(nft.asset_contract?.address?.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

export const fetchAllUniqueTokens = async (
  address: string,
  network: Network
) => {
  const [
    storedNfts,
    polygonAllowlist,
    nftResponse,
  ] = await promiseUtils.PromiseAllWithFails([
    getUniqueTokens(address, network),
    fetchPolygonAllowlist(),
    fetchNfts({
      address,
      cursor: START_CURSOR,
    }),
  ]);
  const { data, nextCursor } = nftResponse;
  let cursor = nextCursor;
  let nfts;
  const newNfts = filterNfts(parseSimplehashNFTs(data), polygonAllowlist);
  if (storedNfts?.length) {
    nfts = uniqBy([...storedNfts, ...newNfts], 'uniqueId');
  } else {
    nfts = newNfts;
  }
  while (cursor && nfts.length < UNIQUE_TOKENS_LIMIT_TOTAL) {
    // eslint-disable-next-line no-await-in-loop
    const { data, nextCursor } = await fetchNfts({
      address,
      cursor,
    });
    const newNfts = filterNfts(parseSimplehashNFTs(data), polygonAllowlist);
    if (storedNfts?.length) {
      nfts = uniqBy([...nfts, ...newNfts], 'uniqueId');
    } else {
      nfts = [...nfts, ...newNfts];
    }
    cursor = nextCursor;
  }
  await saveUniqueTokens(nfts, address, network);
  analytics.identify(undefined, { NFTs: nfts.length });
  return nfts;
};

export const useUniqueTokens = ({
  address,
  queryConfig = {},
}: {
  address: string;
  queryConfig?: NftsQueryConfigType;
}) => {
  const { network } = useAccountSettings();
  const { accountAddress } = useAccountProfile();
  const mounted = useIsMounted();

  const [cursor, setCursor] = useState<string | undefined>();
  const [uniqueTokens, setUniqueTokens] = useState<UniqueAsset[]>([]);
  const [shouldFetchMore, setShouldFetchMore] = useState(false);
  const [loadedStoredUniqueTokens, setLoadedStoredUniqueTokens] = useState(
    false
  );
  const [polygonAllowlist, setPolygonAllowlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const setupAndFirstFetch = async () => {
      try {
        const [
          storedUniqueTokens,
          allowlist,
          newUniqueTokensResponse,
        ] = await promiseUtils.PromiseAllWithFails([
          getUniqueTokens(address, network),
          fetchPolygonAllowlist(),
          fetchNfts(
            {
              address,
              cursor: START_CURSOR,
            },
            queryConfig
          ),
        ]);
        const { data, nextCursor } = newUniqueTokensResponse;
        setCursor(nextCursor);
        const newUniqueTokens = filterNfts(
          parseSimplehashNFTs(data),
          allowlist
        );
        let updatedUniqueTokens;
        if (storedUniqueTokens?.length) {
          setLoadedStoredUniqueTokens(true);
          updatedUniqueTokens = uniqBy(
            [...storedUniqueTokens, ...newUniqueTokens],
            'uniqueId'
          );
        } else {
          updatedUniqueTokens = newUniqueTokens;
        }
        if (accountAddress === address) {
          await saveUniqueTokens(newUniqueTokens, address, network);
        }
        setUniqueTokens(updatedUniqueTokens);
        setPolygonAllowlist(allowlist);
        if (nextCursor) {
          setShouldFetchMore(true);
        } else {
          setIsSuccess(true);
          setIsLoading(false);
        }
      } catch (error) {
        setShouldFetchMore(false);
        setIsLoading(false);
        captureException(error);
        logger.error(new RainbowError(`useNfts error: ${error}`));
      }
    };
    if (address && mounted.current) {
      setupAndFirstFetch();
    }
  }, [accountAddress, address, mounted, network, queryConfig]);

  useEffect(() => {
    const fetchNextPage = async () => {
      try {
        const { data, nextCursor } = await fetchNfts(
          {
            address,
            cursor: cursor as string,
          },
          queryConfig
        );
        const newUniqueTokens = filterNfts(
          parseSimplehashNFTs(data),
          polygonAllowlist
        );
        setCursor(nextCursor);
        let updatedUniqueTokens;
        if (loadedStoredUniqueTokens) {
          updatedUniqueTokens = uniqBy(
            [...uniqueTokens, ...newUniqueTokens],
            'uniqueId'
          );
        } else {
          updatedUniqueTokens = [...uniqueTokens, ...newUniqueTokens];
        }
        await saveUniqueTokens(address, updatedUniqueTokens, network);
        setUniqueTokens(updatedUniqueTokens);
        if (uniqueTokens?.length >= UNIQUE_TOKENS_LIMIT_TOTAL || !nextCursor) {
          setShouldFetchMore(false);
          setIsLoading(false);
          setIsSuccess(true);
        }
      } catch (error) {
        setIsLoading(false);
        setShouldFetchMore(false);
        captureException(error);
        logger.error(new RainbowError(`useUniqueTokens error: ${error}`));
      }
    };
    if (shouldFetchMore && mounted.current) {
      fetchNextPage();
    }
  }, [
    address,
    cursor,
    loadedStoredUniqueTokens,
    network,
    uniqueTokens,
    polygonAllowlist,
    queryConfig,
    shouldFetchMore,
    mounted,
  ]);

  useEffect(() => {
    if (isSuccess) {
      analytics.identify(undefined, { NFTs: uniqueTokens.length });
    }
  }, [isSuccess, uniqueTokens.length]);

  return {
    uniqueTokens,
    isLoading,
    isSuccess,
  };
};
