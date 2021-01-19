import { DefaultTokenLists } from '../../references';
import { getGlobal, saveGlobal } from './common';

const USER_LISTS = 'userLists';

export const getUserLists = network =>
  getGlobal(USER_LISTS, DefaultTokenLists[network], []);

export const saveUserLists = lists => saveGlobal(USER_LISTS, lists);
