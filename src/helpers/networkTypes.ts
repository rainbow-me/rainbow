export enum Network {
  arbitrum = 'arbitrum',
  goerli = 'goerli',
  mainnet = 'mainnet',
  optimism = 'optimism',
  polygon = 'polygon',
  base = 'base',
  bsc = 'bsc',
  zora = 'zora',
  gnosis = 'gnosis',
}

// We need to keep this one until
// we have typescript everywhere
export default {
  arbitrum: 'arbitrum' as Network,
  goerli: 'goerli' as Network,
  mainnet: 'mainnet' as Network,
  optimism: 'optimism' as Network,
  polygon: 'polygon' as Network,
  base: 'base' as Network,
  bsc: 'bsc' as Network,
  zora: 'zora' as Network,
  gnosis: 'gnosis' as Network,
};
