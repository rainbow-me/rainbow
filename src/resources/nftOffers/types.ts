type NFTPaymentToken {
  contractAddress: String
  symbol: String!
  decimals: Int!
  name: String!
}

type NFTPaymentAmount {
  raw: String!
  decimal: Float!
  usd: Float!
}

type NFTOffer {
  contractAddress: String!
  tokenId: Int!
  floorDifferencePercentage: Float!
  validUntil: Int
  marketplace: String!
  grossAmount: NFTPaymentAmount!
  netAmount: NFTPaymentAmount!
  offerPaymentToken: NFTPaymentToken!
  royaltiesPercentage: Float!
  feesPercentage: Float!
  name: String!
  collectionName: String!
  floorPriceAmount: NFTPaymentAmount!
  floorPricePaymentToken: NFTPaymentToken!
  imageUrl: String!
}
