import { createBaseStore, createStoreActions } from '@storesjs/stores';

export type DiscoverSection = string;

type DiscoverNavigationStore = {
  activeSection: DiscoverSection;
  getActiveSection: () => DiscoverSection;
  isSectionActive: (section: DiscoverSection) => boolean;
  navigate: (section: DiscoverSection) => void;
};

export const useDiscoverNavigationStore = createBaseStore<DiscoverNavigationStore>((set, get) => ({
  activeSection: 'for_you',

  getActiveSection: () => get().activeSection,

  isSectionActive: section => get().activeSection === section,

  navigate: section => {
    if (get().activeSection === section) return;
    set({ activeSection: section });
  },
}));

export const DiscoverSectionNavigation = createStoreActions(useDiscoverNavigationStore);
