import { Site } from '@/state/browserHistory';

export type TabId = string;
export type TabData = { logoUrl?: string; title?: string; url?: string };

export type AnimatedScreenshotData = Record<TabId, ScreenshotType | undefined>;
export type AnimatedTabUrls = Record<TabId, string>;

export type TabOperationType = 'newTab' | 'closeTab';

export interface BaseTabOperation {
  newActiveIndex: number | undefined;
  tabId: string;
  type: TabOperationType;
}

export interface CloseTabOperation extends BaseTabOperation {
  type: 'closeTab';
}

export interface NewTabOperation extends BaseTabOperation {
  newTabUrl?: string;
  type: 'newTab';
}

export type TabOperation = CloseTabOperation | NewTabOperation;

export interface BrowserTabProps {
  addRecent: (site: Site) => void;
  setLogo: (logoUrl: string, tabId: string) => void;
  setTitle: (title: string, tabId: string) => void;
  tabId: string;
}

export interface ScreenshotType {
  id: string; // <- the tab uniqueId
  timestamp: number; // <- time of capture
  uri: string; // <- screenshot file name = `screenshot-${timestamp}.jpg`
  url: string; // <- url of the tab
}
