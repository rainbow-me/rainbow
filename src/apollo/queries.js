import gql from 'graphql-tag';

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
  query tokens($excluded: [String]!, $first: Int!, $skip: Int!) {
    tokens(
      first: $first
      skip: $skip
      orderBy: totalLiquidity
      orderDirection: desc
      where: { id_not_in: $excluded, totalLiquidity_gt: 0 }
    ) {
      id
      derivedETH
      name
      symbol
      decimals
      totalLiquidity
    }
  }
`;
