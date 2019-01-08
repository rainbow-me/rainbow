import { differenceInMinutes } from 'date-fns';
import { pickBy } from 'lodash';
import { commonStorage } from 'balance-common';

/**
 * @desc get show shitcoins setting
 * @return {True|False}
 */
export const getShowShitcoinsSetting = async () => {
  const showShitcoins = await commonStorage.getLocal('showShitcoins');
  return showShitcoins ? showShitcoins.data : null;
};

/**
 * @desc update show shitcoins setting
 * @param  {Boolean}   [updatedSetting]
 * @return {Void}
 */
export const updateShowShitcoinsSetting = async (updatedSetting) => {
  await commonStorage.saveLocal('showShitcoins', { data: updatedSetting });
};

/**
 * @desc get last tracking date
 * @return {Date|Object}
 */
export const getLastTrackingDate = async () => {
  const lastTrackingDate = await commonStorage.getLocal('lastTrackingDate');
  return lastTrackingDate && lastTrackingDate.data ? new Date(lastTrackingDate.data) : null;
};

/**
 * @desc update last tracking date
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Void}
 */
export const updateLastTrackingDate = async () => {
  await commonStorage.saveLocal('lastTrackingDate', { data: new Date().toString() });
};

const getRequestsKey = (accountAddress, network) => {
  return `requests-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;
};

/**
 * @desc get account local requests
 * @param  {String}   [address]
 * @return {Object}
 */
export const getLocalRequests = async (accountAddress, network) => {
  const requestsData = await commonStorage.getLocal(getRequestsKey(accountAddress, network));
  const requests = requestsData ? requestsData.data : {};
  const openRequests = pickBy(requests, (request) => (differenceInMinutes(Date.now(), request.transactionDisplayDetails.timestampInMs) < 60));
  await saveLocalRequests(accountAddress, network, openRequests);
  return openRequests;
};

/**
 * @desc save local incoming requests
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Void}
 */
export const saveLocalRequests = async (address, network, requests) => {
  await commonStorage.saveLocal(
    getRequestsKey(accountAddress, network),
    { data: requests }
  );
};

/**
 * @desc remove request
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @param  {String}   [callId]
 * @return {Void}
 */
export const removeLocalRequest = async (address, network, callId) => {
  const requests = getLocalRequests(address, network);
  let updatedRequests = { ...requests };
  delete updatedRequests[callId];
  saveLocalRequests(address, network, updatedRequests);
  await commonStorage.saveLocal(address.toLowerCase(), accountLocal);
};
