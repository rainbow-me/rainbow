import { config } from './config';
import { getFetchRequester } from './utils/getFetchRequester';
import { getSdk as getEnsSdk } from './__generated__/ens';
import { getSdk as getMetadataSdk } from './__generated__/metadata';
import { getSdk as getArcSdk } from './__generated__/arc';


export const ensClient = getEnsSdk(getFetchRequester(config.ens.schema));
export const metadataClient = getMetadataSdk(
  getFetchRequester(config.metadata.schema)
);
export const arcClient = getArcSdk(getFetchRequester(config.arc.schema));
export const arcDevClient = getArcSdk(getFetchRequester(config.arcDev.schema));

