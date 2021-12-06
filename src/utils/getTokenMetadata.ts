import { toLower } from 'lodash';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { RainbowToken } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { rainbowTokenList } from '@rainbow-me/references';

export default function getTokenMetadata(
  tokenAddress: string
): RainbowToken | undefined {
  return rainbowTokenList.RAINBOW_TOKEN_LIST[toLower(tokenAddress)];
}
