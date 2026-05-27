import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

export type DiscoverSection = string;

type DiscoverNavigationStore = {
  activeSection: DiscoverSection;
  getActiveSection: () => DiscoverSection;
  isSectionActive: (section: DiscoverSection) => boolean;
  navigate: (section: DiscoverSection) => void;
};

export const useDiscoverNavigationStore = createRainbowStore<DiscoverNavigationStore>((set, get) => ({
  activeSection: 'for_you',

  getActiveSection: () => get().activeSection,

  isSectionActive: section => get().activeSection === section,

  navigate: section => {
    if (get().activeSection === section) return;
    set({ activeSection: section });
  },
}));

export const DiscoverSectionNavigation = createStoreActions(useDiscoverNavigationStore);
