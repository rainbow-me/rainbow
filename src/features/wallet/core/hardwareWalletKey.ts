/** Identifies an account on a hardware wallet by device ID and account index. */
export type HardwareKey = `${string}/${number}`;

/** Validates the device ID and account index stored for a hardware wallet. */
export function isHardwareWalletKey(key: string | null): key is HardwareKey {
  if (!key) return false;
  const [deviceId, index, ...remainder] = key.split('/');
  return Boolean(deviceId && index && remainder.length === 0 && /^\d+$/.test(index));
}
