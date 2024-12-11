import URL from 'url-parse';
import { parseUri } from '@walletconnect/utils';

import store from '@/redux/store';
import { fetchReverseRecordWithRetry } from '@/utils/profileUtils';
import { showWalletConnectToast } from '@/components/toasts/WalletConnectToast';
import { defaultConfig } from '@/config/experimental';
import { PROFILES } from '@/config/experimentalHooks';
import { delay } from '@/utils/delay';
import { checkIsValidAddressOrDomain, isENSAddressFormat } from '@/helpers/validators';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import ethereumUtils, { getAddressAndChainIdFromUniqueId } from '@/utils/ethereumUtils';
import { logger } from '@/logger';
import { pair as pairWalletConnect, setHasPendingDeeplinkPendingRedirect } from '@/walletConnect';
import { analyticsV2 } from '@/analytics';
import { FiatProviderName } from '@/entities/f2c';
import { getPoapAndOpenSheetWithQRHash, getPoapAndOpenSheetWithSecretWord } from '@/utils/poaps';
import { queryClient } from '@/react-query';
import { pointsReferralCodeQueryKey } from '@/resources/points';
import { useMobileWalletProtocolHost } from '@coinbase/mobile-wallet-protocol-host';
import { InitialRoute } from '@/navigation/initialRoute';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { GasSpeed } from '@/__swaps__/types/gas';

import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { queryTokenSearch } from '@/__swaps__/screens/Swap/resources/search/search';
import { clamp } from '@/__swaps__/utils/swaps';
import { isAddress } from 'viem';
import { navigateToSwaps, SwapsParams } from '@/__swaps__/screens/Swap/navigateToSwaps';
import { userAssetsStore } from '@/state/assets/userAssets';
import { addressSetSelected, walletsSetSelected } from '@/redux/wallets';

interface DeeplinkHandlerProps extends Pick<ReturnType<typeof useMobileWalletProtocolHost>, 'handleRequestUrl' | 'sendFailureToClient'> {
  url: string;
  initialRoute: InitialRoute;
}

/*
 * You can test these deeplinks with the following command:
 *
 *    `xcrun simctl openurl booted "https://link.rainbow.me/0x123"`
 */

export default async function handleDeeplink({ url, initialRoute, handleRequestUrl, sendFailureToClient }: DeeplinkHandlerProps) {
  if (!url) {
    logger.warn(`[handleDeeplink]: No url provided`);
    return;
  }

  /**
   * We need to wait till the wallet is ready to handle any deeplink
   */
  while (!store.getState().appState.walletReady) {
    logger.debug(`[handleDeeplink]: Waiting for wallet to be ready`);
    await delay(50);
  }

  const { protocol, host, pathname, query } = new URL(url, true);

  logger.debug(`[handleDeeplink]: handling url`, {
    url,
    protocol,
    host,
    pathname,
    query,
  });

  if (protocol === 'ethereum:') {
    /**
     * Handling send deep links
     */
    logger.debug(`[handleDeeplink]: ethereum:// protocol`);
    ethereumUtils.parseEthereumUrl(url);
  } else if (protocol === 'https:' || protocol === 'rainbow:') {
    /**
     * Any native iOS deep link OR universal links via HTTPS
     */
    logger.debug(`[handleDeeplink]: https:// or rainbow:// protocol`);

    /**
     * The first path following the host (universal link) or protocol
     * (deeplink) e.g. `https://rainbow.me/foo` or `rainbow://foo` where `foo`
     * is the action.
     */
    const action = protocol === 'https:' ? pathname.split('/')[1] : host;

    switch (action) {
      /**
       * Universal links from WC e.g. when initiating a pairing on mobile, you
       * tap "Rainbow" in Web3Modal and it hits this handler
       */
      case 'wc': {
        logger.debug(`[handleDeeplink]: wc`);
        handleWalletConnect(query.uri, query.connector);
        break;
      }

      /**
       * Links from website to an individual token
       */
      case 'token': {
        logger.debug(`[handleDeeplink]: token`);
        const { addr } = query;
        const address = (addr as string)?.toLowerCase() ?? '';

        if (address && address.length > 0) {
          const asset = ethereumUtils.getAssetFromAllAssets(address);

          // First go back to home to dismiss any open shit
          // and prevent a weird crash
          if (initialRoute !== Routes.WELCOME_SCREEN) {
            // @ts-expect-error FIXME: Expected 2-3 arguments, but got 1.
            Navigation.handleAction(Routes.WALLET_SCREEN);
          }

          setTimeout(() => {
            const _action = (asset: any) => {
              Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET, {
                asset,
                fromDiscover: true,
                type: 'token',
              });
            };

            if (asset) {
              _action(asset);
            }
          }, 50);
        }
        break;
      }

      /**
       * Handle redirects after user completes an fiat onramp flow. This URL
       * should contain metadata about the transaction, if we have it.
       */
      case 'f2c': {
        logger.debug(`[handleDeeplink]: f2c`);

        const { provider, sessionId } = query;

        if (!provider || !sessionId) {
          logger.warn(`[handleDeeplink]: Received FWC deeplink with invalid params`, {
            url,
            query,
          });

          break;
        }

        /**
         * We fire these events here for F2C flows that we launch via a Safari
         * browser. Some other providers (e.g. Ratio) have callbacks on their
         * SDKs, so this same event is fired there, not here.
         */
        if (provider === FiatProviderName.Ramp) {
          /**
           * Ramp atm is special because the only way we return back here from
           * their flow is after a successful purchase. So we can safely set
           * `success: true` here. Eventually we may need to revisit this so
           * that we can add more properties as they become available.
           */
          analyticsV2.track(analyticsV2.event.f2cProviderFlowCompleted, {
            provider: provider as FiatProviderName,
            sessionId: sessionId as string,
            success: true,
          });
        } else {
          analyticsV2.track(analyticsV2.event.f2cProviderFlowCompleted, {
            provider: provider as FiatProviderName,
            sessionId: sessionId as string,
            // success is unknown
          });
        }

        break;
      }

      /**
       * Handles redirects from Plaid OAuth flow, which originates (atm) within
       * Ratio's onramp SDK.
       */
      case 'plaid': {
        logger.debug(`[handleDeeplink]: handling Plaid redirect`, { url });
        break;
      }

      case 'poap': {
        logger.debug(`[handleDeeplink]: handling POAP`, { url });
        const secretWordOrHash = pathname?.split('/')?.[1];
        await getPoapAndOpenSheetWithSecretWord(secretWordOrHash, false);
        await getPoapAndOpenSheetWithQRHash(secretWordOrHash, false);
        break;
      }

      case 'points': {
        logger.debug(`[handleDeeplink]: handling points`, { url });
        const referralCode = query?.ref;
        if (referralCode) {
          analyticsV2.track(analyticsV2.event.pointsReferralCodeDeeplinkOpened);
          queryClient.setQueryData(
            pointsReferralCodeQueryKey,
            (referralCode.slice(0, 3) + '-' + referralCode.slice(3, 7)).toLocaleUpperCase()
          );
        }
        break;
      }

      case 'dapp': {
        const { url } = query;
        logger.debug(`[handleDeeplink]: handling dapp`, { url });
        if (url) {
          Navigation.handleAction(Routes.DAPP_BROWSER_SCREEN, { url });
        }
        break;
      }

      case 'swap': {
        logger.debug(`[handleDeeplink]: swap`, { url });
        handleSwapsDeeplink(url);
        break;
      }

      case 'wsegue': {
        const response = await handleRequestUrl(url);
        if (response.error) {
          // Return error to client app if session is expired or invalid
          const { errorMessage, decodedRequest } = response.error;
          await sendFailureToClient(errorMessage, decodedRequest);
        }
        break;
      }

      default: {
        logger.debug(`[handleDeeplink]: default`, { url });
        const addressOrENS = pathname?.split('/profile/')?.[1] ?? pathname?.split('/')?.[1];
        /**
         * This handles ENS profile links on mobile i.e.
         * `https://rainbow.me/0x123...` which is why it's in the default case
         * here.
         */
        if (addressOrENS) {
          const isValid = await checkIsValidAddressOrDomain(addressOrENS);

          if (isValid) {
            const profilesEnabled = defaultConfig?.[PROFILES]?.value;
            const ensName = isENSAddressFormat(addressOrENS) ? addressOrENS : await fetchReverseRecordWithRetry(addressOrENS);
            return Navigation.handleAction(profilesEnabled ? Routes.PROFILE_SHEET : Routes.SHOWCASE_SHEET, {
              address: ensName || addressOrENS,
              fromRoute: 'Deeplink',
            });
          } else {
            logger.warn(`[handleDeeplink]: invalid address or ENS provided`, {
              url,
              protocol,
              host,
              pathname,
              query,
              addressOrENS,
            });
          }
        } else {
          /**
           * This is a catch-all for any other deep links that we don't handle
           */
          logger.warn(`[handleDeeplink]: invalid or unknown deeplink`, {
            url,
            protocol,
            host,
            pathname,
            query,
          });
        }
      }
    }
    // Android uses normal deeplinks
  } else if (protocol === 'wc:') {
    logger.debug(`[handleDeeplink]: wc:// protocol`);
    handleWalletConnect(url, query.connector);
  }
}

/**
 * A reference to which WC URIs we've already handled.
 *
 * Branch (our deeplinking handler) runs its `subscribe()` handler every time
 * the app is opened or re-focused from background. On Android, it caches the
 * last deeplink (it shouldn't), and so tries to handle a deeplink we've
 * already handled.
 *
 * In the case of WC, we don't want this to happen because we'll try to connect
 * to a session that's either already active or expired.
 * We handle this here, before we even reach application code.
 *
 * Important: dapps also use deeplinks to re-focus the user to our app, where
 * the socket connections then take over. So those URIs are always the same,
 * and we DON'T want ignore those by caching them. So only cache URIs with query
 * metadata include, other URIs are used merely for re-focusing.
 */
const walletConnectURICache = new Set();

function handleWalletConnect(uri?: string, connector?: string) {
  if (!uri) {
    logger.debug(`[handleWalletConnect]: skipping uri empty`);
    showWalletConnectToast({ isTransactionRequest: true });
    return;
  }

  const cacheKey = JSON.stringify({ uri });

  if (walletConnectURICache.has(cacheKey)) {
    logger.debug(`[handleWalletConnect]: skipping duplicate event`);
    return;
  }

  const { query } = new URL(uri);
  const parsedUri = uri ? parseUri(uri) : null;

  logger.debug(`[handleWalletConnect]: handling event`, {
    uri,
    query,
    parsedUri,
  });

  if (uri && query && parsedUri) {
    // make sure we don't handle this again
    walletConnectURICache.add(cacheKey);

    showWalletConnectToast();

    if (parsedUri.version === 2) {
      logger.debug(`[handleWalletConnect]: handling v2`, { uri });
      setHasPendingDeeplinkPendingRedirect(true);
      pairWalletConnect({ uri, connector });
    }
  } else {
    logger.debug(`[handleWalletConnect]: handling fallback`, { uri });
    // This is when we get focused by WC due to a signing request
    // Don't add this URI to cache
    showWalletConnectToast({ isTransactionRequest: true });
    setHasPendingDeeplinkPendingRedirect(true);
  }
}

const querySwapAsset = async (uniqueId: string | undefined): Promise<ParsedSearchAsset | undefined> => {
  if (!uniqueId) return undefined;

  const { address, chainId } = getAddressAndChainIdFromUniqueId(uniqueId);
  const supportedSwapChainIds = useBackendNetworksStore.getState().getSwapSupportedChainIds();
  if (!supportedSwapChainIds.includes(parseInt(chainId.toString(), 10))) return undefined;
  if (address !== 'eth' && address.length !== 42) return undefined;

  const userAsset = userAssetsStore.getState().getUserAsset(uniqueId) || undefined;

  const searchAsset = await queryTokenSearch({
    chainId,
    query: address.toLowerCase(),
    keys: ['address'],
    threshold: 'CASE_SENSITIVE_EQUAL',
    list: 'verifiedAssets',
  }).then(res => res[0]);

  if (!searchAsset) return userAsset;

  return parseSearchAsset({ searchAsset, userAsset });
};

function isValidGasSpeed(s: string | undefined): s is GasSpeed {
  if (!s) return false;
  return Object.values(GasSpeed).includes(s as GasSpeed);
}

async function setFromWallet(address: string | undefined) {
  if (!address || !isAddress(address)) return;

  const userWallets = store.getState().wallets.wallets!;
  const wallet = Object.values(userWallets).find(w => w.addresses.some(a => a.address === address));

  if (!wallet) return;

  await Promise.all([store.dispatch(walletsSetSelected(wallet)), store.dispatch(addressSetSelected(address))]);
}

function isNumericString(value: string | undefined): value is string {
  if (!value) {
    return false;
  }
  return !isNaN(+value);
}

async function handleSwapsDeeplink(url: string) {
  const { query } = new URL(url, true);

  await setFromWallet(query.from);

  const params: SwapsParams = {};

  const inputAsset = querySwapAsset(query.inputAsset);
  const outputAsset = querySwapAsset(query.outputAsset);

  if ('slippage' in query && isNumericString(query.slippage)) {
    params.slippage = query.slippage;
  }

  if (isNumericString(query.percentageToSell)) {
    params.percentageToSell = clamp(+query.percentageToSell, 0, 1);
  } else if (isNumericString(query.inputAmount)) {
    params.inputAmount = query.inputAmount;
  } else if (isNumericString(query.outputAmount)) {
    params.outputAmount = query.outputAmount;
  }

  const gasSpeed = query.gasSpeed?.toLowerCase();
  if (isValidGasSpeed(gasSpeed)) {
    params.gasSpeed = gasSpeed;
  }

  params.inputAsset = await inputAsset;
  params.outputAsset = await outputAsset;

  navigateToSwaps(params);
}
