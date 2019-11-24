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


// Create Queries for DAI and for USDC
export const COMPOUND_DAI_ACCOUNT_TOKEN_QUERY = gql`
  query accountCToken($address: String!){
    accountCToken(where: { id: $address }) {
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

// export const  COMPOUND_USDC_ACCOUNT_TOKEN_QUERY = gql`
//   query accountCToken() {
//     accountCToken()
//   }
// `