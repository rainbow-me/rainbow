import { getGlobal, saveGlobal } from './common';

const LOCAL_CONTACTS = 'localContacts';

const contactsVersion = '0.2.1';

/**
 * @desc get contacts
 * @return {Object}
 */
export const getContacts = () => getGlobal(LOCAL_CONTACTS, [], contactsVersion);

/**
 * @desc save contacts
 */
export const saveContacts = (contacts: any) => saveGlobal(LOCAL_CONTACTS, contacts, contactsVersion);
