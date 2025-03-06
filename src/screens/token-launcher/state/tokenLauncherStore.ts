import { abbreviateNumber, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { DEFAULT_CHAIN_ID, DEFAULT_TOTAL_SUPPLY, TARGET_MARKET_CAP_IN_USD } from '../constants';
import { makeMutable, SharedValue, withTiming } from 'react-native-reanimated';
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
import { TokenLauncher } from '@/hooks/useTokenLauncher';
import { LaunchTokenResponse } from '@rainbow-me/token-launcher';
import { Alert } from 'react-native';
import { logger, RainbowError } from '@/logger';
// TODO: same as colors.alpha, move to a helper file
export const getAlphaColor = memoFn((color: string, alpha = 1) => `rgba(${chroma(color).rgb()},${alpha})`);

export type LinkType = 'website' | 'x' | 'telegram' | 'farcaster' | 'discord' | 'other';
export type Link = { input: string; type: LinkType; url: string };

type Step = 'info' | 'review' | 'creating' | 'success';

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
  step: Step;
  stepIndex: SharedValue<number>;
  stepSharedValue: SharedValue<string>;
  chainNativeAssetUsdPrice: number;
  chainNativeAssetNativePrice: number;
  gasSpeed: GasSpeed;
  hasSufficientChainNativeAssetForTransactionGas: boolean;
  hasValidPrebuyAmount: boolean;
  // derived state
  formattedTotalSupply: () => string;
  validAirdropRecipients: () => AirdropRecipient[];
  validLinks: () => Link[];
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
  setChainId: (chainId: number) => void;
  setTotalSupply: (totalSupply: number) => void;
  addLink: (type: LinkType) => void;
  editLink: ({ index, input, url }: { index: number; input: string; url: string }) => void;
  deleteLink: (index: number) => void;
  setExtraBuyAmount: (amount: number) => void;
  setDescription: (description: string) => void;
  setStep: (step: Step) => void;
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
  setGasSpeed: (gasSpeed: GasSpeed) => void;
  setHasValidPrebuyAmount: (hasValidPrebuyAmount: boolean) => void;
  setHasSufficientChainNativeAssetForTransactionGas: (hasSufficientChainNativeAssetForTransactionGas: boolean) => void; // actions
  reset: () => void;
  createToken: ({
    wallet,
    transactionOptions,
  }: {
    wallet: Wallet;
    transactionOptions: TransactionOptions;
  }) => Promise<LaunchTokenResponse | undefined>;
}

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
  // TODO: align this name with other names for this
  extraBuyAmount: 0,
  chainNativeAssetUsdPrice: 0,
  chainNativeAssetNativePrice: 0,
  step: 'info' as const,
  stepIndex: makeMutable(0),
  stepSharedValue: makeMutable('info'),
  gasSpeed: GasSpeed.FAST,
  hasSufficientChainNativeAssetForTransactionGas: true,
  hasValidPrebuyAmount: true,
  // derived state
  formattedTotalSupply: () => abbreviateNumber(get().totalSupply, 2, 'long', true),
  validAirdropRecipients: () => get().airdropRecipients.filter(recipient => recipient.isValid),
  validLinks: () => get().links.filter(link => !validateLinkWorklet({ link: link.input, type: link.type })),
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
    const { airdropRecipients, links, hasCompletedRequiredFields, hasSufficientChainNativeAssetForTransactionGas, hasValidPrebuyAmount } =
      get();

    // Empty address inputs do not prevent continuing, they are just ignored
    const allAirdropRecipientsValid = airdropRecipients.every(recipient => recipient.isValid || recipient.value === '');
    const allLinksValid = links.every(link => !validateLinkWorklet({ link: link.input, type: link.type }));

    return (
      hasCompletedRequiredFields() &&
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
  setStep: (step: Step) => {
    let newIndex = 0;
    if (step === 'info') newIndex = 0;
    else if (step === 'review') newIndex = 1;
    else if (step === 'creating') newIndex = 2;
    else if (step === 'success') newIndex = 3;

    // TODO:
    get().stepIndex.value = withTiming(newIndex, TIMING_CONFIGS.slowFadeConfig);
    get().stepSharedValue.value = step;
    set({ step });
  },
  addAirdropGroup: ({ groupId, label, count, imageUrl }: { groupId: string; label: string; count: number; imageUrl: string }) => {
    // TODO: the imageUrl will come from the backend when integrated
    const recipient = {
      type: 'group' as const,
      id: Math.random().toString(),
      value: groupId,
      label,
      count,
      isValid: true,
      imageUrl,
    };
    set({ airdropRecipients: [...get().airdropRecipients, recipient] });
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
          a.id === id ? { ...a, value: address, label: address, isValid, imageUrl: imageUrl ?? null } : a
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
    get().stepIndex.value = 0;
    get().stepSharedValue.value = 'info';
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
      hasValidPrebuyAmount: true,
      airdropRecipients: [],
      step: 'info' as const,
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
    const cohortIds = get()
      .airdropRecipients.filter(r => r.type === 'group')
      .map(recipient => recipient.value);
    const recipientAddresses = get()
      .airdropRecipients.filter(r => r.type === 'address')
      .map(recipient => recipient.value);
    const targetEth = get().tokenomics()?.price.targetEth;
    try {
      const initialTick = TokenLauncher.getInitialTick(parseUnits(targetEth?.toFixed(18) ?? '0', 18));
      const shouldBuy = get().extraBuyAmount > 0;
      const params = {
        name: get().name,
        symbol: get().symbol,
        description: get().description,
        logoUrl: get().imageUrl,
        supply: parseUnits(get().totalSupply.toString(), 18).toString(),
        links: get().links.reduce(
          (acc, link) => {
            acc[link.type] = link.url;
            return acc;
          },
          {} as Record<LinkType, string>
        ),
        amountIn: parseUnits(get().extraBuyAmount.toString(), 'ether').toString(),
        initialTick,
        wallet,
        transactionOptions: {
          gasLimit: transactionOptions.gasLimit,
          maxFeePerGas: transactionOptions.maxFeePerGas,
          maxPriorityFeePerGas: transactionOptions.maxPriorityFeePerGas,
        },
        airdropMetadata: {
          cohortIds,
          addresses: recipientAddresses,
        },
      };
      if (shouldBuy) {
        return await TokenLauncher.launchTokenAndBuy({
          ...params,
          amountIn: parseUnits(get().extraBuyAmount.toString(), 18).toString(),
        });
      } else {
        return await TokenLauncher.launchToken(params);
      }
    } catch (e: any) {
      console.error('error creating token', e);
      Alert.alert(`${(e as Error).message}`);
      logger.error(new RainbowError('[TokenLauncher]: Error launching token'), {
        message: (e as Error).message,
      });
    }
  },
}));
