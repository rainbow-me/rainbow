import { rainbowTokenList } from '@/references';

export default function checkTokenIsScam(name: string, symbol: string): boolean {
  const nameFound = rainbowTokenList.TOKEN_SAFE_LIST[name?.toLowerCase()];
  const symbolFound = rainbowTokenList.TOKEN_SAFE_LIST[symbol?.toLowerCase()];
  return !!nameFound || !!symbolFound;
}
