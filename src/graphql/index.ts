import gql from 'graphql-tag';

import { config } from './config';
import { getFetchRequester } from './utils/getFetchRequester';
import { getSdk as getEnsSdk } from './__generated__/ens';
import { getSdk as getMetadataSdk } from './__generated__/metadata';
import { getSdk as getArcSdk } from './__generated__/arc';
import { getSdk as getArcDevSdk } from './__generated__/arcDev';
import { IS_PROD } from '@/env';
import { RainbowFetchRequestOpts } from '@/rainbow-fetch';

export const metadataRequester = getFetchRequester(config.metadata);

export const ensClient = getEnsSdk(getFetchRequester(config.ens));
export const metadataClient = getMetadataSdk(metadataRequester);
export const metadataPOSTClient = getMetadataSdk(getFetchRequester(config.metadataPOST));
export const arcClient = IS_PROD ? getArcSdk(getFetchRequester(config.arc)) : getArcDevSdk(getFetchRequester(config.arcDev));

export const requestMetadata = (q: string, options?: Pick<RainbowFetchRequestOpts, 'timeout' | 'headers'>) =>
  metadataRequester(
    gql`
      ${q}
    `,
    options || {}
  );
