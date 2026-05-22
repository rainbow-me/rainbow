import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

export type DiscoverSection = string;

type DiscoverNavigationStore = {
  activeSection: DiscoverSection;
  getActiveSection: () => DiscoverSection;
  isSectionActive: (section: DiscoverSection) => boolean;
  navigate: (section: DiscoverSection, surfaceId?: string) => void;
};

export const useDiscoverNavigationStore = createRainbowStore<DiscoverNavigationStore>((set, get) => ({
  activeSection: 'for_you',

  getActiveSection: () => get().activeSection,

  isSectionActive: section => get().activeSection === section,

  navigate: (section, surfaceId = 'discover') => {
    if (get().activeSection === section) return;
    set({ activeSection: section });
    analytics.track(event.discoverTabSelected, { tabId: section, surfaceId });
  },
}));

export const DiscoverSectionNavigation = createStoreActions(useDiscoverNavigationStore);
