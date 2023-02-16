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
import {
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
} from '@/redux/uniqueTokens';
import { fetchNfts, NftsQueryConfigType } from '@/resources/nftsQuery';
import { fetchPolygonAllowlist } from '@/resources/polygonAllowlistQuery';
import { promiseUtils } from '@/utils';
import { captureException } from '@sentry/react-native';
import { uniqBy } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import useIsMounted from './useIsMounted';

const POAP_ADDRESS = '0x22c1f6050e56d2876009903609a2cc3fef83b415';
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

export const filterNfts = (nfts: UniqueAsset[], polygonAllowlist: string[]) =>
  nfts.filter((nft: UniqueAsset) => {
    if (!nft.collection.name) return false;

    // filter out spam
    if (nft.spamScore === null || nft.spamScore >= 85) return false;

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
  const dispatch = useDispatch();

  const [cursor, setCursor] = useState<string | undefined>();
  const [uniqueTokens, setUniqueTokens] = useState<UniqueAsset[]>([]);
  const [shouldFetchMore, setShouldFetchMore] = useState(false);
  const [loadedStoredUniqueTokens, setLoadedStoredUniqueTokens] = useState(
    false
  );
  const [polygonAllowlist, setPolygonAllowlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [didSetup, setDidSetup] = useState(false);
  const [didDispatch, setDidDispatch] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(address);

  const handleError = useCallback(
    (error: Error) => {
      setShouldFetchMore(false);
      setIsLoading(false);
      captureException(error);
      logger.error(new RainbowError(`useNfts error: ${error}`));
      if (address === accountAddress) {
        setDidDispatch(true);
        dispatch({
          showcase: false,
          type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
        });
      }
    },
    [accountAddress, address, dispatch]
  );

  const resetState = useCallback(() => {
    setCursor(undefined);
    setUniqueTokens([]);
    setShouldFetchMore(false);
    setLoadedStoredUniqueTokens(false);
    setPolygonAllowlist([]);
    setIsLoading(true);
    setIsSuccess(false);
    setDidSetup(false);
    setDidDispatch(false);
  }, []);

  useEffect(() => {
    if (address !== currentAddress) {
      resetState();
      setCurrentAddress(address);
    }
  }, [address, currentAddress, resetState]);

  useEffect(() => {
    const setupAndFirstFetch = async () => {
      try {
        const [
          storedUniqueTokens,
          allowlist,
          newUniqueTokensResponse,
        ] = await promiseUtils.PromiseAllWithFails([
          getUniqueTokens(currentAddress, network),
          fetchPolygonAllowlist(),
          fetchNfts(
            {
              address: currentAddress,
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
        setUniqueTokens(updatedUniqueTokens);
        setPolygonAllowlist(allowlist);
        if (nextCursor) {
          setShouldFetchMore(true);
        } else {
          setIsSuccess(true);
          setIsLoading(false);
        }
      } catch (error) {
        handleError(error as Error);
      }
    };
    if (currentAddress && mounted.current && !didSetup) {
      setDidSetup(true);
      if (currentAddress === accountAddress) {
        dispatch({
          showcase: false,
          type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
        });
      }
      setupAndFirstFetch();
    }
  }, [
    accountAddress,
    currentAddress,
    didSetup,
    dispatch,
    handleError,
    mounted,
    network,
    queryConfig,
  ]);

  useEffect(() => {
    const fetchNextPage = async () => {
      try {
        const { data, nextCursor } = await fetchNfts(
          {
            address: currentAddress,
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
        setUniqueTokens(updatedUniqueTokens);
        if (uniqueTokens?.length >= UNIQUE_TOKENS_LIMIT_TOTAL || !nextCursor) {
          setIsLoading(false);
          setIsSuccess(true);
        } else {
          setShouldFetchMore(true);
        }
      } catch (error) {
        handleError(error as Error);
      }
    };
    if (shouldFetchMore && mounted.current) {
      setShouldFetchMore(false);
      fetchNextPage();
    }
  }, [
    currentAddress,
    cursor,
    handleError,
    loadedStoredUniqueTokens,
    mounted,
    polygonAllowlist,
    queryConfig,
    shouldFetchMore,
    uniqueTokens,
  ]);

  useEffect(() => {
    if (isSuccess) {
      analytics.identify(undefined, { NFTs: uniqueTokens.length });
      if (accountAddress === address) {
        saveUniqueTokens(uniqueTokens, address, network);
        setDidDispatch(true);
        dispatch({
          payload: uniqueTokens,
          showcase: false,
          type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
        });
      }
    }
  }, [accountAddress, address, dispatch, isSuccess, network, uniqueTokens]);

  useEffect(
    () => () => {
      if (currentAddress === accountAddress) {
        if (!didDispatch) {
          dispatch({
            showcase: false,
            type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
          });
        }
      }
    },
    [
      accountAddress,
      address,
      currentAddress,
      didDispatch,
      dispatch,
      isSuccess,
      uniqueTokens,
    ]
  );

  return {
    uniqueTokens,
    isLoading,
    isSuccess,
  };
};
