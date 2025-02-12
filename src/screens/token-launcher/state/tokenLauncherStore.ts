import { abbreviateNumber } from '@/helpers/utilities';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR, DEFAULT_CHAIN_ID, DEFAULT_TOTAL_SUPPLY, STEP_TRANSITION_DURATION } from '../constants';
import { makeMutable, SharedValue, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import chroma from 'chroma-js';
import { memoFn } from '@/utils/memoFn';

// TODO: same as colors.alpha, move to a helper file
export const getAlphaColor = memoFn((color: string, alpha = 1) => `rgba(${chroma(color).rgb()},${alpha})`);

export type LinkType = 'website' | 'x' | 'telegram' | 'farcaster' | 'discord' | 'other';
export type Link = { input: string; type: LinkType; url: string };
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
  airdropRecipients: {
    type: 'group' | 'address';
    id: string;
    value: string;
  }[];
  step: 'info' | 'overview' | 'success';
  stepIndex: SharedValue<number>;
  // derived state
  formattedTotalSupply: () => string;
  tokenPrice: () => string;
  tokenMarketCap: () => string;
  hasCompletedRequiredFields: () => boolean;
  allocationPercentages: () => {
    creator: number;
    airdrop: number;
  };
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
  setStep: (step: 'info' | 'overview' | 'success') => void;
  addAirdropGroup: (group: string) => void;
  addOrEditAirdropAddress: ({ id, address }: { id: string; address: string }) => void;
  deleteAirdropRecipient: (id: string) => void;
  // actions
  validateForm: () => void;
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
  links: [
    // { input: '', type: 'website', url: '' },
    // { input: '', type: 'x', url: '' },
    // { input: '', type: 'telegram', url: '' },
    // { input: '', type: 'farcaster', url: '' },
    // { input: '', type: 'discord', url: '' },
    // { input: '', type: 'other', url: '' },
  ],
  creatorBuyInEth: 0,
  step: 'info' as const,
  stepIndex: makeMutable(0),
  // derived state
  formattedTotalSupply: () => abbreviateNumber(get().totalSupply, 0, 'long'),
  tokenPrice: () => {
    // TODO: interface with sdk to get token price
    return '$0.035';
  },
  tokenMarketCap: () => {
    // TODO: interface with sdk to get token market cap
    return '$35k';
  },
  hasCompletedRequiredFields: () => {
    const { name, symbol, imageUri } = get();
    return name !== '' && symbol !== '' && imageUri !== '';
  },
  allocationPercentages: () => {
    // TODO: interface with sdk to get allocation breakdown
    return { creator: 1, airdrop: 0 };
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
  setStep: (step: 'info' | 'overview' | 'success') => {
    const newIndex = step === 'info' ? 0 : 1;
    // get().stepIndex.value = newIndex;
    get().stepIndex.value = withTiming(newIndex, TIMING_CONFIGS.slowFadeConfig);
    set({ step });
  },
  addAirdropGroup: (group: string) => {
    set({ airdropRecipients: [...get().airdropRecipients, { type: 'group', id: Math.random().toString(), value: group }] });
  },
  addOrEditAirdropAddress: ({ id, address }: { id: string; address: string }) => {
    const { airdropRecipients } = get();
    const isExistingRecipient = airdropRecipients.some(recipient => recipient.id === id);

    if (isExistingRecipient) {
      set({ airdropRecipients: airdropRecipients.map(a => (a.id === id ? { ...a, value: address } : a)) });
    } else {
      set({ airdropRecipients: [...airdropRecipients, { type: 'address', id, value: address }] });
    }
  },
  deleteAirdropRecipient: (id: string) => {
    set({ airdropRecipients: get().airdropRecipients.filter(a => a.id !== id) });
  },
  // actions
  validateForm: () => {
    // TODO: validate all field values before submission to sdk for creation
  },
}));
