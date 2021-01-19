import { toLower } from 'lodash';
import { TOKEN_SAFE_LIST } from '@rainbow-me/references';

export default function checkTokenIsScam(
  name: string,
  symbol: string
): boolean {
  const nameFound = TOKEN_SAFE_LIST[toLower(name)];
  const symbolFound = TOKEN_SAFE_LIST[toLower(symbol)];
  return !!nameFound || !!symbolFound;
}
