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

export const CONTRACT_FUNCTION = gql`
  query contractFunction($chainID: Int!, $hex: String!) {
    contractFunction(chainID: $chainID, hex: $hex) {
      text
    }
  }
`;
