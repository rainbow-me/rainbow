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

export const buildPositionsUrl = (address: string) =>
  `https://addys.p.rainbow.me/v2/1/${address}/positions`;

const getPositions = async (
  address: string,
  currency: NativeCurrencyKey
): Promise<AddysPositionsResponse> => {
  console.log('FETCHING POSITIONS VIA NETWORK');
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
};

export type RainbowPosition = {
  type: string;
  totals: PositionsTotals;
  claimables: RainbowClaimable[];
  borrows: RainbowBorrow[];
  deposits: RainbowDeposit[];
};

export type RainbowPositions = {
  totals: {
    total: NativeDisplay;
    borrows: NativeDisplay;
    claimables: NativeDisplay;
    deposits: NativeDisplay;
  };
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

const parsePosition = (position: Position): RainbowPosition => {
  let totalDeposits: string = '0';
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
            'USD'
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

  let totalBorrows: string = '0';

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
            'USD'
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

  const positionTotals: PositionsTotals = {
    totals: {
      amount: subtract(add(totalDeposits, '0'), totalBorrows),
      display: convertAmountToNativeDisplay(
        subtract(add(totalDeposits, 0), totalBorrows),
        'USD'
      ),
    },
    borrows: {
      amount: totalBorrows,
      display: convertAmountToNativeDisplay(totalBorrows, 'USD'),
    },
    claimables: { amount: '0', display: '0' },
    deposits: {
      amount: totalDeposits,
      display: convertAmountToNativeDisplay(totalDeposits, 'USD'),
    },
  };

  return {
    type: position.type,
    totals: positionTotals,
    deposits: parsedDeposits,
    borrows: parsedBorrows,
    claimables: position.claimables,
  };
};
const parsePositions = (data: AddysPositionsResponse): RainbowPositions => {
  console.log('PARSING POSITIONS');
  const positions: Position[] = data.payload?.positions;

  const parsedPositions = positions.map(position => parsePosition(position));

  const positionsTotals = parsedPositions.reduce(
    (acc, position) => ({
      borrows: {
        amount: add(acc.borrows.amount, position.totals.borrows.amount),
        display: convertAmountToNativeDisplay(
          add(acc.borrows.amount, position.totals.borrows.amount),
          'USD'
        ),
      },
      deposits: {
        amount: add(acc.deposits.amount, position.totals.deposits.amount),
        display: convertAmountToNativeDisplay(
          add(acc.deposits.amount, position.totals.deposits.amount),
          'USD'
        ),
      },
      claimables: {
        amount: add(acc.claimables.amount, position.totals.claimables.amount),
        display: convertAmountToNativeDisplay(
          add(acc.claimables.amount, position.totals.claimables.amount),
          'USD'
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
    display: convertAmountToNativeDisplay(totalAmount, 'USD'),
  };

  return {
    totals: {
      total: totalDisplay,
      ...positionsTotals,
    },
    positions: parsedPositions,
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
  console.log('FETCHING POSITIONS');
  const data = await getPositions(address, currency);
  return parsePositions(data);
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
