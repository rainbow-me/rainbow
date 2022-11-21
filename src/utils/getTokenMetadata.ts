import { TokenMetadata } from '@/entities/tokens';
import { rainbowTokenList } from '@/references';

export default function getTokenMetadata(
  tokenAddress: string | undefined
): Omit<TokenMetadata, 'decimals' | 'chainId'> | undefined {
  if (!tokenAddress) return undefined;
  const metadata: TokenMetadata =
    rainbowTokenList.RAINBOW_TOKEN_LIST[tokenAddress.toLowerCase()];

  // delete chain specific metadata
  delete metadata?.decimals;
  delete metadata?.chainId;

  return metadata;
}
