import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

export const DISCOVER_SECTION_ORDER = ['forYou', 'markets', 'crypto', 'sports'] as const;

export type DiscoverSection = (typeof DISCOVER_SECTION_ORDER)[number];

type DiscoverSectionConfig = {
  index: number;
  label: string;
  value: DiscoverSection;
};

export const DISCOVER_SECTIONS: Record<DiscoverSection, DiscoverSectionConfig> = {
  forYou: {
    index: 0,
    label: 'For You',
    value: 'forYou',
  },
  crypto: {
    index: 2,
    label: 'Crypto',
    value: 'crypto',
  },
  markets: {
    index: 1,
    label: 'Markets',
    value: 'markets',
  },
  sports: {
    index: 3,
    label: 'Sports',
    value: 'sports',
  },
};

type DiscoverNavigationStore = {
  activeSection: DiscoverSection;
  getActiveSection: () => DiscoverSection;
  isSectionActive: (section: DiscoverSection) => boolean;
  navigate: (section: DiscoverSection) => void;
};

export const useDiscoverNavigationStore = createRainbowStore<DiscoverNavigationStore>((set, get) => ({
  activeSection: DISCOVER_SECTION_ORDER[0],

  getActiveSection: () => get().activeSection,

  isSectionActive: section => get().activeSection === section,

  navigate: section => {
    if (get().activeSection === section) return;
    set({ activeSection: section });
  },
}));

export const DiscoverSectionNavigation = createStoreActions(useDiscoverNavigationStore);

export function getDiscoverSectionForIndex(index: number): DiscoverSection | undefined {
  return DISCOVER_SECTION_ORDER[index];
}
