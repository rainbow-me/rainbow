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
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'settings' does not exist on type 'Defaul... Remove this comment to see the full error message
  const { network } = useSelector(({ settings: { network } }) => ({
    network,
  }));
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'OutputParametricSelector<{ conta... Remove this comment to see the full error message
  const { contacts, sortedContacts } = useSelector(contactsSelector);

  const onAddOrUpdateContacts = useCallback(
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 5 arguments, but got 0 or more.
    (...data) => dispatch(contactsAddOrUpdate(...data)),
    [dispatch]
  );

  const onRemoveContact = useCallback(data => dispatch(removeContact(data)), [
    dispatch,
  ]);

  const filteredContacts = sortedContacts.filter(contact =>
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    contact.network === network ||
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
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
