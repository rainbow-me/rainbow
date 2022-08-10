export enum Network {
  arbitrum = 'arbitrum',
  goerli = 'goerli',
  mainnet = 'mainnet',
  optimism = 'optimism',
  polygon = 'polygon',
}

// We need to keep this one until
// we have typescript everywhere
export default {
  arbitrum: 'arbitrum' as Network,
  goerli: 'goerli' as Network,
  mainnet: 'mainnet' as Network,
  optimism: 'optimism' as Network,
  polygon: 'polygon' as Network,
};
