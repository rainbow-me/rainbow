import { DataType } from '../../hooks/useENSProfile';
import { getGlobal, saveGlobal } from './common';

const ensProfileVersion = '0.2.0';

const ensLabelhashesKey = (key: string) => `ensLabelhashes.${key}`;
const ensProfileKey = (dataType: DataType, key: string) =>
  `ensProfile.${dataType}.${key}`;
const ensDomains = (key: string) => `ensDomains.${key}`;
const ensSeenOnchainDataDisclaimerKey = 'ensProfile.seenOnchainDisclaimer';

export const getNameFromLabelhash = async (key: string) => {
  const labelhash = await getGlobal(
    ensLabelhashesKey(key),
    null,
    ensProfileVersion
  );
  return labelhash;
};

export const saveNameFromLabelhash = (key: string, value: Object) =>
  saveGlobal(ensLabelhashesKey(key), value, ensProfileVersion);

export const getProfile = async (dataType: DataType, key: string) => {
  const profile = await getGlobal(
    ensProfileKey(dataType, key),
    null,
    ensProfileVersion
  );
  return profile ? JSON.parse(profile) : null;
};

export const saveProfile = (dataType: DataType, key: string, value: Object) =>
  saveGlobal(
    ensProfileKey(dataType, key),
    JSON.stringify(value),
    ensProfileVersion
  );

export const getSeenOnchainDataDisclaimer = () =>
  getGlobal(ensSeenOnchainDataDisclaimerKey, false);

export const saveSeenOnchainDataDisclaimer = (value: boolean) =>
  saveGlobal(ensSeenOnchainDataDisclaimerKey, value);

export const getENSDomains = (key: string) => getGlobal(ensDomains(key), []);

export const setENSDomains = (
  key: string,
  value: {
    name: string;
    owner: { id: string };
    images: { avatarUrl?: string | null; coverUrl?: string | null };
  }[]
) => saveGlobal(ensDomains(key), value);
