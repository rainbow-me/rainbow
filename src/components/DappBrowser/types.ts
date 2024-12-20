import { MutableRefObject } from 'react';
import { GestureResponderEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, { AnimatedRef, DerivedValue, SharedValue } from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import WebView from 'react-native-webview';
import { Site } from '@/state/browserHistory';

export type TabId = string;
export type TabData = { canGoBack?: boolean; canGoForward?: boolean; logoUrl?: string; title?: string; url?: string };

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
  setLogo: (logoUrl: string | undefined, tabId: string) => void;
  setTitle: (title: string | undefined, tabId: string) => void;
  tabId: string;
}

export interface ScreenshotType {
  id: string; // <- the tab uniqueId
  timestamp: number; // <- time of capture
  uri: string; // <- screenshot file name = `screenshot-${timestamp}.jpg`
  url: string; // <- url of the tab
}

export interface ActiveTabRef extends WebView {
  title?: string;
}

export type TabInfo = { isFullSizeTab: boolean; isPendingActiveTab: boolean };

// ---------------------------------------------------------------------------- //
// 👆 Gestures
// ---------------------------------------------------------------------------- //
export type TabCloseGesture = { gestureScale: number; gestureX: number; isActive: boolean; tabIndex: number };

export type ActiveTabCloseGestures = Record<TabId, TabCloseGesture | undefined>;

export type GestureManagerState = 'active' | 'inactive' | 'pending';

export enum TabViewGestureStates {
  ACTIVE = 'ACTIVE',
  DRAG_END_ENTERING = 'DRAG_END_ENTERING',
  DRAG_END_EXITING = 'DRAG_END_EXITING',
  INACTIVE = 'INACTIVE',
}

export interface WebViewScrollEvent extends Omit<NativeScrollEvent, 'zoomScale'> {
  zoomScale?: number;
}

// ---------------------------------------------------------------------------- //
// 🌐 BrowserContext
// ---------------------------------------------------------------------------- //
export interface BrowserContextType {
  activeTabId: SharedValue<string>;
  activeTabInfo: DerivedValue<{
    isGoogleSearch: boolean;
    isOnHomepage: boolean;
    tabIndex: number;
    url: string;
  }>;
  activeTabCloseGestures: SharedValue<ActiveTabCloseGestures>;
  activeTabRef: MutableRefObject<ActiveTabRef | null>;
  animatedActiveTabIndex: SharedValue<number>;
  animatedMultipleTabsOpen: DerivedValue<number>;
  animatedScreenshotData: SharedValue<AnimatedScreenshotData>;
  animatedTabUrls: SharedValue<AnimatedTabUrls>;
  currentlyBeingClosedTabIds: SharedValue<string[]>;
  currentlyOpenTabIds: SharedValue<string[]>;
  extraWebViewHeight: DerivedValue<number>;
  gestureManagerState: SharedValue<GestureManagerState>;
  lastActiveHomepageTab: SharedValue<string | null>;
  loadProgress: SharedValue<number>;
  multipleTabsOpen: DerivedValue<boolean>;
  pendingTabSwitchOffset: SharedValue<number>;
  screenshotCaptureRef: MutableRefObject<ViewShot | null>;
  scrollViewOffset: SharedValue<number>;
  scrollViewRef: AnimatedRef<Animated.ScrollView>;
  searchViewProgress: SharedValue<number>;
  shouldCollapseBottomBar: SharedValue<boolean>;
  shouldToggleAfterTabSwitch: SharedValue<boolean | number>;
  tabSwitchGestureX: SharedValue<number>;
  tabViewBorderRadius: SharedValue<number>;
  tabViewGestureHoldDuration: SharedValue<number>;
  tabViewGestureProgress: SharedValue<number>;
  tabViewGestureState: SharedValue<TabViewGestureStates>;
  tabViewProgress: SharedValue<number>;
  tabViewVisible: SharedValue<boolean>;
  goBack: () => void;
  goForward: () => void;
  goToUrl: (url: string, tabId?: string) => void;
  onScrollWebView: (event: NativeSyntheticEvent<WebViewScrollEvent>) => void;
  onTouchEnd: (event: GestureResponderEvent) => void;
  onTouchMove: (event: GestureResponderEvent) => void;
  onTouchStart: (event: GestureResponderEvent) => void;
  refreshPage: () => void;
  resetScrollHandlers: () => void;
  stopLoading: () => void;
}

// ---------------------------------------------------------------------------- //
// 📐 BrowserTabBarContext
// ---------------------------------------------------------------------------- //
export interface BrowserTabBarContextType {
  activeTabRef: MutableRefObject<ActiveTabRef | null>;
  extraWebViewHeight: DerivedValue<number>;
  shouldCollapseBottomBar: SharedValue<boolean>;
  tabViewProgress: SharedValue<number>;
  goBack: () => void;
  goForward: () => void;
}

// ---------------------------------------------------------------------------- //
// 🔵 BrowserWorkletsContext
// ---------------------------------------------------------------------------- //
type NewTabOptions = { newTabId?: string; newTabUrl?: string };

export interface BrowserWorkletsContextType {
  closeAllTabsWorklet: () => void;
  closeTabWorklet: ({ tabId, tabIndex }: { tabId: string; tabIndex: number }) => void;
  newTabWorklet: (options?: NewTabOptions) => void;
  setScreenshotDataWorklet: (screenshotData: ScreenshotType) => void;
  toggleTabViewWorklet: (activeIndex?: number) => void;
  updateTabUrlWorklet: ({ tabId, url }: { tabId: string; url: string }) => void;
}
