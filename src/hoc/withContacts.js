import { sortBy, values } from 'lodash';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import { contactsAddOrUpdate, removeContact } from '../redux/contacts';
import { connect } from '@rainbow-me/react-redux';

const contactsSelector = state => state.contacts;

const withSortedContacts = contacts => ({
  sortedContacts: sortBy(values(contacts), 'nickname'),
});

const withSortedContactsSelector = createSelector(
  [contactsSelector],
  withSortedContacts
);

const mapStateToProps = ({ contacts: { contacts } }) => ({
  contacts,
});

export default Component =>
  compose(
    connect(mapStateToProps, {
      contactsAddOrUpdate,
      removeContact,
    }),
    withProps(withSortedContactsSelector)
  )(Component);
