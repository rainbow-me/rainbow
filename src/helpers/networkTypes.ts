export enum Network {
  goerli = 'goerli',
  kovan = 'kovan',
  mainnet = 'mainnet',
  kovanovm = 'kovanovm',
  rinkeby = 'rinkeby',
  ropsten = 'ropsten',
}

// We need to keep this one until
// we have typescript everywhere
export default {
  goerli: 'goerli' as Network,
  kovan: 'kovan' as Network,
  kovanovm: 'kovanovm' as Network,
  mainnet: 'mainnet' as Network,
  rinkeby: 'rinkeby' as Network,
  ropsten: 'ropsten' as Network,
};
