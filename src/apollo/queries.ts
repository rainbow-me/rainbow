import gql from 'graphql-tag';

export const UNISWAP_PAIR_DATA_QUERY_VOLUME = (
  pairAddress: string,
  block: number
) => {
  const queryString = `
    fragment PairFields on Pair {
      volumeUSD
  }
  query pairs {
    pairs(${
      block ? `block: {number: ${block}}` : ``
    } where: { id: "${pairAddress}"} ) {
      ...PairFields
    }
  }`;
  return gql`
    ${queryString}
  `;
};

export const COMPOUND_ACCOUNT_AND_MARKET_QUERY = gql`
  query account($id: ID!) {
    markets {
      exchangeRate
      id
      name
      supplyRate
      symbol
      underlyingAddress
      underlyingName
      underlyingSymbol
      underlyingDecimals
      underlyingPrice
    }
    account(id: $id) {
      id
      tokens(where: { cTokenBalance_gt: 0 }) {
        cTokenBalance
        id
        lifetimeSupplyInterestAccrued
        supplyBalanceUnderlying
        symbol
        totalUnderlyingSupplied
      }
    }
  }
`;

export const UNISWAP_ADDITIONAL_POOL_DATA = gql`
  query pairs($address: String!) {
    pairs(where: { id: $address }) {
      volumeUSD
      reserveUSD
      trackedReserveETH
    }
  }
`;

export const GET_BLOCKS_QUERY = (timestamps: any) => {
  let queryString = 'query blocks {';
  queryString += timestamps.map((timestamp: any) => {
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${
      timestamp + 600
    } }) {
        number
      }`;
  });
  queryString += '}';
  return gql`
    ${queryString}
  `;
};

export const USER_POSITIONS = gql`
  query liquidityPositions($user: Bytes!) {
    liquidityPositions(where: { user: $user, liquidityTokenBalance_gt: 0 }) {
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          decimals
          id
          name
          symbol
          derivedETH
        }
        token1 {
          decimals
          id
          name
          symbol
          derivedETH
        }
        totalSupply
      }
      liquidityTokenBalance
    }
  }
`;

export const USER_MINTS_BURNS_PER_PAIR = gql`
  query events($user: Bytes!, $pair: Bytes!) {
    mints(where: { to: $user, pair: $pair }) {
      amountUSD
      amount0
      amount1
      timestamp
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
    burns(where: { sender: $user, pair: $pair }) {
      amountUSD
      amount0
      amount1
      timestamp
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
  }
`;

export const USER_HISTORY = gql`
  query snapshots($user: Bytes!, $skip: Int!) {
    liquidityPositionSnapshots(
      first: 1000
      skip: $skip
      where: { user: $user }
    ) {
      timestamp
      reserveUSD
      liquidityTokenBalance
      liquidityTokenTotalSupply
      reserve0
      reserve1
      token0PriceUSD
      token1PriceUSD
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
  }
`;

export const CONTRACT_FUNCTION = gql`
  query contractFunction($chainID: Int!, $hex: String!) {
    contractFunction(chainID: $chainID, hex: $hex) {
      text
    }
  }
`;
