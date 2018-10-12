import { differenceInMinutes } from 'date-fns';
import { pickBy } from 'lodash';
import { commonStorage } from 'balance-common';

/**
 * @desc get account local requests
 * @param  {String}   [address]
 * @return {Object}
 */
/**
export const getAccountLocalRequests = async (accountAddress, network) => {
  const accountLocal = await commonStorage.getAccountLocal(accountAddress);
  console.log('get account local', accountLocal);
  const requests = accountLocal && accountLocal[network] ? accountLocal[network].requests : {};
  const openRequests = pickBy(requests, (request) => (differenceInMinutes(Date.now(), request.transactionPayload.timestamp) < 60));
  console.log('openRequests', openRequests);
  await commonStorage.updateLocalRequests(accountAddress, network, openRequests);
  return openRequests;
};
 */

/**
 * @desc update local incoming transaction requests
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Void}
 */
/**
export const updateLocalRequests = async (address, network, requests) => {
  console.log('local requests requests', requests);
  if (!address) return;
  let accountLocal = await commonStorage.getAccountLocal(address);
  if (!accountLocal) {
    accountLocal = {};
  }
  if (!accountLocal[network]) {
    accountLocal[network] = {};
  }
  accountLocal[network].requests = { ...requests };
  console.log('updating local requests', accountLocal);
  await commonStorage.saveLocal(address.toLowerCase(), accountLocal);
  // TODO
  const accountLocalAgain = await commonStorage.getAccountLocal(address);
  console.log('get account local again after saving', accountLocalAgain);
};
*/

/**
 * @desc remove transaction request
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @param  {String}   [transactionId]
 * @return {Void}
 */
export const removeLocalRequest = async (address, network, transactionId) => {
  if (!address) return;
  let accountLocal = await commonStorage.getAccountLocal(address);
  if (!accountLocal) {
    accountLocal = {};
  }
  if (!accountLocal[network]) {
    accountLocal[network] = {};
  }
  if (!accountLocal[network].requests) {
    accountLocal[network].requests = {};
  }
  let updatedRequests = accountLocal[network].requests;
  delete updatedRequests[transactionId];
  accountLocal[network].requests = { ...updatedRequests };
  await commonStorage.saveLocal(address.toLowerCase(), accountLocal);
};
