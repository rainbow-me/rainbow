import gql from 'graphql-tag';

export const UNISWAP_PAIRS_ID_QUERY = gql`
  query pairs {
    pairs(first: 200, orderBy: trackedReserveETH, orderDirection: desc) {
      id
    }
  }
`;

export const UNISWAP_PAIRS_ID_QUERY_BY_TOKEN = gql`
  query pairs($address: String!) {
    pairs0: pairs(
      first: 30
      orderBy: trackedReserveETH
      orderDirection: desc
      where: { token0: $address, trackedReserveETH_gt: 5 }
    ) {
      id
      trackedReserveETH
    }
    pairs1: pairs(
      first: 30
      orderBy: trackedReserveETH
      orderDirection: desc
      where: { token1: $address, trackedReserveETH_gt: 5 }
    ) {
      id
      trackedReserveETH
    }
  }
`;

export const UNISWAP_PAIR_DATA_QUERY = (pairAddress, block) => {
  const queryString = `
    fragment PairFields on Pair {
      id
      token0 {
        id
        symbol
        name
        totalLiquidity
        derivedETH
      }
      token1 {
        id
        symbol
        name
        totalLiquidity
        derivedETH
      }
      reserve0
      reserve1
      reserveUSD
      totalSupply
      trackedReserveETH
      volumeUSD
      untrackedVolumeUSD
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

export const UNISWAP_PAIR_DATA_QUERY_VOLUME = (pairAddress, block) => {
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

export const UNISWAP_PAIRS_BULK_QUERY = gql`
  fragment PairFields on Pair {
    id
    token0 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    token1 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    reserve0
    reserve1
    reserveUSD
    totalSupply
    trackedReserveETH
    volumeUSD
    untrackedVolumeUSD
  }
  query pairs($allPairs: [Bytes]!) {
    pairs(
      where: { id_in: $allPairs }
      orderBy: trackedReserveETH
      orderDirection: desc
    ) {
      ...PairFields
    }
  }
`;

export const UNISWAP_PAIRS_HISTORICAL_BULK_QUERY = gql`
  query pairs($block: Int!, $pairs: [Bytes]!) {
    pairs(
      first: 200
      where: { id_in: $pairs }
      block: { number: $block }
      orderBy: trackedReserveETH
      orderDirection: desc
    ) {
      id
      reserveUSD
      trackedReserveETH
      volumeUSD
      reserve0
      reserve1
      totalSupply
      token0 {
        derivedETH
      }
      token1 {
        derivedETH
      }
      untrackedVolumeUSD
    }
  }
`;

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

export const UNISWAP_24HOUR_PRICE_QUERY = (tokenAddress, block) => {
  const queryString = `
    query tokens {
      tokens(${
        block ? `block : {number: ${block}}` : ``
      } where: {id:"${tokenAddress}"}) {
        id
        derivedETH
      }
    }
  `;
  return gql(queryString);
};

export const UNISWAP_PRICES_QUERY = gql`
  query tokens($addresses: [String]!) {
    tokens(where: { id_in: $addresses, derivedETH_gt: 0 }) {
      id
      derivedETH
      symbol
      name
      decimals
    }
  }
`;

export const UNISWAP_ALL_TOKENS = gql`
  query tokens($first: Int!, $lastId: String!) {
    tokens(first: $first, where: { id_gt: $lastId }) {
      id
      derivedETH
      name
      symbol
      decimals
      totalLiquidity
    }
  }
`;

const TokenFields = `
  fragment TokenFields on Token {
    tradeVolumeUSD
  }
`;

export const TOKEN_DATA = (tokenAddress, block) => {
  const queryString = `
    ${TokenFields}
    query tokens {
      tokens(${
        block ? `block : {number: ${block}}` : ``
      } where: {id:"${tokenAddress}"}) {
        ...TokenFields
      }
      pairs0: pairs(where: {token0: "${tokenAddress}"}, first: 50, orderBy: reserveUSD, orderDirection: desc){
        id
      }
      pairs1: pairs(where: {token1: "${tokenAddress}"}, first: 50, orderBy: reserveUSD, orderDirection: desc){
        id
      }
    }
  `;
  return gql(queryString);
};

export const UNISWAP_ADDITIONAL_POOL_DATA = gql`
  query pairs($address: String!) {
    pairs(where: { id: $address }) {
      volumeUSD
      reserveUSD
      trackedReserveETH
    }
  }
`;

export const UNISWAP_ADDITIONAL_TOKEN_DATA = gql`
  query pairs($address: String!) {
    tokens(where: { id: $address }) {
      tradeVolumeUSD
    }
  }
`;

export const GET_BLOCKS_QUERY = timestamps => {
  let queryString = 'query blocks {';
  queryString += timestamps.map(timestamp => {
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
    liquidityPositions(where: { user: $user }) {
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
          symbol
          derivedETH
        }
        token1 {
          id
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
