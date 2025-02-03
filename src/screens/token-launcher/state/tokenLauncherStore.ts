import { abbreviateNumber } from '@/helpers/utilities';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import getDominantColorFromImage from '@/utils/getDominantColorFromImage';
import { DEFAULT_TOKEN_IMAGE_PRIMARY_COLOR, DEFAULT_CHAIN_ID, DEFAULT_TOTAL_SUPPLY } from '../constants';

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
  links: Record<string, string>;
  // derived state
  formattedTotalSupply: () => string;
  // setters
  setImageUri: (uri: string) => void;
  setImageUrl: (url: string) => void;
  setName: (name: string) => void;
  setSymbol: (symbol: string) => void;
  setChainId: (chainId: number) => void;
  setTotalSupply: (totalSupply: number) => void;
  setLink: (link: string, url: string) => void;
  setDescription: (description: string) => void;
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
  chainId: DEFAULT_CHAIN_ID,
  totalSupply: DEFAULT_TOTAL_SUPPLY,
  links: {},
  formattedTotalSupply: () => abbreviateNumber(get().totalSupply),
  setImageUri: (uri: string) => {
    set({ imageUri: uri });
  },
  setImageUrl: async (url: string) => {
    try {
      // TODO: ideally this would be done in the setImageUri function, but the native library doesn't support it
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
  setLink: (link: string, url: string) => set({ links: { ...get().links, [link]: url } }),
  validateForm: () => {
    // TODO: validate all field values before submission to sdk for creation
  },
}));
