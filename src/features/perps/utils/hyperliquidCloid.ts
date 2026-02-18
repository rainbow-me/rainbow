import { type Hex, isHex } from 'viem';

const CLOID_HEX_LENGTH = 34;
const MARKER_HEX = '7262'; // "rb" (rainbow) marker
const MARKER_HEX_LENGTH = MARKER_HEX.length;
const LEVERAGE_HEX_LENGTH = 4;
const RANDOM_HEX_LENGTH = 24;
const MIN_LEVERAGE_BPS = 100;
const MAX_LEVERAGE_BPS = 0xffff;

export function generateCloid(leverage: number): Hex {
  const leverageBps = toLeverageBps(leverage);
  const leverageHex = leverageBps.toString(16).padStart(LEVERAGE_HEX_LENGTH, '0');
  const randomHex = createRandomHex(RANDOM_HEX_LENGTH);

  return `0x${MARKER_HEX}${leverageHex}${randomHex}` as Hex;
}

export function decodeLeverageFromCloid(cloid?: string | null): number | null {
  if (!cloid || !isValidCloidHex(cloid)) return null;
  if (cloid.slice(2, 2 + MARKER_HEX_LENGTH).toLowerCase() !== MARKER_HEX) return null;

  const leverageHexStart = 2 + MARKER_HEX_LENGTH;
  const leverageHexEnd = leverageHexStart + LEVERAGE_HEX_LENGTH;
  const leverageBps = Number.parseInt(cloid.slice(leverageHexStart, leverageHexEnd), 16);
  if (!Number.isFinite(leverageBps) || leverageBps < MIN_LEVERAGE_BPS || leverageBps > MAX_LEVERAGE_BPS) return null;

  return leverageBps / 100;
}

function toLeverageBps(leverage: number): number {
  if (!Number.isFinite(leverage)) return MIN_LEVERAGE_BPS;
  const leverageBps = Math.round(leverage * 100);
  return Math.max(MIN_LEVERAGE_BPS, Math.min(MAX_LEVERAGE_BPS, leverageBps));
}

function createRandomHex(hexLength: number): string {
  const bytes = new Uint8Array(hexLength / 2);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function isValidCloidHex(cloid: string): boolean {
  return cloid.length === CLOID_HEX_LENGTH && isHex(cloid);
}
