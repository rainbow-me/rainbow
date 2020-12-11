import { toLower } from 'lodash';
import { Types } from 'rainbow-token-list';
import { RAINBOW_TOKEN_LIST } from '@rainbow-me/references';

export default function getTokenMetadata(
  tokenAddress: string
): Types.Token | undefined {
  return RAINBOW_TOKEN_LIST[toLower(tokenAddress)];
}
