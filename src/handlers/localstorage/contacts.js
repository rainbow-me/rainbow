import { find, orderBy, toLower } from 'lodash';
import {
  removeFirstEmojiFromString,
  makeSpaceAfterFirstEmoji,
} from '../../helpers/emojiHandler';
import { getGlobal, saveGlobal } from './common';

const LOCAL_CONTACTS = 'localContacts';

/**
 * @desc get local contacts
 * @return {Table}
 */
export const getLocalContacts = () => getGlobal(LOCAL_CONTACTS, []);

/**
 * @desc get local contacts
 * @return {Number}
 */
export const getNumberOfLocalContacts = async () => {
  const contacts = await getLocalContacts();
  return contacts.length;
};

/**
 * @desc get local contacts
 * @param  {String}   [address]
 * @return {Object}
 */
export const getSelectedLocalContact = async address => {
  const contacts = await getLocalContacts();
  const localContact = find(contacts, contact => contact.address === address);
  return localContact || false;
};

/**
 * @desc add new contact to the local contacts
 * @param  {String}   [address]
 * @param  {String}   [nickname]
 * @param  {Number}   [color]
 * @return {Void}
 */
export const addNewLocalContact = async (address, nickname, color) => {
  let contacts = await getLocalContacts();
  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i].address === address) {
      contacts.splice(i, 1);
      i--;
    }
  }

  contacts.push({
    address,
    color,
    nickname: makeSpaceAfterFirstEmoji(nickname),
  });

  const sortedContacts = orderBy(
    contacts,
    [
      contact => {
        let newContact = toLower(contact.nickname);
        newContact = removeFirstEmojiFromString(newContact);
        return newContact;
      },
    ],
    ['desc']
  );
  await saveGlobal(LOCAL_CONTACTS, sortedContacts);
};

/**
 * @desc delete contact from the local contacts
 * @param  {String}   [address]
 * @return {Void}
 */
export const deleteLocalContact = async address => {
  const contacts = await getLocalContacts();
  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i].address === address) {
      contacts.splice(i, 1);
      i--;
    }
  }
  await saveGlobal(LOCAL_CONTACTS, contacts);
};
