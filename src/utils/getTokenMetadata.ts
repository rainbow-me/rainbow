import { toLower } from 'lodash';
import { RainbowToken } from '@rainbow-me/entities';
import { rainbowTokenList } from '@rainbow-me/references';

export default function getTokenMetadata(
  tokenAddress: string
): RainbowToken | undefined {
  return rainbowTokenList.RAINBOW_TOKEN_LIST[toLower(tokenAddress)];
}
