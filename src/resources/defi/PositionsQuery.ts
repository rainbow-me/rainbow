import { useQuery } from '@tanstack/react-query';

import {
  createQueryKey,
  queryClient,
  QueryConfig,
  QueryFunctionArgs,
  QueryFunctionResult,
} from '@/react-query';

import { NativeCurrencyKey, ZerionAsset } from '@/entities';
import { rainbowFetch } from '@/rainbow-fetch';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import {
  add,
  convertAmountToNativeDisplay,
  convertRawAmountToNativeDisplay,
  subtract,
} from '@/helpers/utilities';
import { RainbowNetworks } from '@/networks';
import { maybeSignUri } from '@/handlers/imgix';
import { ethereumUtils } from '@/utils';
import { Network } from '@/networks/types';

export const buildPositionsUrl = (address: string) => {
  const networkString = RainbowNetworks.filter(network => network.enabled)
    .map(network => network.id)
    .join(',');
  return `https://addys.p.rainbow.me/v3/${networkString}/${address}/positions`;
};

const getPositions = async (
  address: string,
  currency: NativeCurrencyKey
): Promise<AddysPositionsResponse> => {
  const response = await rainbowFetch(buildPositionsUrl(address), {
    method: 'get',
    params: {
      currency,
    },
    headers: {
      Authorization: `Bearer ${ADDYS_API_KEY}`,
    },
  });
  if (response.data) {
    return response.data;
  }

  // should pop a warn here
  return {};
};
// ///////////////////////////////////////////////
// Query Types

export type PositionsArgs = {
  address: string;
  currency: NativeCurrencyKey;
};

export type NativeDisplay = {
  amount: string;
  display: string;
};

export type PositionDapp = {
  name: string;
  url: string;
  icon_url: string;
  colors: {
    primary: string;
    fallback: string;
    shadow: string;
  };
};

export type PositionsTotals = {
  totals: NativeDisplay;
  borrows: NativeDisplay;
  claimables: NativeDisplay;
  deposits: NativeDisplay;
};
export type Claimable = {
  asset: ZerionAsset;
  quantity: string;
};
export type Deposit = {
  apr: string;
  apy: string;
  asset: ZerionAsset;
  quantity: string;
  total_asset: string; // what does this mean?
  underlying: { asset: ZerionAsset; quantity: string }[];
};
export type Borrow = {
  apr: string;
  apy: string;
  asset: ZerionAsset;
  quantity: string;
  total_asset: string; // what does this mean?
  underlying: { asset: ZerionAsset; quantity: string }[];
};

export type RainbowClaimable = {
  asset: ZerionAsset;
  quantity: string;
  native: NativeDisplay;
};
export type RainbowDeposit = {
  apr: string;
  apy: string;
  asset: ZerionAsset;
  quantity: string;
  total_asset: string; // what does this mean?
  underlying: { asset: ZerionAsset; quantity: string; native: NativeDisplay }[];
};
export type RainbowBorrow = {
  apr: string;
  apy: string;
  asset: ZerionAsset;
  quantity: string;
  total_asset: string; // what does this mean?
  underlying: { asset: ZerionAsset; quantity: string; native: NativeDisplay }[];
};

// TODO: need to add dapp metadata once its added via BE
export type Position = {
  type: string;
  claimables: Claimable[];
  borrows: Borrow[];
  deposits: Deposit[];
  dapp: PositionDapp;
};

export type RainbowPosition = {
  type: string;
  totals: PositionsTotals;
  claimables: RainbowClaimable[];
  borrows: RainbowBorrow[];
  deposits: RainbowDeposit[];
  dapp: PositionDapp;
};

export type RainbowPositions = {
  totals: {
    total: NativeDisplay;
    borrows: NativeDisplay;
    claimables: NativeDisplay;
    deposits: NativeDisplay;
  };
  positionTokens: string[];
  positions: RainbowPosition[];
};

// ///////////////////////////////////////////////
// Query Key

// Key used for loading the cache with data from storage
export const POSITIONS_QUERY_KEY = 'positions';

type AddysPositionsResponse =
  | {
      meta: Record<string, any>;
      payload: Record<string, any>;
    }
  | Record<string, never>;

const parsePosition = (
  position: Position,
  currency: NativeCurrencyKey
): RainbowPosition => {
  let totalDeposits = '0';
  const parsedDeposits = position.deposits?.map(
    (deposit: Deposit): RainbowDeposit => {
      deposit.underlying = deposit.underlying?.map(
        (underlying: {
          asset: ZerionAsset;
          quantity: string;
        }): { asset: ZerionAsset; quantity: string; native: NativeDisplay } => {
          const nativeDisplay = convertRawAmountToNativeDisplay(
            underlying.quantity,
            underlying.asset.decimals,
            underlying.asset.price?.value!,
            currency
          );
          totalDeposits = add(totalDeposits, nativeDisplay.amount);

          return {
            ...underlying,
            native: nativeDisplay,
          };
        }
      );
      return deposit as RainbowDeposit;
    }
  );

  let totalBorrows = '0';

  const parsedBorrows = position.borrows?.map(
    (borrow: Borrow): RainbowBorrow => {
      borrow.underlying = borrow.underlying.map(
        (underlying: {
          asset: ZerionAsset;
          quantity: string;
        }): { asset: ZerionAsset; quantity: string; native: NativeDisplay } => {
          const nativeDisplay = convertRawAmountToNativeDisplay(
            underlying.quantity,
            underlying.asset.decimals,
            underlying.asset.price?.value!,
            currency
          );
          totalBorrows = add(totalBorrows, nativeDisplay.amount);

          return {
            ...underlying,
            native: nativeDisplay,
          };
        }
      );
      return borrow as RainbowBorrow;
    }
  );

  let totalClaimables = '0';
  const parsedClaimables = position.claimables?.map(
    (claim: Claimable): RainbowClaimable => {
      const nativeDisplay = convertRawAmountToNativeDisplay(
        claim.quantity,
        claim.asset.decimals,
        claim.asset.price?.value!,
        currency
      );
      totalClaimables = add(totalClaimables, nativeDisplay.amount);
      return {
        asset: claim.asset,
        quantity: claim.quantity,
        native: nativeDisplay,
      };
    }
  );

  const positionTotals: PositionsTotals = {
    totals: {
      amount: subtract(add(totalDeposits, totalClaimables), totalBorrows),
      display: convertAmountToNativeDisplay(
        subtract(add(totalDeposits, totalClaimables), totalBorrows),
        currency
      ),
    },
    borrows: {
      amount: totalBorrows,
      display: convertAmountToNativeDisplay(totalBorrows, currency),
    },
    claimables: {
      amount: totalClaimables,
      display: convertAmountToNativeDisplay(totalClaimables, currency),
    },
    deposits: {
      amount: totalDeposits,
      display: convertAmountToNativeDisplay(totalDeposits, currency),
    },
  };

  return {
    type: position.type,
    totals: positionTotals,
    deposits: parsedDeposits,
    borrows: parsedBorrows,
    claimables: parsedClaimables,
    // revert dapp name bs once versions are handled via backend
    dapp: {
      ...position.dapp,
      name: position.type,
      icon_url: maybeSignUri(position.dapp.icon_url) || position.dapp.icon_url,
    },
  };
};
const parsePositions = (
  data: AddysPositionsResponse,
  currency: NativeCurrencyKey
): RainbowPositions => {
  const networkAgnosticPositions = data.payload?.positions.reduce(
    (acc: Record<string, Position>, position: Position) => {
      return {
        ...acc,
        [position.type]: {
          claimables: [
            ...(acc?.[position.type]?.claimables || []),
            ...(position?.claimables || []),
          ],
          deposits: [
            ...(acc?.[position.type]?.deposits || []),
            ...(position?.deposits || []),
          ],
          borrows: [
            ...(acc?.[position.type]?.borrows || []),
            ...(position?.borrows || []),
          ],
          dapp: position.dapp,
        },
      };
    },
    {}
  );

  const positions = Object.keys(networkAgnosticPositions).map(key => ({
    type: key,
    ...networkAgnosticPositions[key],
  }));

  const parsedPositions = positions.map(position =>
    parsePosition(position, currency)
  );

  const positionTokens: string[] = [];

  parsedPositions.forEach(({ deposits }) => {
    deposits.forEach(({ asset }) => {
      const assetType = ethereumUtils.getAssetTypeFromNetwork(Network.mainnet);
      const uniqueId = `${asset.asset_code}_${assetType}`;

      positionTokens.push(uniqueId);
    });
  });

  const positionsTotals = parsedPositions.reduce(
    (acc, position) => ({
      borrows: {
        amount: add(acc.borrows.amount, position.totals.borrows.amount),
        display: convertAmountToNativeDisplay(
          add(acc.borrows.amount, position.totals.borrows.amount),
          currency
        ),
      },
      deposits: {
        amount: add(acc.deposits.amount, position.totals.deposits.amount),
        display: convertAmountToNativeDisplay(
          add(acc.deposits.amount, position.totals.deposits.amount),
          currency
        ),
      },
      claimables: {
        amount: add(acc.claimables.amount, position.totals.claimables.amount),
        display: convertAmountToNativeDisplay(
          add(acc.claimables.amount, position.totals.claimables.amount),
          currency
        ),
      },
    }),
    {
      borrows: { amount: '0', display: '0' },
      claimables: { amount: '0', display: '0' },
      deposits: { amount: '0', display: '0' },
    }
  );

  const totalAmount = subtract(
    add(positionsTotals.deposits.amount, positionsTotals.claimables.amount),
    positionsTotals.borrows.amount
  );

  const totalDisplay = {
    amount: totalAmount,
    display: convertAmountToNativeDisplay(totalAmount, currency),
  };

  return {
    totals: {
      total: totalDisplay,
      ...positionsTotals,
    },
    positions: parsedPositions,
    positionTokens,
  };
};

export const positionsQueryKey = ({ address, currency }: PositionsArgs) =>
  createQueryKey(
    POSITIONS_QUERY_KEY,
    { address, currency },
    { persisterVersion: 1 }
  );

type PositionsQueryKey = ReturnType<typeof positionsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function positionsQueryFunction({
  queryKey: [{ address, currency }],
}: QueryFunctionArgs<typeof positionsQueryKey>) {
  const data = await getPositions(address, currency);
  return parsePositions(data, currency);
}

type PositionsResult = QueryFunctionResult<typeof positionsQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher (Optional)

export async function prefetchPositions(
  { address, currency }: PositionsArgs,
  config: QueryConfig<PositionsResult, Error, PositionsQueryKey> = {}
) {
  return await queryClient.prefetchQuery(
    positionsQueryKey({ address, currency }),
    positionsQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Fetcher (Optional)

export async function fetchPositions(
  { address, currency }: PositionsArgs,
  config: QueryConfig<PositionsResult, Error, PositionsQueryKey> = {}
) {
  return await queryClient.fetchQuery(
    positionsQueryKey({ address, currency }),
    positionsQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function usePositions(
  { address, currency }: PositionsArgs,
  config: QueryConfig<PositionsResult, Error, PositionsQueryKey> = {}
) {
  return useQuery(
    positionsQueryKey({ address, currency }),
    positionsQueryFunction,
    config
  );
}
