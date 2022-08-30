import WalletConnect from '@walletconnect/client';
import { getGlobal, saveGlobal } from './common';
import { omitFlatten, pickBy } from '@/helpers/utilities';

const WALLETCONNECT = 'walletconnect';

/**
 * @desc get all wallet connect sessions
 * @return {Object}
 */
export const getAllValidWalletConnectSessions = async () => {
  const allSessions: {
    [key: string]: WalletConnect['session'];
  } = await getAllWalletConnectSessions();

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
export const saveWalletConnectSession = async (peerId: any, session: any) => {
  const allSessions = await getAllValidWalletConnectSessions();
  allSessions[peerId] = session;
  await saveGlobal(WALLETCONNECT, allSessions);
};

/**
 * @desc remove wallet connect sessions
 * @param  {String}   [sessionId]
 */
export const removeWalletConnectSessions = async (sessionIds: any) => {
  const allSessions = await getAllWalletConnectSessions();
  const resultingSessions = omitFlatten(allSessions, sessionIds);
  await saveGlobal(WALLETCONNECT, resultingSessions);
};
