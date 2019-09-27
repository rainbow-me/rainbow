import { differenceInMinutes } from 'date-fns';
import { omit, pickBy } from 'lodash';
import {
  getAccountLocal,
  getLocal,
  removeAccountLocal,
  removeLocal,
  saveAccountLocal,
  saveLocal,
} from './common';

const REQUESTS = 'requests';

/**
 * @desc get all wallet connect sessions
 * @return {Object}
 */
export const getAllValidWalletConnectSessions = async () => {
  const allSessions = await getAllWalletConnectSessions();
  return pickBy(allSessions, value => value.connected);
};

/**
 * @desc get all wallet connect sessions
 * @return {Object}
 */
export const getAllWalletConnectSessions = async () => {
  const allSessions = await getLocal('walletconnect');
  return allSessions || {};
};

/**
 * @desc save wallet connect session
 * @param  {String}   [peerId]
 * @param  {Object}   [session]
 */
export const saveWalletConnectSession = async (peerId, session) => {
  const allSessions = await getAllValidWalletConnectSessions();
  allSessions[peerId] = session;
  await saveLocal('walletconnect', allSessions);
};

/**
 * @desc remove wallet connect session
 * @param  {String}   [peerId]
 */
export const removeWalletConnectSession = async peerId => {
  const allSessions = await getAllWalletConnectSessions();
  const session = allSessions ? allSessions[peerId] : null;
  const resultingSessions = omit(allSessions, [peerId]);
  await saveLocal('walletconnect', resultingSessions);
  return session;
};

/**
 * @desc remove wallet connect sessions
 * @param  {String}   [sessionId]
 */
export const removeWalletConnectSessions = async sessionIds => {
  const allSessions = await getAllWalletConnectSessions();
  const resultingSessions = omit(allSessions, sessionIds);
  await saveLocal('walletconnect', resultingSessions);
};

/**
 * @desc remove all wallet connect sessions
 * @param  {String}   [sessionId]
 */
export const removeWalletConnect = () => removeLocal('walletconnect');

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
  await saveLocalRequests(accountAddress, network, openRequests);
  return openRequests;
};

/**
 * @desc save local incoming requests
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Void}
 */
export const saveLocalRequests = async (accountAddress, network, requests) =>
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
  await saveLocalRequests(address, network, updatedRequests);
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
