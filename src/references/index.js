import { ChainId, Token, WETH } from '@uniswap/sdk2';
import { mapKeys, mapValues, toLower } from 'lodash';
import savingAssets from './compound/saving-assets.json';
import tokenOverridesData from './token-overrides.json';
import uniswapPairsData from './uniswap/uniswap-pairs.json';

export { default as chains } from './chains.json';
export { default as compoundCERC20ABI } from './compound/compound-cerc20-abi.json';
export { default as compoundCETHABI } from './compound/compound-ceth-abi.json';
export { default as erc20ABI } from './erc20-abi.json';
export { default as ethUnits } from './ethereum-units.json';
export { default as exchangeABI } from './uniswap/uniswap-exchange-abi.json';
export { default as uniswapTestnetAssets } from './uniswap/uniswap-pairs-testnet.json';

export const CDAI_CONTRACT = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643';
export const SAI_ADDRESS = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';
export const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
export const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const SOCKS_ADDRESS = '0x23B608675a2B2fB1890d3ABBd85c5775c51691d5';

export const UNISWAP_V2_BASES = {
  [ChainId.MAINNET]: [
    WETH[ChainId.MAINNET],
    new Token(ChainId.MAINNET, DAI_ADDRESS, 18, 'DAI', 'Dai Stablecoin'),
    new Token(ChainId.MAINNET, USDC_ADDRESS, 6, 'USDC', 'USD//C'),
  ],
  [ChainId.ROPSTEN]: [WETH[ChainId.ROPSTEN]],
  [ChainId.RINKEBY]: [WETH[ChainId.RINKEBY]],
  [ChainId.GÖRLI]: [WETH[ChainId.GÖRLI]],
  [ChainId.KOVAN]: [WETH[ChainId.KOVAN]],
};

export const TRANSFER_EVENT_TOPIC_LENGTH = 3;

export const TRANSFER_EVENT_KECCAK =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const AddCashCurrencies = {
  kovan: {
    DAI: '0xc4375b7de8af5a38a93548eb8453a498222c4ff2',
    ETH: 'eth',
  },
  mainnet: {
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
    ETH: 'eth',
  },
};

export const AddCashCurrencyInfo = {
  kovan: {
    '0xc4375b7de8af5a38a93548eb8453a498222c4ff2': {
      decimals: 18,
      name: 'Dai',
      symbol: 'DAI',
    },
    'eth': {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
  },
  mainnet: {
    '0x6b175474e89094c44da98b954eedeac495271d0f': {
      decimals: 18,
      name: 'Dai',
      symbol: 'DAI',
    },
    'eth': {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
  },
};

export const DefaultUniswapFavorites = {
  mainnet: ['eth', DAI_ADDRESS, SOCKS_ADDRESS],
  rinkeby: [
    // Ethereum
    'eth',
    // DAI
    '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea',
  ],
};

export const tokenOverrides = mapKeys(tokenOverridesData, (_, address) =>
  toLower(address)
);

const loweredUniswapPairs = mapKeys(uniswapPairsData, (value, key) =>
  toLower(key)
);

export const uniswapPairs = mapValues(loweredUniswapPairs, (value, key) => ({
  ...value,
  ...tokenOverrides[key],
}));

export const savingsAssetsList = savingAssets;

export const savingsAssetsListByUnderlying = mapValues(
  savingAssets,
  assetsByNetwork =>
    mapKeys(
      mapValues(assetsByNetwork, (assetByContract, contractAddress) => ({
        ...assetByContract,
        contractAddress,
      })),
      value => value.address
    )
);
