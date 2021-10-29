import { toLower } from 'lodash';
import { rainbowTokenList } from '@rainbow-me/references';

export default function checkTokenIsScam(
  name: string,
  symbol: string
): boolean {
  const nameFound = rainbowTokenList.TOKEN_SAFE_LIST[toLower(name)];
  const symbolFound = rainbowTokenList.TOKEN_SAFE_LIST[toLower(symbol)];
  return !!nameFound || !!symbolFound;
}
