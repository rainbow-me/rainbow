import { getGlobal, saveGlobal } from './common';

const ensProfileVersion = '0.1.0';

const ensProfileKey = (key: string) => `ensProfile.${key}`;
const ensProfileImagesKey = (key: string) => `ensProfileImages.${key}`;
const ensProfileRecordsKey = (key: string) => `ensProfileRecords.${key}`;
const ensResolveNameKey = (key: string) => `ensResolveName.${key}`;
const ensDomains = (key: string) => `ensDomains.${key}`;
const ensSeenOnchainDataDisclaimerKey = 'ensProfile.seenOnchainDisclaimer';

export const getProfile = async (key: string) => {
  const profile = await getGlobal(ensProfileKey(key), null, ensProfileVersion);
  return profile ? JSON.parse(profile) : null;
};

export const saveProfile = (key: string, value: Object) =>
  saveGlobal(ensProfileKey(key), JSON.stringify(value), ensProfileVersion);

export const getProfileImages = async (key: string) => {
  const images = await getGlobal(
    ensProfileImagesKey(key),
    null,
    ensProfileVersion
  );
  return images ? JSON.parse(images) : null;
};

export const saveProfileImages = (key: string, value: Object) =>
  saveGlobal(
    ensProfileImagesKey(key),
    JSON.stringify(value),
    ensProfileVersion
  );

export const getProfileRecords = async (key: string) => {
  const records = await getGlobal(
    ensProfileRecordsKey(key),
    null,
    ensProfileVersion
  );
  return records ? JSON.parse(records) : null;
};

export const saveProfileRecords = (key: string, value: Object) =>
  saveGlobal(
    ensProfileRecordsKey(key),
    JSON.stringify(value),
    ensProfileVersion
  );

export const getResolveName = (key: string) =>
  getGlobal(ensResolveNameKey(key), null);

export const saveResolveName = (key: string, value: string) =>
  saveGlobal(ensResolveNameKey(key), value);

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
