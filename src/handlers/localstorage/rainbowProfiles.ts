import { getGlobal, saveGlobal } from './common';
import { EthereumAddress } from '@rainbow-me/entities';

const rainbowProfileKey = (key: EthereumAddress) => `rainbowProfile.${key}`;

const rainbowProfilesVersion = '0.1.0';

export const getRainbowProfile = async (key: EthereumAddress) =>
  await getGlobal(rainbowProfileKey(key), null, rainbowProfilesVersion);

export const saveRainbowProfile = (
  key: EthereumAddress,
  value: { color: string | null; emoji: string | null }
) => saveGlobal(rainbowProfileKey(key), value, rainbowProfilesVersion);
