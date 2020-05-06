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
  query exchangeHistoricalDatas($timestamp: Int!, $exchangeAddress: String!) {
    exchangeHistoricalDatas(
      where: { exchangeAddress: $exchangeAddress, timestamp_lt: $timestamp }
      first: 1
      orderBy: tradeVolumeEth
      orderDirection: desc
    ) {
      exchangeAddress
      id
      price
      timestamp
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
      ethBalance
      id
      tokenAddress
      tokenDecimals
      tokenName
      tokenSymbol
    }
  }
`;

export const UNISWAP_PRICES_QUERY = gql`
  query exchanges($addresses: [String]!) {
    exchanges(where: { tokenAddress_in: $addresses, price_gt: 0 }) {
      id
      price
      tokenAddress
      tokenSymbol
    }
  }
`;

export const UNISWAP_CHART_QUERY = gql`
  query exchangeDayDatas($date: Int!, $exchangeAddress: String!) {
    exchangeDayDatas(
      where: { exchangeAddress: $exchangeAddress, date_gt: $date }
      orderBy: date
      orderDirection: asc
    ) {
      date
      ethBalance
      tokenBalance
      marginalEthRate
      ethVolume
      tokenPriceUSD
      totalEvents
    }
  }
`;
