import { abbreviateNumber } from '@/helpers/utilities';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import getDominantColorFromImage from '@/utils/getDominantColorFromImage';
import { DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR, DEFAULT_CHAIN_ID, DEFAULT_TOTAL_SUPPLY, STEP_TRANSITION_DURATION } from '../constants';
import { makeMutable, SharedValue, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';

export type LinkType = 'website' | 'x' | 'telegram' | 'farcaster' | 'discord' | 'other';
export type Link = { input: string; type: LinkType; url: string };
interface TokenLauncherStore {
  // base state
  imageUri: string;
  imageUrl: string;
  imagePrimaryColor: string;
  name: string;
  symbol: string;
  chainId: number;
  totalSupply: number;
  description: string;
  links: Link[];
  creatorBuyInEth: number;
  airdropGroups: string[];
  airdropAddresses: string[];
  step: 'info' | 'overview' | 'success';
  stepIndex: SharedValue<number>;
  // derived state
  formattedTotalSupply: () => string;
  tokenPrice: () => string;
  tokenMarketCap: () => string;
  hasCompletedRequiredFields: () => boolean;
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
  setDescription: (description: string) => void;
  setStep: (step: 'info' | 'overview' | 'success') => void;
  // actions
  validateForm: () => void;
}

export const useTokenLauncherStore = createRainbowStore<TokenLauncherStore>((set, get) => ({
  imageUri: '',
  imageUrl: '',
  imagePrimaryColor: DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR,
  name: '',
  symbol: '',
  description: '',
  airdropGroups: [],
  airdropAddresses: [],
  chainId: DEFAULT_CHAIN_ID,
  totalSupply: DEFAULT_TOTAL_SUPPLY,
  links: [
    { input: '', type: 'website', url: '' },
    { input: '', type: 'x', url: '' },
    { input: '', type: 'telegram', url: '' },
    { input: '', type: 'farcaster', url: '' },
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
  // setters
  setImageUri: (uri: string) => {
    set({ imageUri: uri });
  },
  setImageUrl: async (url: string) => {
    try {
      // TODO: ideally this would be done in the setImageUri function, but the native library is throwing an error
      set({ imageUrl: url, imagePrimaryColor: await getDominantColorFromImage(url, '#333333') });
    } catch (e) {
      console.log('error extracting color', e);
    }
  },
  setName: (name: string) => set({ name }),
  setSymbol: (symbol: string) => set({ symbol }),
  setDescription: (description: string) => set({ description }),
  setChainId: (chainId: number) => set({ chainId }),
  setTotalSupply: (totalSupply: number) => set({ totalSupply }),
  addLink: (type: LinkType) => set({ links: [...get().links, { input: '', type, url: '' }] }),
  editLink: ({ index, input, url }: { index: number; input: string; url: string }) =>
    set({ links: get().links.map((link, i) => (i === index ? { ...link, input, url } : link)) }),
  deleteLink: (index: number) => set({ links: get().links.filter((_, i) => i !== index) }),
  setStep: (step: 'info' | 'overview' | 'success') => {
    const newIndex = step === 'info' ? 0 : 1;
    // get().stepIndex.value = newIndex;
    get().stepIndex.value = withTiming(newIndex, TIMING_CONFIGS.slowFadeConfig);
    set({ step });
  },
  // actions
  validateForm: () => {
    // TODO: validate all field values before submission to sdk for creation
  },
}));
