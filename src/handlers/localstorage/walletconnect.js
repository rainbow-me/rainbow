import { differenceInMinutes } from 'date-fns';
import { omit, pickBy } from 'lodash';
import {
  getAccountLocal,
  removeAccountLocal,
  saveAccountLocal,
} from './common';

const REQUESTS = 'requests';
const WALLETCONNECT = 'walletconnect';

/**
 * @desc get all wallet connect sessions
 * @return {Object}
 */
export const getAllValidWalletConnectSessions = async (
  accountAddress,
  network
) => {
  const allSessions = await getAllWalletConnectSessions(
    accountAddress,
    network
  );
  return pickBy(allSessions, value => value.connected);
};

/**
 * @desc get all wallet connect sessions
 * @return {Object}
 */
const getAllWalletConnectSessions = (accountAddress, network) =>
  getAccountLocal(WALLETCONNECT, accountAddress, network, {});

/**
 * @desc save wallet connect session
 * @param  {String}   [peerId]
 * @param  {Object}   [session]
 */
export const saveWalletConnectSession = async (
  peerId,
  session,
  accountAddress,
  network
) => {
  const allSessions = await getAllValidWalletConnectSessions(
    accountAddress,
    network
  );
  allSessions[peerId] = session;
  await saveAccountLocal(WALLETCONNECT, allSessions, accountAddress, network);
};

/**
 * @desc remove wallet connect sessions
 * @param  {String}   [sessionId]
 */
export const removeWalletConnectSessions = async (
  sessionIds,
  accountAddress,
  network
) => {
  const allSessions = await getAllWalletConnectSessions(
    accountAddress,
    network
  );
  const resultingSessions = omit(allSessions, sessionIds);
  await saveAccountLocal(
    WALLETCONNECT,
    resultingSessions,
    accountAddress,
    network
  );
};

/**
 * @desc remove all wallet connect sessions
 * @param  {String}   [sessionId]
 */
export const removeWalletConnect = (accountAddress, network) =>
  removeAccountLocal(WALLETCONNECT, accountAddress, network);

const isRequestStillValid = request => {
  const createdAt = request.displayDetails.timestampInMs;
  return differenceInMinutes(Date.now(), createdAt) < 60;
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

/**
 * @desc remove all requests
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @param  {String}   [requestId]
 * @return {Void}
 */
export const removeLocalRequests = async (accountAddress, network) =>
  removeAccountLocal(REQUESTS, accountAddress, network);
