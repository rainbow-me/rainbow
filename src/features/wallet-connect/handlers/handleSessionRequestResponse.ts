import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils';
import type { SignClientTypes } from '@walletconnect/types';

import { logger } from '@/logger';

import { getWalletKitClient } from '../services/client';
import { removeWalletConnectRequest } from '../stores/walletConnectRequestsStore';

/** Responds to a WalletConnect session request and removes it from the pending request store. */
export async function handleSessionRequestResponse(
  {
    sessionRequestEvent,
  }: {
    sessionRequestEvent: SignClientTypes.EventArguments['session_request'];
  },
  { result, error }: { result: string | null; error: string | Error | null }
): Promise<void> {
  logger.debug(`[walletConnect]: handleSessionRequestResponse`, {
    success: Boolean(result),
  });

  const client = await getWalletKitClient();
  const { topic, id } = sessionRequestEvent;
  if (result) {
    const payload = {
      topic,
      response: formatJsonRpcResult(id, result),
    };
    logger.debug(`[walletConnect]: handleSessionRequestResponse success`, {}, logger.DebugContext.walletconnect);
    await client.respondSessionRequest(payload);
  } else {
    const payload = {
      topic,
      response: formatJsonRpcError(id, error instanceof Error ? error.message : (error ?? undefined)),
    };
    logger.debug(`[walletConnect]: handleSessionRequestResponse reject`, {}, logger.DebugContext.walletconnect);
    await client.respondSessionRequest(payload);
  }
  removeWalletConnectRequest({ walletConnectRequestId: sessionRequestEvent.id });
}
