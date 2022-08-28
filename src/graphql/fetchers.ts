import { getFetchRequester } from './utils/getFetchRequester';
import { getSdk as getEnsSdk } from './__generated__/ens';

export const ens = getEnsSdk(
  getFetchRequester('https://api.thegraph.com/subgraphs/name/ensdomains/ens')
);
