import { gql } from '@apollo/client';

const compoundMarketFields = `
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
`;

export const compoundTokenFields = `
cTokenBalance
id
lifetimeSupplyInterestAccrued
supplyBalanceUnderlying
symbol
totalUnderlyingSupplied
`;

export const COMPOUND_ACCOUNT = gql`
  query Account($accountAddress: String!) {
    account(id: $accountAddress) {
      id
      health
      tokens(first: 7) {
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

export const COMPOUND_MARKET_QUERY = gql`
  query markets {
    markets(first: 15) {
      ${compoundMarketFields}
    }
  }
`;

export const COMPOUND_DAI_ACCOUNT_TOKEN_QUERY = gql`
  query accountCToken($addr: String!) {
    accountCToken(where: { id: $addr }) {
      ${compoundTokenFields}
    }
  }
`;

export const COMPOUND_USDC_ACCOUNT_TOKEN_QUERY = gql`
  query accountCToken {
    accountCToken(id: "0x39aa39c021dfbae8fac545936693ac917d5e7563-0xf0f21ab2012731542731df194cff6c77d29cb31a") {
      ${compoundTokenFields}
    }
 }
`;
