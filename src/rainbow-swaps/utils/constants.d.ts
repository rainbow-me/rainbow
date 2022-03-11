import { EthereumAddress } from '../types';
export declare const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export declare const API_BASE_URL = "https://swap-aggregator.api.p.rainbow.me";
export declare const RAINBOW_ROUTER_CONTRACT_ADDRESS = "0x00000000009726632680fb29d3f7a9734e3010e2";
export declare type MultiChainAsset = {
    [key: string]: EthereumAddress;
};
export declare const WETH: MultiChainAsset;
export declare const DAI: MultiChainAsset;
export declare const USDC_ADDRESS = "0x111111111117dc0aa78b770fa6a738034120c302";
export declare const TORN_ADDRESS = "0x77777feddddffc19ff86db637967013e6c6a116c";
export declare const WNXM_ADDRESS = "0x0d438f3b5175bebc262bf23753c1e53d03432bde";
export declare const VSP_ADDRESS = "0x1b40183efb4dd766f11bda7a7c3ad8982e998421";
export declare const MAX_INT: string;
export declare const PERMIT_EXPIRATION_TS = 3600;
export declare type PermitSupportedTokenList = {
    [key: string]: boolean;
};
export declare const ALLOWS_PERMIT: PermitSupportedTokenList;
