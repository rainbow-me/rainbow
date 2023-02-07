import { TokenMetadata } from '@/entities/tokens';
import { omitFlatten } from '@/helpers/utilities';
import { rainbowTokenList } from '@/references';

export default function getTokenMetadata(
  tokenAddress: string | undefined
): Omit<TokenMetadata, 'decimals' | 'chainId'> | undefined {
  if (!tokenAddress) return undefined;
  const metadata: TokenMetadata =
    rainbowTokenList.RAINBOW_TOKEN_LIST[tokenAddress.toLowerCase()];

  // delete chain  metadata
  return omitFlatten(metadata, ['chainId', 'decimals']);
}
