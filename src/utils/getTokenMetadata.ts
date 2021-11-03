import { toLower } from 'lodash';
import { RainbowToken } from '@rainbow-me/entities';
import { RAINBOW_TOKEN_LIST } from '@rainbow-me/references';

export default function getTokenMetadata(
  tokenAddress: string
): RainbowToken | undefined {
  return RAINBOW_TOKEN_LIST[toLower(tokenAddress)];
}
