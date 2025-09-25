import { CONCENTRATED_LIQUIDITY_PROTOCOLS } from '../constants';

/**
 * Determine if a protocol supports concentrated liquidity
 */
export function isConcentratedLiquidity(protocolName: string, protocolVersion?: string): boolean {
  // Check if protocol is in concentrated liquidity list
  const normalizedName = protocolName.toLowerCase();

  // Direct match
  if (CONCENTRATED_LIQUIDITY_PROTOCOLS.includes(normalizedName)) {
    return true;
  }

  // Check with version suffix
  const withVersion = protocolVersion ? `${normalizedName}-${protocolVersion.toLowerCase()}` : normalizedName; // Default to name without version

  if (CONCENTRATED_LIQUIDITY_PROTOCOLS.includes(withVersion)) {
    return true;
  }

  // Check if it's a V3 protocol (common pattern for concentrated liquidity)
  if (protocolVersion?.toLowerCase() === 'v3') {
    const v3Protocols = ['uniswap', 'pancakeswap', 'sushiswap'];
    return v3Protocols.includes(normalizedName);
  }

  return false;
}
