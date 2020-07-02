import { omit, pickBy } from 'lodash';
import { getGlobal, saveGlobal } from './common';

const WALLETCONNECT = 'walletconnect';

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
const getAllWalletConnectSessions = () => getGlobal(WALLETCONNECT, {});

/**
 * @desc save wallet connect session
 * @param  {String}   [peerId]
 * @param  {Object}   [session]
 */
export const saveWalletConnectSession = async (peerId, session) => {
  const allSessions = await getAllValidWalletConnectSessions();
  allSessions[peerId] = session;
  await saveGlobal(WALLETCONNECT, allSessions);
};

/**
 * @desc remove wallet connect sessions
 * @param  {String}   [sessionId]
 */
export const removeWalletConnectSessions = async sessionIds => {
  const allSessions = await getAllWalletConnectSessions();
  const resultingSessions = omit(allSessions, sessionIds);
  await saveGlobal(WALLETCONNECT, resultingSessions);
};
