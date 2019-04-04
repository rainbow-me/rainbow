import { differenceInMinutes } from 'date-fns';
import { pickBy } from 'lodash';
import { commonStorage } from '@rainbow-me/rainbow-common';

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

const getRequestsKey = (accountAddress, network) => `requests-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;

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
export const saveLocalRequests = async (accountAddress, network, requests) => {
  await commonStorage.saveLocal(
    getRequestsKey(accountAddress, network),
    { data: requests },
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
  const requests = await getLocalRequests(address, network);
  const updatedRequests = { ...requests };
  delete updatedRequests[callId];
  await saveLocalRequests(address, network, updatedRequests);
};
