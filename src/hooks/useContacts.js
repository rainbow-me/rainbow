import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import networkTypes from '../helpers/networkTypes';
import { contactsAddOrUpdate, removeContact } from '../redux/contacts';
import { sortByKeyHelper } from '@rainbow-me/helpers/utilities';

const contactsSelector = createSelector(
  ({ contacts: { contacts } }) => contacts,
  contacts => ({
    contacts,
    sortedContacts: Object.values(contacts).sort(sortByKeyHelper('nickname')),
  })
);

export default function useContacts() {
  const dispatch = useDispatch();
  const { network } = useSelector(({ settings: { network } }) => ({
    network,
  }));
  const { contacts, sortedContacts } = useSelector(contactsSelector);

  const onAddOrUpdateContacts = useCallback(
    (...data) => dispatch(contactsAddOrUpdate(...data)),
    [dispatch]
  );

  const onRemoveContact = useCallback(data => dispatch(removeContact(data)), [
    dispatch,
  ]);

  const filteredContacts = sortedContacts.filter(contact =>
    contact.network === network ||
    (!contact.network && network === networkTypes.mainnet)
      ? contact
      : false
  );

  return {
    contacts,
    filteredContacts,
    onAddOrUpdateContacts,
    onRemoveContact,
    sortedContacts,
  };
}
