import { Network } from '@/networks/types';

// /---- 🗑️ TODO: Delete these dummy values 🗑️ ----/ //
//
// 1. Colors
export const DAI_COLOR = '#F0B340';
export const SOCKS_COLOR = '#E15EE5';
export const USDC_COLOR = '#2775CA';

// 2. Addresses
export const ETH_ADDRESS = 'eth';
export const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
export const SOCKS_ADDRESS = '0x23B608675a2B2fB1890d3ABBd85c5775c51691d5';
export const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

// 3. Input Config
export const INPUT_SYMBOL = 'ETH';
export const INPUT_ADDRESS = ETH_ADDRESS;
// export const INPUT_COLOR = ETH_COLOR_DARK;
export const INPUT_NETWORK = Network.base;
export const INPUT_ASSET_BALANCE = 12.4;
// export const INPUT_ASSET_BALANCE = 12.42512485;
export const INPUT_ASSET_USD_PRICE = 2632.4;
export const IS_INPUT_STABLECOIN = false;

// 4. Output Config
// export const OUTPUT_SYMBOL = 'USDC';
// export const OUTPUT_ADDRESS = USDC_ADDRESS;
// export const OUTPUT_COLOR = USDC_COLOR;
// export const OUTPUT_NETWORK = Network.base;
// export const OUTPUT_ASSET_USD_PRICE = 0.999;
// export const IS_OUTPUT_STABLECOIN = true;
export const OUTPUT_SYMBOL = 'SOCKS';
export const OUTPUT_ADDRESS = SOCKS_ADDRESS;
export const OUTPUT_COLOR = SOCKS_COLOR;
export const OUTPUT_NETWORK = Network.base;
export const OUTPUT_ASSET_USD_PRICE = 41963.7;
export const IS_OUTPUT_STABLECOIN = false;

// 5. Swap Config
export const SWAP_FEE = 0.0085;
//
// /---- END dummy values ----/ //
