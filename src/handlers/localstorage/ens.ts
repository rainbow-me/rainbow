import { getGlobal, saveGlobal } from './common';

const ensResolveNameKey = (key: string) => `ensResolveName.${key}`;

export const getResolveName = (key: string) =>
  getGlobal(ensResolveNameKey(key), null);

export const saveResolveName = (key: string, value: string) =>
  saveGlobal(ensResolveNameKey(key), value);
