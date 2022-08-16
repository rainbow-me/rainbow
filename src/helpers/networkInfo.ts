import networkTypes from './networkTypes';

const networkInfo = {
  [`${networkTypes.mainnet}`]: {
    balance_checker_contract_address:
      '0x4dcf4562268dd384fe814c00fad239f06c2a0c2b',
    color: '#0E76FD',
    disabled: false,
    exchange_enabled: true,
    faucet_url: null,
    name: 'Ethereum',
    value: networkTypes.mainnet,
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
    color: '#2D374B',
    disabled: false,
    exchange_enabled: false,
    faucet_url: `https://faucet.kovan.network/`,
    layer2: true,
    name: 'Arbitrum',
    value: networkTypes.arbitrum,
  },
  [`${networkTypes.optimism}`]: {
    balance_checker_contract_address:
      '0x1C8cFdE3Ba6eFc4FF8Dd5C93044B9A690b6CFf36',
    color: '#FF4040',
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
    color: '#8247E5',
    disabled: false,
    exchange_enabled: false,
    faucet_url: `https://faucet.kovan.network/`,
    layer2: true,
    longName: 'Polygon (Matic)',
    name: 'Polygon',
    value: networkTypes.polygon,
  },
};

export default networkInfo;
