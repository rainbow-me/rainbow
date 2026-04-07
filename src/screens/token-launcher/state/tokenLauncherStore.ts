import { abbreviateNumber, convertAmountToNativeDisplay, convertNumberToString } from '@/helpers/utilities';
import { trimTrailingZeros, truncateToDecimals } from '@/framework/core/safeMath';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { DEFAULT_CHAIN_ID, DEFAULT_TOTAL_SUPPLY, MAX_TOTAL_SUPPLY } from '../constants';
import { makeMutable, runOnUI, type SharedValue, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { calculateTokenomics } from '../helpers/calculateTokenomics';
import store from '@/redux/store';
import { type Network } from '@/state/backendNetworks/types';
import { formatCurrency } from '@/helpers/strings';
import {
  formatLinkInputToUrl,
  validateLinkWorklet,
  validateNameWorklet,
  validateSymbolWorklet,
  validateTotalSupplyWorklet,
} from '../helpers/inputValidators';
import * as i18n from '@/languages';
import { TokenLauncherSDK } from '@/hooks/useTokenLauncher';
import { type LaunchTokenResponse, Protocol, TokenLauncherSDKError } from '@rainbow-me/token-launcher';
import { Alert } from 'react-native';
import { logger, RainbowError } from '@/logger';
import { analytics } from '@/analytics';
import { IS_INTERNAL } from '@/env';
import { type Link, type LinkType } from '../types';
import { useSuperTokenStore } from './rainbowSuperTokenStore';
import { calculateAndCacheDominantColor } from '@/hooks/usePersistentDominantColorFromImage';
import { addNewTransaction } from '@/state/pendingTransactions';
import { type NewTransaction, TransactionStatus } from '@/entities/transactions/transaction';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getUniqueId } from '@/utils/ethereumUtils';
import { type ParsedAsset } from '@/resources/assets/types';
import { tokenLaunchErrorToErrorMessage } from '../helpers/tokenLaunchErrorToErrorMessage';
import { parseEther, type Account, type Chain, type PublicClient, type Transport, type WalletClient } from 'viem';

// TODO: Remove this — temporary option for testing
const REQUIRE_TOKEN_LOGO = !IS_INTERNAL;

export const enum NavigationSteps {
  INFO = 0,
  REVIEW = 1,
  CREATING = 2,
  SUCCESS = 3,
}

const NavigationStepsNames: Record<NavigationSteps, string> = {
  [NavigationSteps.INFO]: 'INFO',
  [NavigationSteps.REVIEW]: 'REVIEW',
  [NavigationSteps.CREATING]: 'CREATING',
  [NavigationSteps.SUCCESS]: 'SUCCESS',
};

export type TokenLauncherAnalyticsParams = {
  address?: string;
  chainId: number;
  imageModerated: boolean | undefined;
  symbol: string | undefined;
  name: string | undefined;
  logoUrl: string | undefined;
  description: string | undefined;
  totalSupply: number;
  links: Record<string, string>;
  extraBuyAmount: number;
};

interface TokenLauncherStore {
  imageUri: string;
  imageUrl: string;
  name: string;
  symbol: string;
  chainId: number;
  totalSupply: number;
  description: string;
  links: Link[];
  extraBuyAmount: number;
  step: NavigationSteps;
  stepSharedValue: SharedValue<NavigationSteps>;
  stepAnimatedSharedValue: SharedValue<NavigationSteps>;
  chainNativeAssetUsdPrice: number;
  chainNativeAssetNativePrice: number;
  chainNativeAssetRequiredForTransactionGas: string;
  hasSufficientChainNativeAssetForTransactionGas: boolean;
  hasValidPrebuyAmount: boolean;
  launchedTokenAddress: string | null;
  imageModerated: boolean;
  hasEnteredAnyInfo: () => boolean;
  formattedTotalSupply: () => string;
  validLinks: () => Link[];
  linkUrlsByType: () => Record<LinkType, string>;
  tokenPrice: () => string;
  tokenMarketCap: () => string;
  hasCompletedRequiredFields: () => boolean;
  canContinueToReview: () => boolean;
  tokenomics: () => ReturnType<typeof calculateTokenomics> | undefined;
  getAnalyticsParams: () => TokenLauncherAnalyticsParams;
  setImageUri: (uri: string) => void;
  setImageUrl: (url: string) => void;
  setName: (name: string) => void;
  setSymbol: (symbol: string) => void;
  setChainId: (chainId: number) => void;
  setTotalSupply: (totalSupply: number) => void;
  addLink: (type: LinkType) => void;
  editLink: ({ index, input }: { index: number; input: string }) => void;
  deleteLink: (index: number) => void;
  setExtraBuyAmount: (amount: number) => void;
  setDescription: (description: string) => void;
  setStep: (step: NavigationSteps) => void;
  setImageModerated: (moderated: boolean) => void;
  setChainNativeAssetUsdPrice: (chainNativeAssetUsdPrice: number) => void;
  setChainNativeAssetNativePrice: (chainNativeAssetNativePrice: number) => void;
  setChainNativeAssetRequiredForTransactionGas: (chainNativeAssetRequiredForTransactionGas: string) => void;
  setHasValidPrebuyAmount: (hasValidPrebuyAmount: boolean) => void;
  setHasSufficientChainNativeAssetForTransactionGas: (hasSufficientChainNativeAssetForTransactionGas: boolean) => void;
  reset: () => void;
  createToken: ({
    walletClient,
    publicClient,
    accountAddress,
  }: {
    walletClient: WalletClient<Transport, Chain, Account>;
    publicClient: PublicClient<Transport, Chain>;
    accountAddress: string;
  }) => Promise<LaunchTokenResponse | undefined>;
}

// For testing. Makes it easier to test the token creation flow without having to enter all the info.
// const testTokenInfo = {
// // Gray image
// imageUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1741722824/token-launcher/tokens/fjcou8ceqmxbg9ncoduy.jpg',
// imageUri: 'https://rainbowme-res.cloudinary.com/image/upload/v1741722824/token-launcher/tokens/fjcou8ceqmxbg9ncoduy.jpg',
// //bright image
// //imageUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1740085064/token-launcher/tokens/qa1okeas3qkofjdbbrgr.jpg',
// // imageUri: 'https://rainbowme-res.cloudinary.com/image/upload/v1740085064/token-launcher/tokens/qa1okeas3qkofjdbbrgr.jpg',
// name: 'Test Token',
// symbol: 'TEST',
// description: 'This is a test token',
// };

const INITIAL_STEP = NavigationSteps.INFO;

export const useTokenLauncherStore = createRainbowStore<TokenLauncherStore>((set, get) => ({
  imageUri: '',
  imageUrl: '',
  name: '',
  symbol: '',
  description: '',
  links: [{ input: '', type: 'website' as LinkType }],
  chainId: DEFAULT_CHAIN_ID,
  totalSupply: DEFAULT_TOTAL_SUPPLY,
  extraBuyAmount: 0,
  chainNativeAssetUsdPrice: 0,
  chainNativeAssetNativePrice: 0,
  step: INITIAL_STEP,
  stepSharedValue: makeMutable(INITIAL_STEP as NavigationSteps),
  stepAnimatedSharedValue: makeMutable(INITIAL_STEP as NavigationSteps),
  chainNativeAssetRequiredForTransactionGas: '0',
  hasSufficientChainNativeAssetForTransactionGas: true,
  hasValidPrebuyAmount: true,
  launchedTokenAddress: null,
  imageModerated: false,
  hasEnteredAnyInfo: () => {
    const { name, symbol, imageUrl, totalSupply, description, extraBuyAmount, validLinks } = get();
    return (
      name !== '' ||
      symbol !== '' ||
      imageUrl !== '' ||
      totalSupply !== DEFAULT_TOTAL_SUPPLY ||
      description !== '' ||
      validLinks().length > 0 ||
      extraBuyAmount > 0
    );
  },
  formattedTotalSupply: () => abbreviateNumber(get().totalSupply, 2, 'long', true),
  validLinks: () =>
    get()
      .links.filter(link => link.input.trim() !== '')
      .filter(link => !validateLinkWorklet({ link: link.input, type: link.type })),
  linkUrlsByType: () =>
    get()
      .validLinks()
      .reduce(
        (acc, link) => {
          acc[link.type] = formatLinkInputToUrl({ input: link.input, linkType: link.type });
          return acc;
        },
        {} as Record<LinkType, string>
      ),
  tokenPrice: () => {
    const { nativeCurrency } = store.getState().settings;
    const tokenomics = get().tokenomics();

    const actualPriceEth = tokenomics?.price.actualEth;
    const chainNativeAssetNativePrice = get().chainNativeAssetNativePrice;

    const actualPriceNative = actualPriceEth && chainNativeAssetNativePrice ? actualPriceEth * chainNativeAssetNativePrice : 0;

    return formatCurrency(actualPriceNative, {
      currency: nativeCurrency,
    });
  },
  tokenMarketCap: () => {
    const { nativeCurrency } = store.getState().settings;
    const tokenomics = get().tokenomics();

    const actualMarketCapEth = tokenomics?.marketCap.actualEth;
    const chainNativeAssetNativePrice = get().chainNativeAssetNativePrice;

    const actualMarketCapNative = actualMarketCapEth && chainNativeAssetNativePrice ? actualMarketCapEth * chainNativeAssetNativePrice : 0;

    return convertAmountToNativeDisplay(actualMarketCapNative, nativeCurrency, 2, true, true);
  },
  hasCompletedRequiredFields: () => {
    const { name, symbol, imageUrl, totalSupply } = get();

    const nameValidation = validateNameWorklet(name);
    const symbolValidation = validateSymbolWorklet(symbol);
    const supplyValidation = validateTotalSupplyWorklet(totalSupply);

    return !nameValidation?.error && !symbolValidation?.error && !supplyValidation?.error && (!REQUIRE_TOKEN_LOGO || imageUrl !== '');
  },
  canContinueToReview: () => {
    const { links, hasCompletedRequiredFields, hasSufficientChainNativeAssetForTransactionGas, hasValidPrebuyAmount } = get();
    const allLinksValid = links.every(link => !validateLinkWorklet({ link: link.input, type: link.type }));

    return hasCompletedRequiredFields() && allLinksValid && hasSufficientChainNativeAssetForTransactionGas && hasValidPrebuyAmount;
  },
  tokenomics: () => {
    const { chainNativeAssetUsdPrice, totalSupply, extraBuyAmount } = get();
    if (!chainNativeAssetUsdPrice || totalSupply > MAX_TOTAL_SUPPLY) return;

    return calculateTokenomics({
      totalSupply,
      // TODO: name change
      ethPriceUsd: chainNativeAssetUsdPrice,
      // TODO: name change
      amountInEth: extraBuyAmount,
    });
  },
  getAnalyticsParams: () => {
    const { name, chainId, symbol, description, imageUrl, totalSupply, extraBuyAmount, imageModerated } = get();
    const linksByType = get().linkUrlsByType();

    return {
      chainId,
      symbol: symbol === '' ? undefined : symbol,
      name: name === '' ? undefined : name,
      logoUrl: imageUrl === '' ? undefined : imageUrl,
      description: description === '' ? undefined : description,
      totalSupply,
      links: linksByType,
      extraBuyAmount,
      imageModerated: imageUrl === '' ? undefined : imageModerated,
    };
  },
  setImageUri: (uri: string) => {
    set({ imageUri: uri });
  },
  setImageUrl: async (url: string) => {
    set({
      imageUrl: url,
    });
  },
  setName: (name: string) => set({ name }),
  setSymbol: (symbol: string) => set({ symbol }),
  setDescription: (description: string) => set({ description }),
  setChainId: (chainId: number) => set({ chainId }),
  setTotalSupply: (totalSupply: number) => set({ totalSupply }),
  addLink: (type: LinkType) => {
    set({ links: [...get().links, { input: '', type }] });
  },
  editLink: ({ index, input }: { index: number; input: string }) => {
    set({ links: get().links.map((link, i) => (i === index ? { ...link, input: input.trim() } : link)) });
  },
  deleteLink: (index: number) => {
    set({ links: get().links.filter((_, i) => i !== index) });
  },
  setExtraBuyAmount: (amount: number) => {
    const normalizedAmount = Number(trimTrailingZeros(truncateToDecimals(convertNumberToString(amount), 7)));
    set({ extraBuyAmount: normalizedAmount });
  },
  setStep: (step: NavigationSteps) => {
    const { stepSharedValue, stepAnimatedSharedValue } = get();
    runOnUI(() => {
      stepAnimatedSharedValue.value = withTiming(step, TIMING_CONFIGS.slowFadeConfig);
      stepSharedValue.value = step;
    })();
    set({ step });
    analytics.track(analytics.event.tokenLauncherStepChanged, {
      step: NavigationStepsNames[step],
    });
  },
  setChainNativeAssetRequiredForTransactionGas: (chainNativeAssetRequiredForTransactionGas: string) => {
    set({ chainNativeAssetRequiredForTransactionGas });
  },
  setChainNativeAssetUsdPrice: (chainNativeAssetUsdPrice: number) => {
    set({ chainNativeAssetUsdPrice });
  },
  setChainNativeAssetNativePrice: (chainNativeAssetNativePrice: number) => {
    set({ chainNativeAssetNativePrice });
  },
  setHasValidPrebuyAmount: (hasValidPrebuyAmount: boolean) => {
    set({ hasValidPrebuyAmount });
  },
  setHasSufficientChainNativeAssetForTransactionGas: (hasSufficientChainNativeAssetForTransactionGas: boolean) => {
    set({ hasSufficientChainNativeAssetForTransactionGas });
  },
  setImageModerated: (moderated: boolean) => {
    set({ imageModerated: moderated });
  },
  reset: () => {
    get().stepAnimatedSharedValue.value = NavigationSteps.INFO;
    get().stepSharedValue.value = NavigationSteps.INFO;
    set({
      imageUri: '',
      imageUrl: '',
      name: '',
      symbol: '',
      description: '',
      links: [{ input: '', type: 'website' }],
      extraBuyAmount: 0,
      chainNativeAssetUsdPrice: 0,
      chainNativeAssetNativePrice: 0,
      hasSufficientChainNativeAssetForTransactionGas: true,
      chainNativeAssetRequiredForTransactionGas: '0',
      hasValidPrebuyAmount: true,
      step: NavigationSteps.INFO,
      chainId: DEFAULT_CHAIN_ID,
      totalSupply: DEFAULT_TOTAL_SUPPLY,
    });
  },
  createToken: async ({
    walletClient,
    publicClient,
    accountAddress,
  }: {
    walletClient: WalletClient<Transport, Chain, Account>;
    publicClient: PublicClient<Transport, Chain>;
    accountAddress: string;
  }): Promise<LaunchTokenResponse | undefined> => {
    const { name, chainId, symbol, description, imageUrl, extraBuyAmount, getAnalyticsParams } = get();
    const analyticsParams = getAnalyticsParams();
    const linksByType = get().linkUrlsByType();

    try {
      const params = {
        protocol: Protocol.Liquid,
        name,
        symbol,
        walletClient,
        publicClient,
        ...(description ? { description } : {}),
        ...(imageUrl ? { logoUrl: imageUrl } : {}),
        ...(Object.keys(linksByType).length ? { links: linksByType } : {}),
        ...(extraBuyAmount > 0 ? { amountIn: parseEther(truncateToDecimals(convertNumberToString(extraBuyAmount), 18)).toString() } : {}),
      };
      const result = await TokenLauncherSDK.launchToken(params);

      if (result) {
        set({ launchedTokenAddress: result.tokenAddress });

        const color = await calculateAndCacheDominantColor(imageUrl);

        useSuperTokenStore.getState().addSuperToken({
          name,
          symbol,
          address: result.tokenAddress,
          chainId,
          description,
          imageUrl,
          links: linksByType,
          color,
          transactionHash: result.txHash,
        });

        analytics.track(analytics.event.tokenLauncherTokenCreated, {
          address: result.tokenAddress,
          ...analyticsParams,
        });

        const chainsName = useBackendNetworksStore.getState().getChainsName();

        const tx = await publicClient.getTransaction({ hash: result.txHash });

        const transaction: NewTransaction = {
          status: TransactionStatus.pending,
          chainId,
          asset: {
            address: result.tokenAddress,
            decimals: 18,
            name,
            symbol,
            chainId,
            color,
            icon_url: imageUrl,
            uniqueId: getUniqueId(result.tokenAddress, chainId),
            isNativeAsset: false,
            network: chainsName[chainId],
          } satisfies ParsedAsset,
          data: tx.input,
          from: tx.from,
          gasLimit: tx.gas?.toString(),
          hash: result.txHash,
          network: chainsName[chainId] as Network,
          nonce: tx.nonce,
          to: tx.to ?? null,
          value: tx.value.toString(),
          type: 'launch',
          gasPrice: tx.gasPrice?.toString(),
          maxFeePerGas: tx.maxFeePerGas?.toString(),
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
        };

        addNewTransaction({
          transaction,
          address: accountAddress,
          chainId,
        });
      }
      return result;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      let metadata = {
        message: error.message,
      };

      if (error instanceof TokenLauncherSDKError) {
        metadata = { ...metadata, ...error.context };
        const { header, body } = tokenLaunchErrorToErrorMessage(error);
        Alert.alert(header, body);
      } else {
        Alert.alert(i18n.t(i18n.l.token_launcher.errors.header), i18n.t(i18n.l.token_launcher.errors.unknown_error));
      }

      analytics.track(analytics.event.tokenLauncherCreationFailed, {
        ...analyticsParams,
        error: error.message,
        operation: 'operation' in metadata ? (metadata.operation as string) : undefined,
        source: 'source' in metadata ? (metadata.source as string) : undefined,
        transactionHash: 'transactionHash' in metadata ? (metadata.transactionHash as string) : undefined,
      });

      logger.error(new RainbowError('[TokenLauncher]: Error launching token'), metadata);
    }
  },
}));
