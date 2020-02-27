import networkTypes from './networkTypes';

const networkInfo = {
  [`${networkTypes.mainnet}`]: {
    balance_checker_contract_address: null,
    disabled: false,
    name: 'Mainnet',
    value: networkTypes.mainnet,
  },
  [`${networkTypes.ropsten}`]: {
    balance_checker_contract_address:
      '0xf17adbb5094639142ca1c2add4ce0a0ef146c3f9',
    disabled: false,
    name: 'Ropsten Test Network',
    value: networkTypes.ropsten,
  },
  [`${networkTypes.kovan}`]: {
    balance_checker_contract_address:
      '0xf3352813b612a2d198e437691557069316b84ebe',
    disabled: false,
    name: 'Kovan Test Network',
    value: networkTypes.kovan,
  },
  [`${networkTypes.rinkeby}`]: {
    balance_checker_contract_address:
      '0xc55386617db7b4021d87750daaed485eb3ab0154',
    disabled: false,
    name: 'Rinkeby Test Network',
    value: networkTypes.rinkeby,
  },
  [`${networkTypes.goerli}`]: {
    balance_checker_contract_address:
      '0xf3352813b612a2d198e437691557069316b84ebe',
    disabled: false,
    name: 'Goerli Test Network',
    value: networkTypes.goerli,
  },
};

export default networkInfo;
