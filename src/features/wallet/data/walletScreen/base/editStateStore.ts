import { createBaseStore, createStoreActions } from '@storesjs/stores';

type EditState = {
  isCoinListEdited: boolean;
  setIsCoinListEdited: (edited: boolean | ((prev: boolean) => boolean)) => void;
};

export const useEditTokensStore = createBaseStore<EditState>((set, get) => ({
  isCoinListEdited: false,

  setIsCoinListEdited: edited => {
    const value = typeof edited === 'function' ? edited(get().isCoinListEdited) : edited;
    set(state => (state.isCoinListEdited === value ? state : { isCoinListEdited: value }));
  },
}));

export const editTokensActions = createStoreActions(useEditTokensStore);
