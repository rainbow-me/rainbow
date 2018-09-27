import { commonStorage } from 'balance-common';

/**
 * @desc get account local requests
 * @param  {String}   [address]
 * @return {Object}
 */
export const getAccountLocalRequests = async (accountAddress, network) => {
  const accountLocal = await commonStorage.getLocal(accountAddress.toLowerCase());
  return accountLocal && accountLocal[network] ? accountLocal[network].requests : null;
};

/**
 * @desc update local incoming transaction requests
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Void}
 */
export const updateLocalRequests = async (address, network, requests) => {
  if (!address) return;
  let accountLocal = await commonStorage.getAccountLocal(address);
  if (!accountLocal) {
    accountLocal = {};
  }
  if (!accountLocal[network]) {
    accountLocal[network] = {};
  }
  accountLocal[network].requests = { ...requests };
  await commonStorage.saveLocal(address.toLowerCase(), accountLocal);
};

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
