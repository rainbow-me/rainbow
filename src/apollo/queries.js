import gql from 'graphql-tag';

export const COMPOUND_MARKET_QUERY = gql`
  query markets {
    markets(first: 5) {
      exchangeRate
      interestRateModelAddress
      name
      supplyRate
      underlyingAddress
      underlyingPriceUSD
      underlyingPrice
    }
  }
`;
