import { config } from './config';
import { getFetchRequester } from './utils/getFetchRequester';
import { getSdk as getEnsSdk } from './__generated__/ens';
import { getSdk as getMetadataSdk } from './__generated__/metadata';
import { getSdk as getArcSdk } from './__generated__/arc';
import { getSdk as getArcDevSdk } from './__generated__/arcDev';
import { IS_PROD } from '@/env';

export const ensClient = getEnsSdk(getFetchRequester(config.ens));
export const metadataClient = getMetadataSdk(getFetchRequester(config.metadata));
export const metadataPOSTClient = getMetadataSdk(getFetchRequester(config.metadataPOST));
export const arcClient = IS_PROD ? getArcSdk(getFetchRequester(config.arc)) : getArcDevSdk(getFetchRequester(config.arcDev));
