import AsyncStorage from '@react-native-community/async-storage';
import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnectv2/client';
import { Reason, SessionTypes } from '@walletconnectv2/types';
import lang from 'i18n-js';
import { clone } from 'lodash';
import { Alert, InteractionManager, Linking } from 'react-native';
import {
  // @ts-ignore
  WALLET_CONNECT_PROJECT_ID,
} from 'react-native-dotenv';
import { enableActionsOnReadOnlyWallet } from '../config/debug';
import { isSigningMethod } from '../utils/signingMethods';
import { sendRpcCall } from '@rainbow-me/handlers/web3';
import { getDappMetadata } from '@rainbow-me/helpers/dappNameHandler';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import { convertHexToString, delay } from '@rainbow-me/helpers/utilities';
import walletConnectApprovalSheetTypes from '@rainbow-me/helpers/walletConnectApprovalSheetTypes';
import { walletConnectSupportedChainIds } from '@rainbow-me/helpers/walletConnectNetworks';
import walletTypes from '@rainbow-me/helpers/walletTypes';
import { Navigation } from '@rainbow-me/navigation';
import {
  addRequestToApproveV2,
  WC_VERSION_2,
} from '@rainbow-me/redux/requests';
import store from '@rainbow-me/redux/store';
import {
  RAINBOW_METADATA,
  saveWalletConnectV2Sessions,
  WALLETCONNECT_V2_UPDATE_SESSIONS,
} from '@rainbow-me/redux/walletconnect';
import Routes from '@rainbow-me/routes';
import { ethereumUtils, logger, watchingAlert } from '@rainbow-me/utils';

const WC_RELAY_PROVIDER = 'wss://relay.walletconnect.com';

const wcTrack = (
  event: string,
  metadata: { name: string; url: string },
  opts?: object
) =>
  analytics.track(event, {
    dappName: metadata?.name || metadata?.url,
    dappUrl: metadata?.url,
    version: WC_VERSION_2,
    ...opts,
  });

const toEIP55Format = (chainId: string | number) => `eip155:${chainId}`;
export const fromEIP55Format = (chain: string) => {
  const [, chainId] = chain?.split(':');
  return chainId;
};

const generateWalletConnectAccount = (address: string, chain: string) => {
  return `eip155:${chain}:${address}`;
};

const isSupportedChainId = (chainId: string) => {
  const network = ethereumUtils.getNetworkFromChainId(Number(chainId));
  if (networkInfo[network] && !networkInfo[network]?.testnet) {
    return true;
  }
  return false;
};

export const getAddressAndChainIdFromWCAccount = (
  account: string
): { address: string; chainId: number } => {
  const [, chainId, address] = account.split(':');
  return { address, chainId: Number(chainId) };
};

export const walletConnectV2HandleAction = (type: string, scheme?: string) => {
  if (scheme) {
    Linking.openURL(`${scheme}://`);
  } else {
    return Navigation.handleAction(Routes.WALLET_CONNECT_REDIRECT_SHEET, {
      type,
    });
  }
};

let client: WalletConnectClient;

export const walletConnectInit = async () => {
  if (!client) {
    client = await WalletConnectClient.init({
      controller: true,
      metadata: RAINBOW_METADATA,
      projectId: WALLET_CONNECT_PROJECT_ID,
      relayUrl: WC_RELAY_PROVIDER,
      storageOptions: {
        asyncStorage: AsyncStorage as any,
      },
    });
    store.dispatch(saveWalletConnectV2Sessions(client));
    client.on(
      CLIENT_EVENTS.session.deleted,
      async (session: SessionTypes.Settled) => {
        const sessions = client?.session?.values?.filter(
          value => session.topic !== value?.topic
        );
        store.dispatch({
          payload: clone(sessions),
          type: WALLETCONNECT_V2_UPDATE_SESSIONS,
        });
      }
    );
    client.on(
      CLIENT_EVENTS.session.proposal,
      async (proposal: SessionTypes.Proposal) => {
        try {
          const { proposer, permissions } = proposal;
          const { metadata } = proposer;
          const chains = permissions.blockchain.chains;
          const chainId = fromEIP55Format(chains[0]);
          if (!isSupportedChainId(chainId)) {
            Alert.alert('Chain not supported', `${chains[0]} is not supported`);
            wcTrack('Walletconnect chain not supported', metadata, {
              chain: chains[0],
            });
            client.reject({
              proposal,
              reason: {
                code: 1,
                message: `Chain ${chains[0]} is not supported`,
              },
            });
            return;
          }
          wcTrack('Showing Walletconnect session request', metadata);

          Navigation.handleAction(Routes.WALLET_CONNECT_APPROVAL_SHEET, {
            callback: async (
              approved: boolean,
              chainId: string,
              accountAddress: string
            ) => {
              if (approved) {
                const walletConnectAccount = generateWalletConnectAccount(
                  accountAddress,
                  chainId
                );
                const response = {
                  metadata: RAINBOW_METADATA,
                  state: {
                    accounts: [walletConnectAccount],
                  },
                };
                wcTrack('Approved new WalletConnect session', metadata);
                walletConnectV2HandleAction('connect');
                await client.approve({ proposal, response });
              } else {
                wcTrack('Rejected new WalletConnect session', metadata);
                walletConnectV2HandleAction('reject');
                await client.reject({
                  proposal,
                  reason: { code: 1, message: 'User rejected request' },
                });
              }
              return client.session.values;
            },
            chainId: fromEIP55Format(chains?.[0]),
            meta: {
              dappName: metadata.name,
              dappUrl: metadata?.url,
              imageUrl: metadata.icons?.[0],
            },
            version: WC_VERSION_2,
          });
        } catch (error) {
          logger.log('Exception during wc session.proposal');
          analytics.track('Exception on wc session.proposal', {
            error: String(error),
            version: WC_VERSION_2,
          });
          await client.reject({
            proposal,
            reason: {
              code: 100,
              message: String(error),
            },
          });
          captureException(error);
          Alert.alert(lang.t('wallet.wallet_connect.error'));
        }
      }
    );

    client.on(
      CLIENT_EVENTS.session.request,
      async (requestEvent: SessionTypes.RequestEvent) => {
        try {
          const { topic, request } = requestEvent;
          const session: SessionTypes.Settled = await client.session.get(
            requestEvent.topic
          );
          if (
            request.method === 'wallet_addEthereumChain' ||
            request.method === 'wallet_switchEthereumChain'
          ) {
            const hexChainId = request.params.chainId;
            const chainId = convertHexToString(hexChainId);
            if (walletConnectSupportedChainIds.includes(chainId)) {
              const metadata = getDappMetadata(session.peer.metadata);
              Navigation.handleAction(Routes.WALLET_CONNECT_APPROVAL_SHEET, {
                callback: async (
                  approved: boolean,
                  chainId: string,
                  accountAddress: string
                ) => {
                  if (approved) {
                    walletConnectUpdateSessionByUrl(
                      metadata.dappUrl,
                      accountAddress,
                      chainId
                    );
                    walletConnectV2HandleAction('connect');
                    const response = {
                      response: {
                        id: request.id,
                        jsonrpc: '2.0',
                        result: 'Request approved',
                      },
                      topic,
                    };
                    await client.respond(response);
                  } else {
                    walletConnectV2HandleAction('reject');
                    const response = {
                      response: {
                        id: request.id,
                        jsonrpc: '2.0',
                        result: 'User rejected request',
                      },
                      topic,
                    };
                    await client.respond(response);
                  }
                  return client.session.values;
                },
                chainId,
                meta: metadata,
                type: walletConnectApprovalSheetTypes.switch_chain,
                version: WC_VERSION_2,
              });
            } else {
              const response = {
                response: {
                  id: request.id,
                  jsonrpc: '2.0',
                  result: 'Chain currently not supported',
                },
                topic,
              };
              await client.respond(response);
            }
            return;
          } else if (!isSigningMethod(request.method)) {
            sendRpcCall(request)
              .then(async result => {
                const response = {
                  response: {
                    id: request.id,
                    jsonrpc: '2.0',
                    result,
                  },
                  topic,
                };
                await client.respond(response);
              })
              .catch(async error => {
                const response = {
                  response: error,
                  topic,
                };
                await client.respond(response);
              });
            return;
          } else {
            const { dispatch, getState } = store;
            const { selected } = getState().wallets;
            const selectedWallet = selected || {};
            const isReadOnlyWallet =
              selectedWallet.type === walletTypes.readOnly;
            if (isReadOnlyWallet && !enableActionsOnReadOnlyWallet) {
              watchingAlert();
              const response = {
                response: {
                  error: {
                    code: -32601,
                    message: 'JSON RPC method not supported',
                  },
                  id: request.id,
                  jsonrpc: '2.0',
                },
                topic,
              };
              await client.respond(response);
              return;
            }

            const requestToApprove = await dispatch(
              addRequestToApproveV2(request.id, session, request)
            );

            if (requestToApprove) {
              InteractionManager.runAfterInteractions(() => {
                Navigation.handleAction(Routes.CONFIRM_REQUEST, {
                  callback: async (res: { error: string; sig: string }) => {
                    const { error, sig } = res;
                    await client.respond({
                      response: {
                        id: request.id,
                        jsonrpc: '2.0',
                        ...{ error, result: sig },
                      },
                      topic,
                    });
                  },
                  openAutomatically: true,
                  transactionDetails: requestToApprove,
                });
              });
            }
          }
        } catch (error) {
          logger.log('Exception during wc session.request');
          analytics.track('Exception on wc session.request', {
            error: String(error),
            version: WC_VERSION_2,
          });
          await client.respond({
            response: {
              error: {
                code: 100,
                message: String(error),
              },
              id: requestEvent.request.id,
              jsonrpc: '2.0',
            },
            topic: requestEvent.topic,
          });

          captureException(error);
          Alert.alert(lang.t('wallet.wallet_connect.error'));
        }
      }
    );
  }

  return client;
};

export const walletConnectDisconnectAllSessions = async () => {
  const sessions = client.session.values;
  const disconnectSessions = sessions.map(session => () =>
    walletConnectDisconnect(session.topic)
  );
  await Promise.all(disconnectSessions);
  return client.session.values;
};

export const walletConnectUpdateSessionByUrl = async (
  topic: string,
  address: string,
  newChainId: string
) => {
  const sessions = client?.session?.values;
  const session = sessions?.find(value => topic === value?.peer.metadata.url);
  const eip55ChainId = toEIP55Format(newChainId);
  const newAccount = generateWalletConnectAccount(address, newChainId);
  session.permissions = {
    ...session.permissions,
    blockchain: {
      chains: [eip55ChainId],
    },
  };
  session.state.accounts = [newAccount];
  await client.upgrade({
    permissions: {
      blockchain: {
        chains: [eip55ChainId],
      },
    },
    topic: session.topic,
  });
  await client.update({
    state: session.state,
    topic: session.topic,
  });

  return client.session.values;
};

export const walletConnectDisconnectByUrl = async (url: string) => {
  const sessions = client?.session?.values;
  const session = sessions?.find(value => url === value?.peer?.metadata?.url);
  await walletConnectDisconnect(session.topic);
  return client.session.values;
};

const walletConnectDisconnect = async (topic: string) => {
  const reason: Reason = {
    code: 400,
    message: 'User disconnected',
  };
  await client.disconnect({ reason, topic });
};

export const walletConnectPair = async (uri: string) => {
  while (!client) {
    delay(300);
  }
  await client.pair({ uri });
  Navigation.handleAction(Routes.WALLET_CONNECT_APPROVAL_SHEET, {
    callback: () => null,
    chainId: null,
    meta: null,
    version: WC_VERSION_2,
  });
};
