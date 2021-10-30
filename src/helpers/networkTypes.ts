export enum Network {
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
export default {
  arbitrum: 'arbitrum' as Network,
  goerli: 'goerli' as Network,
  kovan: 'kovan' as Network,
  mainnet: 'mainnet' as Network,
  optimism: 'optimism' as Network,
  polygon: 'polygon' as Network,
  rinkeby: 'rinkeby' as Network,
  ropsten: 'ropsten' as Network,
};
