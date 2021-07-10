import networkTypes from './networkTypes';

const networkInfo = {
  [`${networkTypes.mainnet}`]: {
    balance_checker_contract_address:
      '0x4dcf4562268dd384fe814c00fad239f06c2a0c2b',
    color: '#3cc29e',
    disabled: false,
    exchange_enabled: true,
    faucet_url: null,
    name: 'Ethereum Mainnet',
    value: networkTypes.mainnet,
  },
  [`${networkTypes.ropsten}`]: {
    balance_checker_contract_address:
      '0xf17adbb5094639142ca1c2add4ce0a0ef146c3f9',
    color: '#ff4a8d',
    disabled: false,
    exchange_enabled: false,
    faucet_url: `http://faucet.metamask.io/`,
    name: 'Ropsten',
    testnet: true,
    value: networkTypes.ropsten,
  },
  [`${networkTypes.kovan}`]: {
    balance_checker_contract_address:
      '0xf3352813b612a2d198e437691557069316b84ebe',
    color: '#7057ff',
    disabled: false,
    exchange_enabled: false,
    faucet_url: `https://faucet.kovan.network/`,
    name: 'Kovan',
    testnet: true,
    value: networkTypes.kovan,
  },
  [`${networkTypes.rinkeby}`]: {
    balance_checker_contract_address:
      '0xc55386617db7b4021d87750daaed485eb3ab0154',
    color: '#f6c343',
    disabled: false,
    exchange_enabled: true,
    faucet_url: 'https://faucet.rinkeby.io/',
    name: 'Rinkeby',
    testnet: true,
    value: networkTypes.rinkeby,
  },
  [`${networkTypes.goerli}`]: {
    balance_checker_contract_address:
      '0xf3352813b612a2d198e437691557069316b84ebe',
    color: '#f6c343',
    disabled: false,
    exchange_enabled: false,
    faucet_url: 'https://goerli-faucet.slock.it/',
    name: 'Goerli',
    testnet: true,
    value: networkTypes.goerli,
  },
  [`${networkTypes.arbitrum}`]: {
    balance_checker_contract_address:
      '0x54A4E5800345c01455a7798E0D96438364e22723',
    color: '#0000ff',
    disabled: false,
    exchange_enabled: false,
    faucet_url: `https://faucet.kovan.network/`,
    layer2: true,
    name: 'Arbitrum',
    value: networkTypes.arbitrum,
  },
  [`${networkTypes.optimism}`]: {
    balance_checker_contract_address:
      '0x54A4E5800345c01455a7798E0D96438364e22723',
    color: '#ff0000',
    disabled: false,
    exchange_enabled: false,
    faucet_url: `https://faucet.kovan.network/`,
    layer2: true,
    name: 'Optimism',
    value: networkTypes.optimism,
  },
  [`${networkTypes.polygon}`]: {
    balance_checker_contract_address:
      '0x54A4E5800345c01455a7798E0D96438364e22723',
    color: '#800080',
    disabled: false,
    exchange_enabled: false,
    faucet_url: `https://faucet.kovan.network/`,
    layer2: true,
    name: 'Polygon (Matic)',
    value: networkTypes.polygon,
  },
};

export default networkInfo;
