import gql from 'graphql-tag';

import { config } from './config';
import { getFetchRequester } from './utils/getFetchRequester';
import { getSdk as getEnsSdk } from './__generated__/ens';
import { getSdk as getMetadataSdk } from './__generated__/metadata';
import { getSdk as getArcSdk } from './__generated__/arc';
import { getSdk as getArcDevSdk } from './__generated__/arcDev';
import { getSdk as getArcLocalSdk } from './__generated__/arcLocal';
import { IS_PROD } from '@/env';
import { USE_LOCAL_ARC } from 'react-native-dotenv';
import { RainbowFetchRequestOpts } from '@/rainbow-fetch';

export const metadataRequester = getFetchRequester(config.metadata);

export const ensClient = getEnsSdk(getFetchRequester(config.ens));
export const metadataClient = getMetadataSdk(metadataRequester);
export const metadataPOSTClient = getMetadataSdk(getFetchRequester(config.metadataPOST));

const getArcClient = () => {
  if (USE_LOCAL_ARC === 'true') {
    return getArcLocalSdk(getFetchRequester(config.arcLocal));
  }
  return IS_PROD ? getArcSdk(getFetchRequester(config.arc)) : getArcDevSdk(getFetchRequester(config.arcDev));
};

const getArcPOSTClient = () => {
  if (USE_LOCAL_ARC === 'true') {
    return getArcLocalSdk(
      getFetchRequester({
        ...config.arcLocal,
        schema: {
          ...config.arcLocal.schema,
          method: 'POST',
        },
      })
    );
  }
  return IS_PROD
    ? getArcSdk(
        getFetchRequester({
          ...config.arc,
          schema: {
            ...config.arc.schema,
            method: 'POST',
          },
        })
      )
    : getArcDevSdk(
        getFetchRequester({
          ...config.arcDev,
          schema: {
            ...config.arcDev.schema,
            method: 'POST',
          },
        })
      );
};

export const arcClient = getArcClient();
export const arcPOSTClient = getArcPOSTClient();
export const requestMetadata = (q: string, options?: Pick<RainbowFetchRequestOpts, 'timeout' | 'headers'>) =>
  metadataRequester(
    gql`
      ${q}
    `,
    options || {}
  );
