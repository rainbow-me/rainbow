import { ApolloClient } from '@apollo/client';
import { DocumentNode } from 'graphql';
import { blockClientDeprecated } from '@/apollo/client';
import { GET_BLOCKS_QUERY } from '@/apollo/queries';
import { logger, RainbowError } from '@/logger';

async function splitQuery(
  query: DocumentNode,
  localClient: ApolloClient<any>,
  vars: any[],
  list: number[],
  skipCount = 100
) {
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
        // @ts-ignore
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
    } catch (e: any) {
      logger.error(new RainbowError('🦄 Pools split query error'), {
        message: e.message,
      });
    }
  }

  return fetchedData;
}

export default async function getBlocksFromTimestamps(
  timestamps: any,
  skipCount = 500
) {
  if (timestamps?.length === 0) {
    return [];
  }

  const fetchedData = await splitQuery(
    // @ts-expect-error ts-migrate(100007) FIXME: Remove this comment to see the full error message
    GET_BLOCKS_QUERY,
    blockClientDeprecated,
    [],
    timestamps,
    skipCount
  );

  const blocks = [];
  if (fetchedData) {
    for (let t in fetchedData) {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      if (fetchedData[t].length > 0) {
        blocks.push({
          // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          number: fetchedData[t][0]['number'],
          timestamp: t.split('t')[1],
        });
      }
    }
  }

  return blocks;
}
