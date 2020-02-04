import { gql } from '@apollo/client';

const CDAI_TOKEN_ADDRESS = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643';

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

export const COMPOUND_CDAI_SUPPLY_RATE = gql`
  query markets {
    markets(where: { id: ${CDAI_TOKEN_ADDRESS} }) {
      id
      supplyRate
    }
  }
`;

export const COMPOUND_MARKET_QUERY = gql`
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
