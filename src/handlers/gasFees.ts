import { gretch } from 'gretchen';
import { Network } from '@/helpers';

export const rainbowMeteorologyGetData = (network: Network) =>
  gretch(`https://metadata.p.rainbow.me/meteorology/v1/gas/${network}`, {
    timeout: 30_000,
  }).json();
