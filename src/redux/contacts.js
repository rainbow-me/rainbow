import { omit, toLower } from 'lodash';
import { getContacts, saveContacts } from '../handlers/localstorage/contacts';

// -- Constants --------------------------------------- //
const CONTACTS_UPDATE = 'contacts/CONTACTS_UPDATE';
const CONTACTS_LOAD = 'contacts/CONTACTS_LOAD';
const CONTACTS_CLEAR_STATE = 'contacts/CONTACTS_CLEAR_STATE';

// -- Actions ---------------------------------------- //
export const contactsLoadState = () => async dispatch => {
  try {
    const contacts = await getContacts();
    dispatch({
      payload: contacts,
      type: CONTACTS_LOAD,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const contactsAddOrUpdate = (address, nickname, color, network) => (
  dispatch,
  getState
) => {
  const loweredAddress = toLower(address);
  const { contacts } = getState().contacts;
  const updatedContacts = {
    ...contacts,
    [loweredAddress]: {
      address: loweredAddress,
      color,
      network,
      nickname,
    },
  };
  saveContacts(updatedContacts);
  dispatch({
    payload: updatedContacts,
    type: CONTACTS_UPDATE,
  });
};

export const removeContact = address => (dispatch, getState) => {
  const { contacts } = getState().contacts;
  const updatedContacts = omit(contacts, toLower(address));
  saveContacts(updatedContacts);
  dispatch({
    payload: updatedContacts,
    type: CONTACTS_UPDATE,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  contacts: {},
};

export default (state = INITIAL_STATE, action) => {
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
