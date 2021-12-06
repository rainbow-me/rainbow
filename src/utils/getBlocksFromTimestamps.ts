import { blockClient } from '@rainbow-me/apollo/client';
import { GET_BLOCKS_QUERY } from '@rainbow-me/apollo/queries';
import logger from 'logger';

async function splitQuery(query, localClient, vars, list, skipCount = 100) {
  let fetchedData = {};
  let allFound = false;
  let skip = 0;

  while (!allFound) {
    let end = list.length;
    if (skip + skipCount < list.length) {
      end = skip + skipCount;
    }
    const sliced = list.slice(skip, end);
    try {
      const result = await localClient.query({
        fetchPolicy: 'network-only',
        query: query(...vars, sliced),
      });
      fetchedData = {
        ...fetchedData,
        ...result.data,
      };

      if (
        Object.keys(result.data).length < skipCount ||
        skip + skipCount > list.length
      ) {
        allFound = true;
      } else {
        skip += skipCount;
      }
    } catch (e) {
      logger.log('🦄 Pools split query error', e);
    }
  }

  return fetchedData;
}

export default async function getBlocksFromTimestamps(
  timestamps,
  skipCount = 500
) {
  if (timestamps?.length === 0) {
    return [];
  }

  const fetchedData = await splitQuery(
    GET_BLOCKS_QUERY,
    blockClient,
    [],
    timestamps,
    skipCount
  );

  const blocks = [];
  if (fetchedData) {
    for (let t in fetchedData) {
      if (fetchedData[t].length > 0) {
        blocks.push({
          number: fetchedData[t][0]['number'],
          timestamp: t.split('t')[1],
        });
      }
    }
  }

  return blocks;
}
