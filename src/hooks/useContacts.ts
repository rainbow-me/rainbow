import { sortBy, values } from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import networkTypes from '../helpers/networkTypes';
import { contactsAddOrUpdate, removeContact } from '../redux/contacts';
import { AppState } from '@/redux/store';

const contactsSelector = createSelector(
  ({ contacts: { contacts } }: AppState) => contacts,
  contacts => ({
    contacts,
    sortedContacts: sortBy(values(contacts), 'nickname'),
  })
);

export default function useContacts() {
  const dispatch = useDispatch();
  const { network } = useSelector(({ settings: { network } }: AppState) => ({
    network,
  }));
  const { contacts, sortedContacts } = useSelector(contactsSelector);

  const onAddOrUpdateContacts = useCallback(
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 5 arguments, but got 0 or more.
    (...data) => dispatch(contactsAddOrUpdate(...data)),
    [dispatch]
  );

  const onRemoveContact = useCallback((data: string) => dispatch(removeContact(data)), [dispatch]);

  const filteredContacts = sortedContacts.filter(contact =>
    contact.network === network || (!contact.network && network === networkTypes.mainnet) ? contact : false
  );

  return {
    contacts,
    filteredContacts,
    onAddOrUpdateContacts,
    onRemoveContact,
    sortedContacts,
  };
}
