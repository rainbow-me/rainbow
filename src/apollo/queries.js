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
`

export const COMPOUND_USDC_ACCOUNT_TOKEN_QUERY = gql`
  query accountCToken {
    accountCToken(id: "0x39aa39c021dfbae8fac545936693ac917d5e7563-0xf0f21ab2012731542731df194cff6c77d29cb31a") {
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
`