import { differenceInMinutes } from 'date-fns';
import { pickBy } from 'lodash';
import { getAccountLocal, saveAccountLocal } from './common';

const REQUESTS = 'requests';

export const walletConnectAccountLocalKeys = [REQUESTS];

const isRequestStillValid = request => {
  if (
    request &&
    request.displayDetails &&
    request.displayDetails.timestampInMs
  ) {
    const createdAt = request.displayDetails.timestampInMs;
    return differenceInMinutes(Date.now(), createdAt) < 60;
  }
  return false;
};

/**
 * @desc get account local requests
 * @param  {String}   [address]
 * @return {Object}
 */
export const getLocalRequests = async (accountAddress, network) => {
  const requests = getAccountLocal(REQUESTS, accountAddress, network, {});
  const openRequests = pickBy(requests, isRequestStillValid);
  await saveLocalRequests(openRequests, accountAddress, network);
  return openRequests;
};

/**
 * @desc save local incoming requests
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Void}
 */
export const saveLocalRequests = async (requests, accountAddress, network) =>
  saveAccountLocal(REQUESTS, requests, accountAddress, network);

/**
 * @desc remove request
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @param  {String}   [requestId]
 * @return {Void}
 */
export const removeLocalRequest = async (address, network, requestId) => {
  const requests = await getLocalRequests(address, network);
  const updatedRequests = { ...requests };
  delete updatedRequests[requestId];
  await saveLocalRequests(updatedRequests, address, network);
};
