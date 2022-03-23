import { getGlobal, saveGlobal } from './common';

const ensProfileVersion = '0.1.0';

const ensProfileKey = (key: string) => `ensProfile.${key}`;
const ensResolveNameKey = (key: string) => `ensResolveName.${key}`;

export const getProfile = async (key: string) => {
  const profile = await getGlobal(ensProfileKey(key), null, ensProfileVersion);
  return profile ? JSON.parse(profile) : null;
};

export const saveProfile = (key: string, value: Object) =>
  saveGlobal(ensProfileKey(key), JSON.stringify(value), ensProfileVersion);

export const getResolveName = (key: string) =>
  getGlobal(ensResolveNameKey(key), null);

export const saveResolveName = (key: string, value: string) =>
  saveGlobal(ensResolveNameKey(key), value);
