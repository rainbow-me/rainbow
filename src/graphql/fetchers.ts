import { schemas } from './schemas';
import { getFetchRequester } from './utils/getFetchRequester';
import { getSdk as getEnsSdk } from './__generated__/ens';

export const ensFetcher = getEnsSdk(getFetchRequester(schemas.ens.url));
