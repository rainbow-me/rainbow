import { config } from './codegen.config';
import { getFetchRequester } from './utils/getFetchRequester';
import { getSdk as getEnsSdk } from './__generated__/ens';
import { getSdk as getMetadataSdk } from './__generated__/metadata';

export const ensClient = getEnsSdk(getFetchRequester(config.ens.schema.url));
export const metadataClient = getMetadataSdk(
  getFetchRequester(config.metadata.schema.url)
);
