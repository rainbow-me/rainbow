import { abbreviateNumber, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { DEFAULT_CHAIN_ID, DEFAULT_MAX_AIRDROP_RECIPIENTS, DEFAULT_TOTAL_SUPPLY, TARGET_MARKET_CAP_IN_USD } from '../constants';
import { makeMutable, runOnUI, SharedValue, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import chroma from 'chroma-js';
import { memoFn } from '@/utils/memoFn';
import { calculateTokenomics } from '../helpers/calculateTokenomics';
import store from '@/redux/store';
import { GasSpeed } from '@/__swaps__/types/gas';
import { formatCurrency } from '@/helpers/strings';
import { validateLinkWorklet, validateNameWorklet, validateSymbolWorklet, validateTotalSupplyWorklet } from '../helpers/inputValidators';
import { Wallet } from '@ethersproject/wallet';
import { parseUnits } from '@ethersproject/units';
import { TransactionOptions } from '@rainbow-me/swaps';
import { TokenLauncherSDK } from '@/hooks/useTokenLauncher';
import { LaunchTokenResponse, TokenLauncherSDKError } from '@rainbow-me/token-launcher';
import { Alert } from 'react-native';
import { logger, RainbowError } from '@/logger';
import { analyticsV2 } from '@/analytics';
// TODO: same as colors.alpha, move to a helper file
export const getAlphaColor = memoFn((color: string, alpha = 1) => `rgba(${chroma(color).rgb()},${alpha})`);

export type LinkType = 'website' | 'x' | 'telegram' | 'farcaster' | 'discord' | 'other';
export type Link = { input: string; type: LinkType; url: string };

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

export type AirdropRecipient = {
  type: 'group' | 'address';
  id: string;
  label: string;
  value: string;
  count: number;
  isValid: boolean;
  imageUrl: string | null;
  isSuggested?: boolean;
};

interface TokenLauncherStore {
  // base state
  imageUri: string;
  imageUrl: string;
  name: string;
  symbol: string;
  chainId: number;
  totalSupply: number;
  description: string;
  links: Link[];
  extraBuyAmount: number;
  airdropRecipients: AirdropRecipient[];
  step: NavigationSteps;
  stepSharedValue: SharedValue<NavigationSteps>;
  stepAnimatedSharedValue: SharedValue<NavigationSteps>;
  chainNativeAssetUsdPrice: number;
  chainNativeAssetNativePrice: number;
  gasSpeed: GasSpeed;
  chainNativeAssetRequiredForTransactionGas: string;
  hasSufficientChainNativeAssetForTransactionGas: boolean;
  hasValidPrebuyAmount: boolean;
  maxAirdropRecipientCount: number;
  launchedTokenAddress: string | null;
  // derived state
  hasEnteredAnyInfo: () => boolean;
  formattedTotalSupply: () => string;
  validAirdropRecipients: () => AirdropRecipient[];
  validLinks: () => Link[];
  hasExceededMaxAirdropRecipients: () => boolean;
  tokenPrice: () => string;
  tokenMarketCap: () => string;
  hasCompletedRequiredFields: () => boolean;
  canContinueToReview: () => boolean;
  allocationBips: () => {
    creator: number;
    airdrop: number;
    lp: number;
  };
  tokenomics: () => ReturnType<typeof calculateTokenomics> | undefined;
  // setters
  setImageUri: (uri: string) => void;
  setImageUrl: (url: string) => void;
  setName: (name: string) => void;
  setSymbol: (symbol: string) => void;
  setMaxAirdropRecipientCount: (count: number) => void;
  setChainId: (chainId: number) => void;
  setTotalSupply: (totalSupply: number) => void;
  addLink: (type: LinkType) => void;
  editLink: ({ index, input, url }: { index: number; input: string; url: string }) => void;
  deleteLink: (index: number) => void;
  setExtraBuyAmount: (amount: number) => void;
  setDescription: (description: string) => void;
  setStep: (step: NavigationSteps) => void;
  addAirdropGroup: ({ groupId, label, count, imageUrl }: { groupId: string; label: string; count: number; imageUrl: string }) => void;
  addOrEditAirdropAddress: ({
    id,
    address,
    isValid,
    imageUrl,
    isSuggested,
    label,
  }: {
    id: string;
    address: string;
    isValid: boolean;
    imageUrl?: string | null;
    isSuggested?: boolean;
    label?: string;
  }) => void;
  deleteAirdropRecipient: (id: string) => void;
  setChainNativeAssetUsdPrice: (chainNativeAssetUsdPrice: number) => void;
  setChainNativeAssetNativePrice: (chainNativeAssetNativePrice: number) => void;
  setChainNativeAssetRequiredForTransactionGas: (chainNativeAssetRequiredForTransactionGas: string) => void;
  setGasSpeed: (gasSpeed: GasSpeed) => void;
  setHasValidPrebuyAmount: (hasValidPrebuyAmount: boolean) => void;
  setHasSufficientChainNativeAssetForTransactionGas: (hasSufficientChainNativeAssetForTransactionGas: boolean) => void;
  reset: () => void;
  createToken: ({
    wallet,
    transactionOptions,
  }: {
    wallet: Wallet;
    transactionOptions: TransactionOptions;
  }) => Promise<LaunchTokenResponse | undefined>;
}

// TODO: for testing. Remove before final merge
// const testTokenInfo = {
//   imageUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1740085064/token-launcher/tokens/qa1okeas3qkofjdbbrgr.jpg',
//   imageUri: 'https://rainbowme-res.cloudinary.com/image/upload/v1740085064/token-launcher/tokens/qa1okeas3qkofjdbbrgr.jpg',
//   name: 'Test Token',
//   symbol: 'TEST',
//   description: 'This is a test token',
// };

export const useTokenLauncherStore = createRainbowStore<TokenLauncherStore>((set, get) => ({
  imageUri: '',
  imageUrl: '',
  name: '',
  symbol: '',
  description: '',
  airdropRecipients: [],
  chainId: DEFAULT_CHAIN_ID,
  totalSupply: DEFAULT_TOTAL_SUPPLY,
  links: [{ input: '', type: 'website', url: '' }],
  extraBuyAmount: 0,
  chainNativeAssetUsdPrice: 0,
  chainNativeAssetNativePrice: 0,
  step: NavigationSteps.INFO,
  stepSharedValue: makeMutable(NavigationSteps.INFO as NavigationSteps),
  stepAnimatedSharedValue: makeMutable(NavigationSteps.INFO as NavigationSteps),
  gasSpeed: GasSpeed.FAST,
  chainNativeAssetRequiredForTransactionGas: '0',
  hasSufficientChainNativeAssetForTransactionGas: true,
  hasValidPrebuyAmount: true,
  maxAirdropRecipientCount: DEFAULT_MAX_AIRDROP_RECIPIENTS,
  launchedTokenAddress: null,
  // derived state
  hasEnteredAnyInfo: () => {
    const { name, symbol, imageUrl, totalSupply, description, extraBuyAmount, validLinks, validAirdropRecipients } = get();
    return (
      name !== '' ||
      symbol !== '' ||
      imageUrl !== '' ||
      totalSupply !== DEFAULT_TOTAL_SUPPLY ||
      description !== '' ||
      validLinks().length > 1 ||
      validAirdropRecipients().length > 0 ||
      extraBuyAmount > 0
    );
  },
  formattedTotalSupply: () => abbreviateNumber(get().totalSupply, 2, 'long', true),
  validAirdropRecipients: () => get().airdropRecipients.filter(recipient => recipient.isValid),
  validLinks: () => get().links.filter(link => !validateLinkWorklet({ link: link.input, type: link.type })),
  hasExceededMaxAirdropRecipients: () => {
    const { maxAirdropRecipientCount, airdropRecipients } = get();
    const totalRecipientCount = airdropRecipients.reduce((acc, recipient) => acc + recipient.count, 0);
    return totalRecipientCount > maxAirdropRecipientCount;
  },
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

    return !nameValidation?.error && !symbolValidation?.error && !supplyValidation?.error && imageUrl !== '';
  },
  canContinueToReview: () => {
    const {
      airdropRecipients,
      links,
      hasCompletedRequiredFields,
      hasExceededMaxAirdropRecipients,
      hasSufficientChainNativeAssetForTransactionGas,
      hasValidPrebuyAmount,
    } = get();

    // Empty address inputs do not prevent continuing, they are just ignored
    const allAirdropRecipientsValid = airdropRecipients.every(recipient => recipient.isValid || recipient.value === '');
    const allLinksValid = links.every(link => !validateLinkWorklet({ link: link.input, type: link.type }));

    return (
      hasCompletedRequiredFields() &&
      !hasExceededMaxAirdropRecipients() &&
      allAirdropRecipientsValid &&
      allLinksValid &&
      hasSufficientChainNativeAssetForTransactionGas &&
      hasValidPrebuyAmount
    );
  },
  allocationBips: () => {
    const tokenomics = get().tokenomics();
    return {
      creator: tokenomics?.allocation.creator ?? 0,
      airdrop: tokenomics?.allocation.airdrop ?? 0,
      lp: tokenomics?.allocation.lp ?? 0,
    };
  },
  tokenomics: () => {
    const { chainNativeAssetUsdPrice, validAirdropRecipients, totalSupply, extraBuyAmount } = get();
    if (!chainNativeAssetUsdPrice) return;

    return calculateTokenomics({
      targetMarketCapUsd: TARGET_MARKET_CAP_IN_USD,
      totalSupply,
      // TODO: name change
      ethPriceUsd: chainNativeAssetUsdPrice,
      hasAirdrop: validAirdropRecipients().length > 0,
      // TODO: name change
      amountInEth: extraBuyAmount,
    });
  },
  // setters
  setImageUri: (uri: string) => {
    set({ imageUri: uri });
  },
  setImageUrl: async (url: string) => {
    set({
      imageUrl: url,
    });
  },
  setMaxAirdropRecipientCount: (count: number) => {
    set({ maxAirdropRecipientCount: count });
  },
  setName: (name: string) => set({ name }),
  setSymbol: (symbol: string) => set({ symbol }),
  setDescription: (description: string) => set({ description }),
  setChainId: (chainId: number) => set({ chainId }),
  setTotalSupply: (totalSupply: number) => set({ totalSupply }),
  addLink: (type: LinkType) => {
    set({ links: [...get().links, { input: '', type, url: '' }] });
  },
  editLink: ({ index, input, url }: { index: number; input: string; url: string }) => {
    set({ links: get().links.map((link, i) => (i === index ? { ...link, input, url } : link)) });
  },
  deleteLink: (index: number) => {
    set({ links: get().links.filter((_, i) => i !== index) });
  },
  setExtraBuyAmount: (amount: number) => {
    set({ extraBuyAmount: amount });
  },
  setStep: (step: NavigationSteps) => {
    const { stepSharedValue, stepAnimatedSharedValue } = get();
    runOnUI(() => {
      stepAnimatedSharedValue.value = withTiming(step, TIMING_CONFIGS.slowFadeConfig);
      stepSharedValue.value = step;
    })();
    set({ step });
    analyticsV2.track(analyticsV2.event.tokenLauncherStepChanged, {
      step: NavigationStepsNames[step],
    });
  },
  addAirdropGroup: ({ groupId, label, count, imageUrl }: { groupId: string; label: string; count: number; imageUrl: string }) => {
    const { airdropRecipients } = get();
    const existingGroups = airdropRecipients.filter(recipient => recipient.type === 'group');
    const existingGroup = existingGroups.find(group => group.value === groupId);
    // You cannot add the same group twice
    if (existingGroup) {
      return;
    }
    const recipient = {
      type: 'group' as const,
      id: Math.random().toString(),
      value: groupId,
      label,
      count,
      isValid: true,
      imageUrl,
    };
    set({ airdropRecipients: [...airdropRecipients, recipient] });
  },
  // Add & edit are combined here to avoid the AddressInput component needing to subscribe to the list
  addOrEditAirdropAddress: ({
    id,
    address,
    isValid,
    imageUrl,
    isSuggested,
    label,
  }: {
    id: string;
    address: string;
    isValid: boolean;
    imageUrl?: string | null;
    isSuggested?: boolean;
    label?: string;
  }) => {
    const { airdropRecipients } = get();
    const isExistingRecipient = airdropRecipients.some(recipient => recipient.id === id);

    if (isExistingRecipient) {
      set({
        airdropRecipients: airdropRecipients.map(a =>
          a.id === id ? { ...a, value: address, label: label ?? address, isValid, imageUrl: imageUrl ?? null } : a
        ),
      });
    } else {
      const recipient = {
        type: 'address' as const,
        id,
        value: address,
        label: label ?? address,
        count: 1,
        isValid,
        imageUrl: imageUrl ?? null,
        isSuggested,
      };
      set({ airdropRecipients: [...airdropRecipients, recipient] });
    }
  },
  deleteAirdropRecipient: (id: string) => {
    set({ airdropRecipients: get().airdropRecipients.filter(a => a.id !== id) });
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
  setGasSpeed: (gasSpeed: GasSpeed) => {
    set({ gasSpeed });
  },
  setHasValidPrebuyAmount: (hasValidPrebuyAmount: boolean) => {
    set({ hasValidPrebuyAmount });
  },
  setHasSufficientChainNativeAssetForTransactionGas: (hasSufficientChainNativeAssetForTransactionGas: boolean) => {
    set({ hasSufficientChainNativeAssetForTransactionGas });
  },
  // actions
  reset: () => {
    get().stepAnimatedSharedValue.value = NavigationSteps.INFO;
    get().stepSharedValue.value = NavigationSteps.INFO;
    set({
      imageUri: '',
      imageUrl: '',
      name: '',
      symbol: '',
      description: '',
      links: [{ input: '', type: 'website', url: '' }],
      extraBuyAmount: 0,
      chainNativeAssetUsdPrice: 0,
      chainNativeAssetNativePrice: 0,
      gasSpeed: GasSpeed.FAST,
      hasSufficientChainNativeAssetForTransactionGas: true,
      chainNativeAssetRequiredForTransactionGas: '0',
      hasValidPrebuyAmount: true,
      airdropRecipients: [],
      step: NavigationSteps.INFO,
      chainId: DEFAULT_CHAIN_ID,
      totalSupply: DEFAULT_TOTAL_SUPPLY,
    });
  },
  createToken: async ({
    wallet,
    transactionOptions,
  }: {
    wallet: Wallet;
    transactionOptions: TransactionOptions;
  }): Promise<LaunchTokenResponse | undefined> => {
    const { name, chainId, symbol, description, imageUrl, tokenomics, totalSupply, extraBuyAmount } = get();

    const airdropRecipients = get().validAirdropRecipients();
    const links = get().validLinks();

    const airdropCohortIds = airdropRecipients.filter(r => r.type === 'group').map(recipient => recipient.value);
    const airdropRecipientAddresses = airdropRecipients.filter(r => r.type === 'address').map(recipient => recipient.value);
    const airdropRecipientCount = airdropRecipients.reduce((acc, recipient) => acc + recipient.count, 0);

    const targetEth = tokenomics()?.price.targetEth;
    const formattedTotalSupply = parseUnits(totalSupply.toString(), 18).toString();
    const linksByType = links.reduce(
      (acc, link) => {
        acc[link.type] = link.url;
        return acc;
      },
      {} as Record<LinkType, string>
    );

    try {
      const initialTick = TokenLauncherSDK.getInitialTick(parseUnits(targetEth?.toFixed(18) ?? '0', 18));
      const params = {
        name,
        symbol,
        description,
        logoUrl: imageUrl,
        supply: formattedTotalSupply,
        links: linksByType,
        amountIn: parseUnits(extraBuyAmount.toString(), 'ether').toString(),
        initialTick,
        wallet,
        transactionOptions: {
          gasLimit: transactionOptions.gasLimit,
          maxFeePerGas: transactionOptions.maxFeePerGas,
          maxPriorityFeePerGas: transactionOptions.maxPriorityFeePerGas,
        },
        airdropMetadata: {
          cohortIds: airdropCohortIds,
          addresses: airdropRecipientAddresses,
        },
      };

      const shouldBuy = extraBuyAmount > 0;
      let result;
      if (shouldBuy) {
        result = await TokenLauncherSDK.launchTokenAndBuy({
          ...params,
          amountIn: parseUnits(extraBuyAmount.toString(), 18).toString(),
        });
      } else {
        result = await TokenLauncherSDK.launchToken(params);
      }
      if (result) {
        set({ launchedTokenAddress: result.tokenAddress });
        analyticsV2.track(analyticsV2.event.tokenLauncherTokenCreated, {
          address: result.tokenAddress,
          chainId,
          symbol,
          name,
          logoUrl: imageUrl,
          description,
          totalSupply,
          links: linksByType,
          extraBuyAmount: extraBuyAmount,
          airdropRecipientCount,
          airdropAddressCount: airdropRecipientAddresses.length,
          airdropCohortIds: airdropCohortIds,
        });
      }
      return result;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      Alert.alert(`${(error as Error).message}`);
      let metadata = {
        message: (error as Error).message,
      };
      if (error instanceof TokenLauncherSDKError) {
        metadata = { ...metadata, ...error.context };
      }
      logger.error(new RainbowError('[TokenLauncher]: Error launching token'), metadata);
    }
  },
}));
