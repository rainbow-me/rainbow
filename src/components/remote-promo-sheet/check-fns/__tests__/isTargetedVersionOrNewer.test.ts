import { isTargetedVersionOrNewer } from '../isTargetedVersionOrNewer';
import * as DeviceInfo from 'react-native-device-info';

jest.mock('react-native-device-info', () => ({
  getVersion: jest.fn(),
}));

describe('isTargetedVersionOrNewer', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return true when current app version is newer than version to check', async () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('2.0.0');
    const result = await isTargetedVersionOrNewer('1.9.0');
    expect(result).toBe(true);
  });

  it('should return false when current app version is older than version to check', async () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.8.0');
    const result = await isTargetedVersionOrNewer('1.9.0');
    expect(result).toBe(false);
  });

  it('should return true when versions are equal', async () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.9.0');
    const result = await isTargetedVersionOrNewer('1.9.0');
    expect(result).toBe(true);
  });

  it('should handle patch versions correctly', async () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.9.1');
    const result = await isTargetedVersionOrNewer('1.9.0');
    expect(result).toBe(true);
  });

  it('should handle versions with different number of parts', async () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('2.0');
    const result = await isTargetedVersionOrNewer('1.9.9');
    expect(result).toBe(true);
  });

  it('should return true when versions are equal but have different number of parts', async () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('2.0.0');
    const result = await isTargetedVersionOrNewer('2.0');
    expect(result).toBe(true);
  });

  it('should return false when current app version is older with different number of parts', async () => {
    (DeviceInfo.getVersion as jest.Mock).mockReturnValue('1.9');
    const result = await isTargetedVersionOrNewer('2.0.0');
    expect(result).toBe(false);
  });
});
