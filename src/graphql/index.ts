import { config } from './config';
import { getFetchRequester } from './utils/getFetchRequester';
import { getSdk as getEnsSdk } from './__generated__/ens';
import { getSdk as getMetadataSdk } from './__generated__/metadata';
import { getSdk as getUniswapSdk } from './__generated__/uniswap';

export const ensClient = getEnsSdk(getFetchRequester(config.ens.schema.url));
export const metadataClient = getMetadataSdk(
  getFetchRequester(config.metadata.schema.url)
);
export const uniswapClient = getUniswapSdk(
  getFetchRequester(config.metadata.schema.url)
);
