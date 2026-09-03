import { isHardwareWalletKey } from '@/features/wallet/core/hardwareWalletKey';

describe('isHardwareWalletKey', () => {
  it('accepts one device ID and numeric account index', () => {
    expect(isHardwareWalletKey('device-id/12')).toBe(true);
  });

  it.each([null, 'device-id/', '/12', 'device-id/account', 'device-id/12/extra'])('rejects malformed hardware key %p', key => {
    expect(isHardwareWalletKey(key)).toBe(false);
  });
});
