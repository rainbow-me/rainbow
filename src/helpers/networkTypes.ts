export enum Network {
  mainnet = 'mainnet',
  testnet = 'alfajores',
}

export default {
  mainnet: 'mainnet' as Network,
  testnet: 'alfajores' as Network,
}

export enum Network2 {
  arbitrum = 'arbitrum',
  goerli = 'goerli',
  kovan = 'kovan',
  mainnet = 'mainnet',
  optimism = 'optimism',
  polygon = 'polygon',
  rinkeby = 'rinkeby',
  ropsten = 'ropsten',
}

// We need to keep this one until
// we have typescript everywhere
// export default {
//   arbitrum: 'arbitrum' as Network2,
//   goerli: 'goerli' as Network2,
//   kovan: 'kovan' as Network2,
//   mainnet: 'mainnet' as Network2,
//   optimism: 'optimism' as Network2,
//   polygon: 'polygon' as Network2,
//   rinkeby: 'rinkeby' as Network2,
//   ropsten: 'ropsten' as Network2,
// };
