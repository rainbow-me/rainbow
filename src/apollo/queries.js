import gql from 'graphql-tag';

export const COMPOUND_MARKET_QUERY = gql`
  query markets {
    markets(first: 7) {
      blockTimestamp
      id
      exchangeRate
      interestRateModelAddress
      name
      supplyRate
      underlyingAddress
      underlyingDecimals
      underlyingPriceUSD
      underlyingPrice
    }
  }
`;

export const COMPOUND_DAI_ACCOUNT_TOKEN_QUERY = gql`
  query accountCToken($addr: String!) {
    accountCToken(where: { id: $addr }) {
      cTokenBalance
      id
      lifetimeSupplyInterestAccrued
      market {
        blockTimestamp
        id
        exchangeRate
        interestRateModelAddress
        name
        supplyRate
        underlyingAddress
        underlyingDecimals
        underlyingPriceUSD
        underlyingPrice
      }
    }
  }
`;

export const COMPOUND_USDC_ACCOUNT_TOKEN_QUERY = gql`
  query accountCToken {
    accountCToken(
      id: "0x39aa39c021dfbae8fac545936693ac917d5e7563-0xf0f21ab2012731542731df194cff6c77d29cb31a"
    ) {
      cTokenBalance
      id
      lifetimeSupplyInterestAccrued
      market {
        blockTimestamp
        id
        exchangeRate
        interestRateModelAddress
        name
        supplyRate
        underlyingAddress
        underlyingDecimals
        underlyingPriceUSD
        underlyingPrice
      }
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

export const DIRECTORY_QUERY = gql`
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

export const COMPOUND_ACCOUNT_QUERY = gql`
  query account($id: ID!) {
    account(id: $id) {
      id
      health
      tokens(first: 15) {
        borrowBalanceUnderlying
        cTokenBalance
        id
        lifetimeSupplyInterestAccrued
        supplyBalanceUnderlying
        symbol
        totalUnderlyingSupplied
      }
      totalBorrowValueInEth
      totalCollateralValueInEth
    }
  }
`;

export const COMPOUND_ALL_MARKETS_QUERY = gql`
  query markets {
    markets(first: 15) {
      blockTimestamp
      exchangeRate
      id
      interestRateModelAddress
      name
      supplyRate
      underlyingAddress
      underlyingDecimals
      underlyingPrice
      underlyingPriceUSD
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
