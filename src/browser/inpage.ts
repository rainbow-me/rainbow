import { RainbowProvider } from '@rainbow-me/provider';
import { announceProvider, EIP1193Provider } from 'mipd';

import { toHex, RAINBOW_ICON_RAW_SVG, getDappHost, isValidUrl, shouldInjectProvider, uuid4, IN_DAPP_NOTIFICATION_STATUS } from './utils';
import { messenger, providerRequestTransport } from './messenger';
import { Ethereum } from '@rainbow-me/provider/dist/references/ethereum';
import { ChainId } from '@rainbow-me/provider/dist/references/chains';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - clashes with Wagmi's Window type https://github.com/wagmi-dev/wagmi/blob/a25ddf534781b2da81ee6aba307b93750efc5595/packages/core/src/types/index.ts#L77
    ethereum: RainbowProvider | Ethereum;
    lodash: unknown;
    rainbow: RainbowProvider;
    providers: (RainbowProvider | Ethereum)[];
    walletRouter: {
      rainbowProvider: RainbowProvider;
      lastInjectedProvider?: RainbowProvider | Ethereum;
      currentProvider: RainbowProvider | Ethereum;
      providers: (RainbowProvider | Ethereum)[];
      setDefaultProvider: (rainbowAsDefault: boolean) => void;
      addProvider: (provider: RainbowProvider | Ethereum) => void;
    };
  }
}

const rainbowProvider = new RainbowProvider({
  backgroundMessenger: messenger,
  providerRequestTransport: providerRequestTransport,
  onConstruct({ emit }) {
    // RainbowInjectedProvider is also used in popup via RainbowConnector
    // here we don't need to listen to anything so we don't need these listeners
    if (isValidUrl(window.location.href)) {
      const host = getDappHost(window.location.href);
      messenger?.reply(`accountsChanged:${host}`, async address => {
        emit('accountsChanged', [address]);
      });
      messenger?.reply(`chainChanged:${host}`, async (chainId: number) => {
        emit('chainChanged', toHex(String(chainId)));
      });
      messenger?.reply(`disconnect:${host}`, async () => {
        emit('disconnect', []);
      });
      messenger?.reply(`connect:${host}`, async connectionInfo => {
        emit('connect', connectionInfo);
      });
    }
  },
});

if (shouldInjectProvider()) {
  announceProvider({
    info: {
      icon: RAINBOW_ICON_RAW_SVG,
      name: 'Rainbow',
      rdns: 'me.rainbow',
      uuid: uuid4(),
    },
    provider: rainbowProvider as EIP1193Provider,
  });

  messenger.reply(
    'rainbow_ethereumChainEvent',
    async ({
      chainId,
      chainName,
      status,
      extensionUrl,
      host,
    }: {
      chainId: ChainId;
      chainName?: string;
      status: IN_DAPP_NOTIFICATION_STATUS;
      extensionUrl: string;
      host: string;
    }) => {
      if (getDappHost(window.location.href) === host) {
        alert('Should inject notification ' + JSON.stringify({ chainId, chainName, status, extensionUrl }));
        // injectNotificationIframe({ chainId, chainName, status, extensionUrl });
      }
    }
  );

  messenger.reply('rainbow_reload', async () => {
    window.location.reload();
  });

  Object.defineProperties(window, {
    rainbow: {
      value: rainbowProvider,
      configurable: false,
      writable: false,
    },
    ethereum: {
      get() {
        return window.walletRouter.currentProvider;
      },
      set(newProvider) {
        window.walletRouter.addProvider(newProvider);
      },
      configurable: false,
    },
    walletRouter: {
      value: {
        rainbowProvider,
        lastInjectedProvider: window.ethereum,
        currentProvider: rainbowProvider,
        providers: [rainbowProvider, ...(window.ethereum ? [window.ethereum] : [])],
        setDefaultProvider(rainbowAsDefault: boolean) {
          if (rainbowAsDefault) {
            window.walletRouter.currentProvider = window.rainbow;
          } else {
            const nonDefaultProvider = window.walletRouter.lastInjectedProvider ?? (window.ethereum as Ethereum);
            window.walletRouter.currentProvider = nonDefaultProvider;
          }
        },
        addProvider(provider: RainbowProvider | Ethereum) {
          if (!window.walletRouter.providers.includes(provider)) {
            window.walletRouter.providers.push(provider);
          }
          if (rainbowProvider !== provider) {
            window.walletRouter.lastInjectedProvider = provider;
          }
        },
      },
      configurable: false,
      writable: false,
    },
  });

  // defining `providers` on rainbowProvider, since it's undefined on the object itself
  window.rainbow.providers = window.walletRouter.providers;

  window.dispatchEvent(new Event('ethereum#initialized'));

  messenger.reply('rainbow_setDefaultProvider', async ({ rainbowAsDefault }: { rainbowAsDefault: boolean }) => {
    window.walletRouter.setDefaultProvider(rainbowAsDefault);
  });
}
