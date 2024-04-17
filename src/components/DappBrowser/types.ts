import React from 'react';
import { SharedValue } from 'react-native-reanimated';
import WebView from 'react-native-webview';

export interface TabState {
  canGoBack: boolean;
  canGoForward: boolean;
  uniqueId: string;
  url: string;
  logoUrl?: string | null;
}

export type TabOperationType = 'newTab' | 'closeTab';

export interface BaseTabOperation {
  type: TabOperationType;
  tabId: string;
  newActiveIndex: number | undefined;
  url?: string;
}

export interface CloseTabOperation extends BaseTabOperation {
  type: 'closeTab';
}

export interface NewTabOperation extends BaseTabOperation {
  type: 'newTab';
  newTabUrl?: string;
}

export type TabOperation = CloseTabOperation | NewTabOperation;

export interface BrowserTabProps {
  tabState: TabState;
  isActiveTab: boolean;
  tabId: string;
  nextTabId: string;
  tabsCount: number;
  injectedJS: React.MutableRefObject<string | null>;
  activeTabRef: React.MutableRefObject<WebView | null>;
  animatedActiveTabIndex: SharedValue<number>;
  closeTabWorklet?(tabId: string, tabIndex: number): void;
  currentlyOpenTabIds: SharedValue<string[]>;
  tabViewProgress: SharedValue<number> | undefined;
  tabViewVisible: SharedValue<boolean> | undefined;
  toggleTabViewWorklet(tabIndex?: number): void;
  updateActiveTabState?(updates: Partial<TabState>, tabId: string | undefined): void;
  url: string;
}

export interface ScreenshotType {
  id: string; // <- the tab uniqueId
  timestamp: number; // <- time of capture
  uri: string; // <- screenshot file name = `screenshot-${timestamp}.jpg`
  url: string; // <- url of the tab
}
