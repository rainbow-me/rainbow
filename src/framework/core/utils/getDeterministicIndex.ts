import { isHex, keccak256, stringToHex } from 'viem';

export function getDeterministicIndex({ seed, length }: { seed: string; length: number }): number {
  if (!seed || length <= 0) return 0;

  const normalizedSeed = seed.trim().toLowerCase();
  const sourceHex = isHex(normalizedSeed) ? normalizedSeed : keccak256(stringToHex(normalizedSeed));
  const tailHex = sourceHex.replace('0x', '').slice(-8);
  const hashNumber = Number.parseInt(tailHex, 16);

  return Number.isNaN(hashNumber) ? 0 : hashNumber % length;
}
