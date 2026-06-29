import { Platform } from 'react-native';

import { formatJsonRpcError, formatJsonRpcResult } from '@json-rpc-tools/utils';
import type { SignClientTypes } from '@walletconnect/types';

import { analytics } from '@/analytics';
import { handleWalletConnectRequest } from '@/features/dapp-request/utils/requestNavigationHandlers';
import { getRequestDisplayDetails } from '@/features/dapp-request/utils/requests';
import { fetchDappMetadata } from '@/features/dapp/resources/dapp';
import { maybeSignUri } from '@/handlers/imgix';
import WalletTypes from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import store from '@/redux/store';
import { getWallets, getWalletWithAccount } from '@/state/wallets/walletsStore';

import { showErrorSheet } from '../components/showErrorSheet';
import { getWalletKitClient } from '../services/client';
import { maybeGoBackAndClearHasPendingRedirect, setHasPendingDeeplinkPendingRedirect } from '../services/pair';
import { addNewWalletConnectRequest, removeWalletConnectRequest } from '../stores/walletConnectRequestsStore';
import { RPCMethod, type WalletconnectRequestData, type WalletconnectResultType } from '../types';
import { isSupportedMethod, isSupportedSigningMethod, parseRPCParams } from '../utils/rpcParams';

const T = i18n.l.walletconnect;

// For WC v2
export async function onSessionRequest(event: SignClientTypes.EventArguments['session_request']) {
  setHasPendingDeeplinkPendingRedirect(true);
  const client = await getWalletKitClient();

  logger.debug(`[walletConnect]: session_request`, {}, logger.DebugContext.walletconnect);

  const { id, topic } = event;
  const { method: _method, params } = event.params.request;

  const method = _method as RPCMethod;

  logger.debug(`[walletConnect]: session_request method`, { method, params }, logger.DebugContext.walletconnect);

  // we allow eth sign for connections but we dont want to support actual signing
  if (method === RPCMethod.Sign) {
    await client.respondSessionRequest({
      topic,
      response: formatJsonRpcError(id, `Rainbow does not support legacy eth_sign`),
    });
    showErrorSheet({
      title: i18n.t(T.errors.generic_title),
      body: i18n.t(T.errors.eth_sign),
      sheetHeight: 270,
      onClose: maybeGoBackAndClearHasPendingRedirect,
    });
    return;
  }
  if (isSupportedMethod(method)) {
    const isSigningMethod = isSupportedSigningMethod(method);
    const { address, message } = parseRPCParams({
      method,
      params,
    });
    if (!address) {
      logger.error(new RainbowError('[walletConnect]: No Address in the RPC Params'));
      return;
    }

    const allWallets = getWallets();

    logger.debug(
      `[walletConnect]: session_request method is supported`,
      { method, params, address, message },
      logger.DebugContext.walletconnect
    );

    if (isSigningMethod) {
      logger.debug(`[walletConnect]: validating session_request signing method`);

      if (!address || !message) {
        logger.error(new RainbowError(`[walletConnect]: session_request exited, signing request had no address and/or messsage`), {
          address,
          message,
        });

        analytics.track(analytics.event.wcRequestFailed, {
          type: 'session_request',
          reason: 'session_request exited, signing request had no address and/or messsage',
        });

        await client.respondSessionRequest({
          topic,
          response: formatJsonRpcError(id, `Invalid RPC params`),
        });

        showErrorSheet({
          title: i18n.t(T.errors.generic_title),
          body: i18n.t(T.errors.request_invalid),
          sheetHeight: 270,
          onClose: maybeGoBackAndClearHasPendingRedirect,
        });
        return;
      }

      // for TS only, should never happen
      if (!allWallets) {
        logger.error(new RainbowError(`[walletConnect]: allWallets is null, this should never happen`));
        return;
      }

      const selectedWallet = getWalletWithAccount(address);

      const isReadOnly = selectedWallet?.type === WalletTypes.readOnly;
      if (!selectedWallet || isReadOnly) {
        logger.error(new RainbowError(`[walletConnect]: session_request exited, selectedWallet was falsy or read only`), {
          selectedWalletType: selectedWallet?.type,
        });

        const errorMessageBody = isReadOnly ? i18n.t(T.errors.read_only_wallet_on_signing_method) : i18n.t(T.errors.generic_error);

        analytics.track(analytics.event.wcRequestFailed, {
          type: 'read only wallet',
          reason: 'session_request exited, selectedWallet was falsy or read only',
        });

        await client.respondSessionRequest({
          topic,
          response: formatJsonRpcError(id, `Wallet is read-only`),
        });

        showErrorSheet({
          title: i18n.t(T.errors.generic_title),
          body: errorMessageBody,
          sheetHeight: 270,
          onClose: maybeGoBackAndClearHasPendingRedirect,
        });
        return;
      }
    }

    const session = Object.values(client.getActiveSessions() || {}).find(s => {
      return s.topic === topic;
    });

    // mostly a TS guard, pry won't happen
    if (!session) {
      logger.error(new RainbowError(`[walletConnect]: session_request topic was not found`));

      analytics.track(analytics.event.wcRequestFailed, { type: 'session_request', reason: 'session_request topic was not found' });

      await client.respondSessionRequest({
        topic,
        response: formatJsonRpcError(id, `Session not found`),
      });

      return;
    }

    const { nativeCurrency } = store.getState().settings;
    const chainId = Number(event.params.chainId.split(':')[1]);

    logger.debug(`[walletConnect]: getting session for topic`, { session });

    logger.debug(`[walletConnect]: handling request`, {}, logger.DebugContext.walletconnect);

    const displayDetails = await getRequestDisplayDetails(event.params.request, nativeCurrency, chainId);
    const peerMeta = session.peer.metadata;

    const metadata = await fetchDappMetadata({ url: peerMeta.url, status: true });
    const dappName = metadata?.appName || peerMeta.name || i18n.t(i18n.l.walletconnect.unknown_url);
    const dappImage = metadata?.appLogo || peerMeta?.icons?.[0];

    const request: WalletconnectRequestData = {
      clientId: session.topic, // I don't think this is used
      peerId: session.topic, // I don't think this is used
      requestId: event.id,
      dappName,
      dappScheme: 'unused in WC v2', // only used for deeplinks from WC v1
      dappUrl: peerMeta.url || 'Unknown URL',
      displayDetails,
      imageUrl: maybeSignUri(dappImage, { w: 200 }),
      address,
      chainId,
      payload: event.params.request,
      walletConnectV2RequestValues: {
        sessionRequestEvent: event,
        address,
        chainId,
        onComplete(type: WalletconnectResultType) {
          if (Platform.OS === 'ios') {
            Navigation.handleAction(Routes.WALLET_CONNECT_REDIRECT_SHEET, {
              type,
            });
          }

          maybeGoBackAndClearHasPendingRedirect({ delay: 300 });
        },
      },
    };

    const addedNewRequest = addNewWalletConnectRequest({ walletConnectRequest: request });
    if (addedNewRequest) {
      logger.debug(`[walletConnect]: navigating to CONFIRM_REQUEST sheet`, {}, logger.DebugContext.walletconnect);
      handleWalletConnectRequest(request);

      analytics.track(analytics.event.wcShowingSigningRequest, {
        dappName: request.dappName,
        dappUrl: request.dappUrl,
      });
    }
  } else {
    logger.error(new RainbowError(`[walletConnect]: received unsupported session_request RPC method`), {
      method,
    });

    analytics.track(analytics.event.wcRequestFailed, {
      type: `method not supported`,
      reason: 'received unsupported session_request RPC method',
      method: method,
    });

    try {
      await client.respondSessionRequest({
        topic,
        response: formatJsonRpcError(id, `Method ${method} not supported`),
      });
    } catch (e) {
      logger.error(new RainbowError(`[walletConnect]: error rejecting session_request`), {
        error: (e as Error).message,
      });
    }

    showErrorSheet({
      title: i18n.t(T.errors.generic_title),
      body: i18n.t(T.errors.request_unsupported_methods),
      sheetHeight: 250,
      onClose: maybeGoBackAndClearHasPendingRedirect,
    });
  }
}

/**
 * Handles the result created on our confirmation screen and sends it along to the dapp via WC
 */
export async function handleSessionRequestResponse(
  {
    sessionRequestEvent,
  }: {
    sessionRequestEvent: SignClientTypes.EventArguments['session_request'];
  },
  { result, error }: { result: string | null; error: any }
) {
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
      response: formatJsonRpcError(id, error),
    };
    logger.debug(`[walletConnect]: handleSessionRequestResponse reject`, {}, logger.DebugContext.walletconnect);
    await client.respondSessionRequest(payload);
  }
  removeWalletConnectRequest({ walletConnectRequestId: sessionRequestEvent.id });
}
