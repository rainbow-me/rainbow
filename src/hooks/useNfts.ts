import { UniqueAsset } from '@/entities';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '@/handlers/localstorage/accountLocal';
import { START_CURSOR } from '@/handlers/simplehash';
import { Network } from '@/helpers';
import { parseSimplehashNFTs } from '@/parsers';
import { fetchNfts } from '@/resources/nftsQuery';
import { fetchPolygonAllowlist } from '@/resources/polygonAllowlistQuery';
import { promiseUtils } from '@/utils';
import { uniqBy } from 'lodash';
import { useEffect, useState } from 'react';
import useAccountSettings from './useAccountSettings';

const POAP_ADDRESS = '0x22c1f6050e56d2876009903609a2cc3fef83b415';
export const UNIQUE_TOKENS_LIMIT_PER_PAGE = 50;
export const UNIQUE_TOKENS_LIMIT_TOTAL = 2000;

const filterNfts = (nfts: UniqueAsset[], polygonAllowlist: string[]) =>
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

export const fetchAllNfts = async (address: string, network: Network) => {
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
};

export const useNfts = (address: string) => {
  const [cursor, setCursor] = useState<string | undefined>();
  const [nfts, setNfts] = useState<UniqueAsset[]>([]);
  const [shouldFetchMore, setShouldFetchMore] = useState(false);
  const [loadedStoredNfts, setLoadedStoredNfts] = useState(false);
  const [polygonAllowlist, setPolygonAllowlist] = useState<string[]>([]);
  const { network } = useAccountSettings();

  useEffect(() => {
    const setupAndFirstFetch = async () => {
      const [
        storedNfts,
        allowlist,
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
      setCursor(nextCursor);
      const newNfts = filterNfts(parseSimplehashNFTs(data), allowlist);
      let updatedNfts;
      if (storedNfts?.length) {
        setLoadedStoredNfts(true);
        updatedNfts = uniqBy([...storedNfts, ...newNfts], 'uniqueId');
      } else {
        updatedNfts = newNfts;
      }
      await saveUniqueTokens(updatedNfts, address, network);
      setNfts(updatedNfts);
      setPolygonAllowlist(allowlist);
      if (nextCursor) {
        setShouldFetchMore(true);
      }
    };
    if (address) {
      setupAndFirstFetch();
    }
  }, [address, network]);

  useEffect(() => {
    const fetchNextPage = async () => {
      const { data, nextCursor } = await fetchNfts({
        address,
        cursor: cursor as string,
      });
      const newNfts = filterNfts(parseSimplehashNFTs(data), polygonAllowlist);
      setCursor(nextCursor);
      let updatedNfts;
      if (loadedStoredNfts) {
        updatedNfts = uniqBy([...nfts, ...newNfts], 'uniqueId');
      } else {
        updatedNfts = [...nfts, ...newNfts];
      }
      await saveUniqueTokens(address, updatedNfts, network);
      setNfts(updatedNfts);
      if (nfts?.length >= UNIQUE_TOKENS_LIMIT_TOTAL || !nextCursor) {
        setShouldFetchMore(false);
      }
    };
    if (shouldFetchMore) {
      fetchNextPage();
    }
  }, [
    address,
    cursor,
    loadedStoredNfts,
    network,
    nfts,
    polygonAllowlist,
    shouldFetchMore,
  ]);

  return { nfts, isLoading: shouldFetchMore };
};
