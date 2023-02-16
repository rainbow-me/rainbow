import { atom } from 'recoil';

export const addressCopiedToastAtom = atom({
  default: false,
  key: 'addressCopiedToast',
});
