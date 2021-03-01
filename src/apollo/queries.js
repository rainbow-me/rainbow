import gql from 'graphql-tag';

export const UNISWAP_PAIRS_ID_QUERY = gql`
  query pairs {
    pairs(first: 200, orderBy: trackedReserveETH, orderDirection: desc) {
      id
    }
  }
`;

export const UNISWAP_PAIR_DATA_QUERY = (pairAddress, block) => {
  const queryString = `
    fragment PairFields on Pair {
      id
      txCount
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
      reserveETH
      volumeUSD
      untrackedVolumeUSD
      token0Price
      token1Price
      createdAtTimestamp
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
    txCount
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
    reserveETH
    volumeUSD
    untrackedVolumeUSD
    token0Price
    token1Price
    createdAtTimestamp
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

export const UNISWAP_PAIRS_HISTORICAL_BULK_QUERY = (block, pairs) => {
  let pairsString = `[`;
  pairs.map(pair => {
    return (pairsString += `"${pair}"`);
  });
  pairsString += ']';
  let queryString = `
  query pairs {
    pairs(first: 200, where: {id_in: ${pairsString}}, block: {number: ${block}}, orderBy: trackedReserveETH, orderDirection: desc) {
      id
      reserveUSD
      trackedReserveETH
      volumeUSD
      reserve0
      reserve1
      totalSupply
      token0 { derivedETH }
      token1 { derivedETH }
      untrackedVolumeUSD
    }
  }
  `;
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

export const UNISWAP_24HOUR_PRICE_QUERY = gql`
  query tokenDayDatas($timestamp: Int!, $address: String!) {
    tokenDayDatas(
      where: { id: $address, date_lt: $timestamp }
      first: 1
      orderBy: dailyVolumeEth
      orderDirection: desc
    ) {
      id
      priceUSD
      date
    }
  }
`;

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
