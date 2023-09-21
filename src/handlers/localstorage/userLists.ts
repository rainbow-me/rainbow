import { getGlobal, saveGlobal } from './common';

const USER_LISTS = 'userLists';
const USER_LISTS_SELECTED_LIST = 'userListsSelectedList';

export const getFavorites = () => [
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
  '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  '0xc00e94cb662c3520282e6f5717214004a7f26888',
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
  '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd',
  '0x408e41876cccdc0f92210600ef50372656052a38',
  '0xba100000625a3754423978a60c9317c58a424e3d',
  '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
];

export const saveFavorites = () => {};

export const getUserLists = () => getGlobal(USER_LISTS, null);

export const saveUserLists = (lists: any) => saveGlobal(USER_LISTS, lists);

export const getSelectedUserList = () =>
  getGlobal(USER_LISTS_SELECTED_LIST, null);

export const saveSelectedUserList = (listId: any) =>
  saveGlobal(USER_LISTS_SELECTED_LIST, listId);
