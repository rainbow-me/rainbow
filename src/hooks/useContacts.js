import { sortBy, values } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { contactsAddOrUpdate, removeContact } from '../redux/contacts';

export default function useContacts() {
  const { contacts } = useSelector(({ contacts: { contacts } }) => ({
    contacts,
  }));

  const sortedContacts = useMemo(() => {
    return sortBy(values(contacts), 'nickname');
  }, [contacts]);

  return {
    contacts,
    contactsAddOrUpdate,
    removeContact,
    sortedContacts,
  };
}
