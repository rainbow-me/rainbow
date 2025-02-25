import { abbreviateNumber, convertAmountToNativeDisplay } from '@/helpers/utilities';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { DEFAULT_CHAIN_ID, DEFAULT_TOTAL_SUPPLY, STEP_TRANSITION_DURATION, TARGET_MARKET_CAP_IN_USD } from '../constants';
import { makeMutable, SharedValue, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import chroma from 'chroma-js';
import { memoFn } from '@/utils/memoFn';
import { calculateTokenomics } from '../helpers/calculateTokenomics';
import store from '@/redux/store';
import { GasSpeed } from '@/__swaps__/types/gas';
import { formatCurrency } from '@/helpers/strings';
import { validateLinkWorklet, validateNameWorklet, validateSymbolWorklet, validateTotalSupplyWorklet } from '../helpers/inputValidators';

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
  creatorBuyInEth: number;
  airdropRecipients: AirdropRecipient[];
  step: Step;
  stepIndex: SharedValue<number>;
  stepSharedValue: SharedValue<string>;
  ethPriceUsd: number;
  ethPriceNative: number;
  gasSpeed: GasSpeed;
  hasSufficientEthForGas: boolean;
  hasValidPrebuyAmount: boolean;
  // derived state
  formattedTotalSupply: () => string;
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
  setCreatorBuyInEth: (amount: number) => void;
  setDescription: (description: string) => void;
  setStep: (step: Step) => void;
  addAirdropGroup: ({ groupId, label, count }: { groupId: string; label: string; count: number }) => void;
  addOrEditAirdropAddress: ({
    id,
    address,
    isValid,
    imageUrl,
  }: {
    id: string;
    address: string;
    isValid: boolean;
    imageUrl?: string | null;
  }) => void;
  deleteAirdropRecipient: (id: string) => void;
  setEthPriceUsd: (ethPriceUsd: number) => void;
  setEthPriceNative: (ethPriceNative: number) => void;
  setGasSpeed: (gasSpeed: GasSpeed) => void;
  setHasValidPrebuyAmount: (hasValidPrebuyAmount: boolean) => void;
  setHasSufficientEthForGas: (hasSufficientEthForGas: boolean) => void;
  // actions
  reset: () => void;
  validateForm: () => void;
  createToken: () => void;
}

// TODO: for testing. Remove before merging
const testTokenInfo = {
  imageUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1740085064/token-launcher/tokens/qa1okeas3qkofjdbbrgr.jpg',
  imageUri: 'https://rainbowme-res.cloudinary.com/image/upload/v1740085064/token-launcher/tokens/qa1okeas3qkofjdbbrgr.jpg',
  name: 'Test Token',
  symbol: 'TEST',
  description: 'This is a test token',
};

export const useTokenLauncherStore = createRainbowStore<TokenLauncherStore>((set, get) => ({
  imageUri: '',
  imageUrl: '',
  name: '',
  symbol: '',
  description: '',
  // TODO: for testing. Remove before merging
  // imageUrl: testTokenInfo.imageUrl,
  // imageUri: testTokenInfo.imageUri,
  // name: testTokenInfo.name,
  // symbol: testTokenInfo.symbol,
  // description: testTokenInfo.description,
  airdropRecipients: [],
  chainId: DEFAULT_CHAIN_ID,
  totalSupply: DEFAULT_TOTAL_SUPPLY,
  links: [
    // TODO: for testing. Remove before merging
    // { input: '', type: 'website', url: '' },
  ],
  // TODO: align this name with other names for this
  creatorBuyInEth: 0,
  ethPriceUsd: 0,
  ethPriceNative: 0,
  step: 'info' as const,
  stepIndex: makeMutable(0),
  stepSharedValue: makeMutable('info'),
  // TODO: for testing. Remove before merging
  // step: 'success' as const,
  // stepIndex: makeMutable(3),
  // stepSharedValue: makeMutable('success'),
  gasSpeed: GasSpeed.FAST,
  hasSufficientEthForGas: true,
  hasValidPrebuyAmount: true,
  // derived state
  formattedTotalSupply: () => abbreviateNumber(get().totalSupply, 0, 'long'),
  tokenPrice: () => {
    const { nativeCurrency } = store.getState().settings;
    const tokenomics = get().tokenomics();

    const actualPriceEth = tokenomics?.price.actualEth;
    const ethPriceNative = get().ethPriceNative;

    const actualPriceNative = actualPriceEth && ethPriceNative ? actualPriceEth * ethPriceNative : 0;

    return formatCurrency(actualPriceNative, {
      currency: nativeCurrency,
    });
  },
  tokenMarketCap: () => {
    const { nativeCurrency } = store.getState().settings;
    const tokenomics = get().tokenomics();

    const actualMarketCapEth = tokenomics?.marketCap.actualEth;
    const ethPriceNative = get().ethPriceNative;

    const actualMarketCapNative = actualMarketCapEth && ethPriceNative ? actualMarketCapEth * ethPriceNative : 0;

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
    const { airdropRecipients, links, hasCompletedRequiredFields, hasSufficientEthForGas, hasValidPrebuyAmount } = get();

    const allAirdropRecipientsValid = airdropRecipients.every(recipient => recipient.isValid);
    const allLinksValid = links.every(link => !validateLinkWorklet({ link: link.input, type: link.type }));

    return hasCompletedRequiredFields() && allAirdropRecipientsValid && allLinksValid && hasSufficientEthForGas && hasValidPrebuyAmount;
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
    const ethPriceUsd = get().ethPriceUsd;
    if (!ethPriceUsd) return;

    return calculateTokenomics({
      targetMarketCapUsd: TARGET_MARKET_CAP_IN_USD,
      totalSupply: get().totalSupply,
      ethPriceUsd,
      // TODO: needs to be based on the number of VALID recipients
      hasAirdrop: get().airdropRecipients.length > 0,
      amountInEth: get().creatorBuyInEth,
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
  setCreatorBuyInEth: (amount: number) => {
    set({ creatorBuyInEth: amount });
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
  addAirdropGroup: ({ groupId, label, count }: { groupId: string; label: string; count: number }) => {
    // TODO: the imageUrl will come from the backend when integrated
    const recipient = {
      type: 'group' as const,
      id: Math.random().toString(),
      value: groupId,
      label,
      count,
      isValid: true,
      imageUrl: null,
    };
    set({ airdropRecipients: [...get().airdropRecipients, recipient] });
  },
  // Add & edit are combined here to avoid the AddressInput component needing to subscribe to the list
  addOrEditAirdropAddress: ({
    id,
    address,
    isValid,
    imageUrl,
  }: {
    id: string;
    address: string;
    isValid: boolean;
    imageUrl?: string | null;
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
        label: address,
        count: 1,
        isValid,
        imageUrl: imageUrl ?? null,
      };
      set({ airdropRecipients: [...airdropRecipients, recipient] });
    }
  },
  deleteAirdropRecipient: (id: string) => {
    set({ airdropRecipients: get().airdropRecipients.filter(a => a.id !== id) });
  },
  setEthPriceUsd: (ethPriceUsd: number) => {
    set({ ethPriceUsd });
  },
  setEthPriceNative: (ethPriceNative: number) => {
    set({ ethPriceNative });
  },
  setGasSpeed: (gasSpeed: GasSpeed) => {
    set({ gasSpeed });
  },
  setHasValidPrebuyAmount: (hasValidPrebuyAmount: boolean) => {
    set({ hasValidPrebuyAmount });
  },
  setHasSufficientEthForGas: (hasSufficientEthForGas: boolean) => {
    set({ hasSufficientEthForGas });
  },
  // actions
  reset: () => {
    set({
      imageUri: '',
      imageUrl: '',
      name: '',
      symbol: '',
      description: '',
      links: [],
      creatorBuyInEth: 0,
      ethPriceUsd: 0,
      ethPriceNative: 0,
      gasSpeed: GasSpeed.FAST,
      hasSufficientEthForGas: true,
      hasValidPrebuyAmount: true,
      airdropRecipients: [],
      step: 'info' as const,
      stepIndex: makeMutable(0),
      stepSharedValue: makeMutable('info'),
      chainId: DEFAULT_CHAIN_ID,
      totalSupply: DEFAULT_TOTAL_SUPPLY,
    });
  },
  validateForm: () => {
    // TODO: validate all field values before submission to sdk for creation
  },
  createToken: async () => {
    // TODO: aggregate all data from store and call to sdk to create token
  },
}));
