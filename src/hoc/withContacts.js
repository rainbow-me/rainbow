import { sortBy, values } from 'lodash';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import { contactsAddOrUpdate, removeContact } from '../redux/contacts';

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
