import { TokenMetadata } from '@/entities/tokens';
import { omitFlatten } from '@/helpers/utilities';
import { rainbowTokenList } from '@/references';

export default function getTokenMetadata(tokenAddress: string | undefined): Omit<TokenMetadata, 'decimals' | 'chainId'> | undefined {
  return undefined;
}
