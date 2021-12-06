import { toLower } from 'lodash';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { rainbowTokenList } from '@rainbow-me/references';

export default function checkTokenIsScam(
  name: string,
  symbol: string
): boolean {
  const nameFound = rainbowTokenList.TOKEN_SAFE_LIST[toLower(name)];
  const symbolFound = rainbowTokenList.TOKEN_SAFE_LIST[toLower(symbol)];
  return !!nameFound || !!symbolFound;
}
