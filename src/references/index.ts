import { mapKeys, mapValues, toLower } from 'lodash';
import savingAssets from './compound/saving-assets.json';
import tokenOverridesData from './token-overrides.json';
import { Asset } from '@rainbow-me/entities';

export { default as chains } from './chains.json';
export { default as compoundCERC20ABI } from './compound/compound-cerc20-abi.json';
export { default as compoundCETHABI } from './compound/compound-ceth-abi.json';
export { default as emojis } from './emojis.json';
export { default as erc20ABI } from './erc20-abi.json';
export { default as ethUnits } from './ethereum-units.json';
export { default as shitcoins } from './shitcoins.json';

interface OverrideInfo {
  color?: string;
  name?: string;
  shadowColor?: string;
  symbol?: string;
}

export const CDAI_CONTRACT = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643';
export const SAI_ADDRESS = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';
export const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
export const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const SOCKS_ADDRESS = '0x23B608675a2B2fB1890d3ABBd85c5775c51691d5';

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
  mainnet: ['eth', DAI_ADDRESS],
  rinkeby: [
    // Ethereum
    'eth',
    // DAI
    '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea',
  ],
};

export const tokenOverrides: Record<
  string,
  OverrideInfo
> = mapKeys(tokenOverridesData, (_, address) => toLower(address));

export const savingsAssetsList = savingAssets;

export const savingsAssetsListByUnderlying = mapValues(
  savingAssets,
  (assetsByNetwork: Record<string, Asset>) =>
    mapKeys(
      mapValues(assetsByNetwork, (assetByContract, contractAddress) => ({
        ...assetByContract,
        contractAddress,
      })),
      value => value.address
    )
);
