import { Dispatch } from 'redux';
import { getContacts, saveContacts } from '@/handlers/localstorage/contacts';
import { Network } from '@/helpers/networkTypes';
import { omitFlatten } from '@/helpers/utilities';
import { AppGetState } from '@/redux/store';
import { handleReviewPromptAction } from '@/utils/reviewAlert';
import { ReviewPromptAction } from '@/storage/schema';

// -- Constants --------------------------------------- //
const CONTACTS_UPDATE = 'contacts/CONTACTS_UPDATE';
const CONTACTS_LOAD = 'contacts/CONTACTS_LOAD';
const CONTACTS_CLEAR_STATE = 'contacts/CONTACTS_CLEAR_STATE';

// -- Types ------------------------------------------ //

/**
 * A contact's information.
 */
export interface Contact {
  /**
   * The contact's address.
   */
  address: string;

  /**
   * A color index, based on the values in `avatars` in
   * `src/utils/profileUtils.ts`.
   */
  color: number;

  /**
   * The address's primary ens name
   */
  ens: string;

  /**
   * The network.
   */
  network: Network;

  /**
   * The contact's nickname.
   */
  nickname: string;
}

/**
 * The `contacts` reducer's state.
 */
interface ContactsState {
  contacts: {
    [address: string]: Contact;
  };
}

/**
 * An action for the `contacts` reducer.
 */
type ContactsAction = ContactsUpdateAction | ContactsLoadAction | ContactsClearStateAction;

interface ContactsUpdateAction {
  type: typeof CONTACTS_UPDATE;
  payload: ContactsState['contacts'];
}

interface ContactsLoadAction {
  type: typeof CONTACTS_LOAD;
  payload: ContactsState['contacts'];
}

interface ContactsClearStateAction {
  type: typeof CONTACTS_CLEAR_STATE;
}

// -- Actions ---------------------------------------- //
export const contactsLoadState = () => async (dispatch: Dispatch<ContactsLoadAction>) => {
  try {
    const contacts = (await getContacts()) as ContactsState['contacts'];
    dispatch({
      payload: contacts,
      type: CONTACTS_LOAD,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const contactsAddOrUpdate =
  (address: string, nickname: string, color: number, network: Network, ens: string) =>
  (dispatch: Dispatch<ContactsUpdateAction>, getState: AppGetState) => {
    const loweredAddress = address.toLowerCase();
    const { contacts } = getState().contacts;
    const updatedContacts = {
      ...contacts,
      [loweredAddress]: {
        address: loweredAddress,
        color,
        ens,
        network,
        nickname,
      },
    };
    saveContacts(updatedContacts);

    setTimeout(() => {
      handleReviewPromptAction(ReviewPromptAction.AddingContact);
    }, 500);
    dispatch({
      payload: updatedContacts,
      type: CONTACTS_UPDATE,
    });
  };

export const removeContact = (address: string) => (dispatch: Dispatch<ContactsUpdateAction>, getState: AppGetState) => {
  const { contacts } = getState().contacts;
  const updatedContacts = omitFlatten(contacts, address.toLowerCase());
  saveContacts(updatedContacts);
  dispatch({
    payload: updatedContacts,
    type: CONTACTS_UPDATE,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: ContactsState = {
  contacts: {},
};

export default (state = INITIAL_STATE, action: ContactsAction) => {
  switch (action.type) {
    case CONTACTS_UPDATE:
      return { ...state, contacts: action.payload };
    case CONTACTS_LOAD:
      return {
        ...state,
        contacts: action.payload,
      };
    case CONTACTS_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
