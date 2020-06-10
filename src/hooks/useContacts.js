import { sortBy, values } from 'lodash';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { contactsAddOrUpdate, removeContact } from '../redux/contacts';

const contactsSelector = createSelector(
  ({ contacts: { contacts } }) => contacts,
  contacts => ({
    contacts,
    sortedContacts: sortBy(values(contacts), 'nickname'),
  })
);

export default function useContacts() {
  const dispatch = useDispatch();
  const { contacts, sortedContacts } = useSelector(contactsSelector);

  const onAddOrUpdateContacts = useCallback(
    (...data) => dispatch(contactsAddOrUpdate(...data)),
    [dispatch]
  );

  const onRemoveContact = useCallback(data => dispatch(removeContact(data)), [
    dispatch,
  ]);

  return {
    contacts,
    onAddOrUpdateContacts,
    onRemoveContact,
    sortedContacts,
  };
}
