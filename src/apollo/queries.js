import gql from 'graphql-tag';

export const COMPOUND_MARKET_QUERY = gql`
  query markets {
    markets(first: 10) {
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

// Create Queries for DAI and for USDC
export const COMPOUND_ACCOUNT_TOKEN_QUERY = gql`
  query accountCToken {
    accountCToken(id: "0xf5dce57282a584d2746faf1593d3121fcac444dc-0x00000000af5a61acaf76190794e3fdf1289288a1") {
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
`