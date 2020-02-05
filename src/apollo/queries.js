import { gql } from '@apollo/client';

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
