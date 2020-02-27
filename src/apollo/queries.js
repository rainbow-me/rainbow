import gql from 'graphql-tag';

export const COMPOUND_ACCOUNT_QUERY = gql`
  query account($id: ID!) {
    account(id: $id) {
      id
      tokens {
        borrowBalanceUnderlying
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

export const COMPOUND_ALL_MARKETS_QUERY = gql`
  query markets {
    markets {
      exchangeRate
      id
      name
      supplyRate
      underlyingAddress
      underlyingSymbol
      underlyingDecimals
      underlyingPrice
    }
  }
`;

export const COMPOUND_SUPPLY_RATE = gql`
  query markets($cTokenAddress: ID!) {
    markets(where: { id: $cTokenAddress }) {
      id
      supplyRate
    }
  }
`;

export const UNISWAP_PRICES_QUERY = gql`
  query exchanges($addresses: [String]!) {
    exchanges(where: { tokenAddress_in: $addresses, price_gt: 0 }) {
      id
      tokenAddress
      tokenSymbol
      price
    }
  }
`;

export const UNISWAP_24HOUR_PRICE_QUERY = gql`
  query exchangeHistoricalDatas($timestamp: Int!, $exchangeAddress: String!) {
    exchangeHistoricalDatas(
      where: { exchangeAddress: $exchangeAddress, timestamp_lt: $timestamp }
      first: 1
      orderBy: tradeVolumeEth
      orderDirection: desc
    ) {
      id
      timestamp
      exchangeAddress
      price
    }
  }
`;

export const UNISWAP_ALL_EXCHANGES_QUERY = gql`
  query exchanges($excluded: [String]!, $first: Int!, $skip: Int!) {
    exchanges(
      first: $first
      skip: $skip
      orderBy: combinedBalanceInUSD
      orderDirection: desc
      where: { tokenAddress_not_in: $excluded }
    ) {
      id
      tokenSymbol
      tokenName
      tokenDecimals
      tokenAddress
      ethBalance
    }
  }
`;
