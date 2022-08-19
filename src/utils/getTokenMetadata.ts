import { RainbowToken } from '@/entities';
import { rainbowTokenList } from '@rainbow-me/references';

export default function getTokenMetadata(
  tokenAddress: string | undefined
): RainbowToken | undefined {
  if (!tokenAddress) return undefined;
  return rainbowTokenList.RAINBOW_TOKEN_LIST[tokenAddress.toLowerCase()];
}
