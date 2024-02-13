import { differenceInMinutes } from 'date-fns';
import { getAccountLocal, saveAccountLocal } from './common';
import { pickBy } from '@/helpers/utilities';

const REQUESTS = 'requests';

export const walletConnectAccountLocalKeys = [REQUESTS];

const isRequestStillValid = (request: any) => {
  if (request?.displayDetails?.timestampInMs) {
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
export const getLocalRequests = async (accountAddress: any, network: any) => {
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
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
export const saveLocalRequests = async (requests: any, accountAddress: any, network: any) =>
  saveAccountLocal(REQUESTS, requests, accountAddress, network);

/**
 * @desc remove request
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @param  {String}   [requestId]
 * @return {Void}
 */
export const removeLocalRequest = async (address: any, network: any, requestId: any) => {
  const requests = await getLocalRequests(address, network);
  const updatedRequests = { ...requests };
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete updatedRequests[requestId];
  await saveLocalRequests(updatedRequests, address, network);
};
