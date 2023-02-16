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
import {
  fetchUniqueTokens,
  UniqueTokensQueryConfigType,
} from '@/resources/uniqueTokensQuery';
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

/**
 * This hook returns `uniqueTokens`, an array of nfts owned by the provided wallet address.
 * `uniqueTokens` is dynamically updated, 1 page of Simplehash nft data at a time. `uniqueTokens`
 * is not guaranteed to be a complete set of data unless `isSuccess` is true. If the provided
 * wallet address is the current account address, redux state will be updated upon start/success/failure.
 * If the provided wallet address is the current account address OR `uniqueTokens` already exists for
 * the provided address in local storage, local storage will be updated upon success. If you don't
 * care about streaming in nft data and just want to update state, see `useUpdateUniqueTokensState`.
 *
 * @param address wallet address
 * @param queryConfig optional react query config
 *
 * @returns
 *   uniqueTokens: UniqueAsset[] (nfts) owned by `address`
 *   isLoading: true if `uniqueTokens` is currently being updated, false otherwise
 *   isSuccess: true if `uniqueTokens` has been successfully and completely updated, false otherwise
 */
export const useUniqueTokens = ({
  address,
  queryConfig = {},
}: {
  address: string;
  queryConfig?: UniqueTokensQueryConfigType;
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
      logger.error(new RainbowError(`useUniqueTokens error: ${error}`));
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
    const setupAndFetchFirstPage = async () => {
      try {
        const [
          storedUniqueTokens,
          allowlist,
          newUniqueTokensResponse,
        ] = await promiseUtils.PromiseAllWithFails([
          getUniqueTokens(currentAddress, network),
          fetchPolygonAllowlist(),
          fetchUniqueTokens(
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
      setupAndFetchFirstPage();
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
        const { data, nextCursor } = await fetchUniqueTokens(
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
      if (accountAddress === currentAddress || loadedStoredUniqueTokens) {
        saveUniqueTokens(uniqueTokens, currentAddress, network);
      }
      if (accountAddress === currentAddress) {
        setDidDispatch(true);
        dispatch({
          payload: uniqueTokens,
          showcase: false,
          type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
        });
      }
    }
  }, [
    accountAddress,
    address,
    currentAddress,
    dispatch,
    isSuccess,
    loadedStoredUniqueTokens,
    network,
    uniqueTokens,
  ]);

  // if success/failure was not dispatched, dispatch failure on unmount
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
