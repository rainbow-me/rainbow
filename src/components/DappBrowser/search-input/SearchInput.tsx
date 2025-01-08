import React, { memo, useCallback, useMemo } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputChangeEventData, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { AnimatedText, Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  DerivedValue,
  SharedValue,
  runOnJS,
  runOnUI,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedBlurView } from '@/components/AnimatedComponents/AnimatedBlurView';
import { AnimatedInput } from '@/components/AnimatedComponents/AnimatedInput';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { fontWithWidth } from '@/styles';
import font from '@/styles/fonts';
import { useBrowserStore } from '@/state/browser/browserStore';
import { FavoritedSite, useFavoriteDappsStore } from '@/state/browser/favoriteDappsStore';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { opacity } from '@/__swaps__/utils/swaps';
import showActionSheetWithOptions from '@/utils/actionsheet';
import haptics from '@/utils/haptics';
import { useBrowserContext } from '../BrowserContext';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';
import { BrowserButtonShadows } from '../DappBrowserShadows';
import { SEARCH_BAR_BORDER_RADIUS, SEARCH_BAR_HEIGHT, SEARCH_BAR_WIDTH } from '../Dimensions';
import { ToolbarIcon } from '../ToolbarIcon';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, RAINBOW_HOME } from '../constants';
import { useSearchContext } from '../search/SearchContext';
import { TabViewGestureStates } from '../types';
import { getNameFromFormattedUrl, handleShareUrl } from '../utils';

const SEARCH_PLACEHOLDER_TEXT = i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder);

type MenuActionKey = 'closeTab' | 'share' | 'favorite' | 'home' | 'forward' | 'back';

const ThreeDotMenu = function ThreeDotMenu({ formattedUrlValue }: { formattedUrlValue: SharedValue<string> }) {
  const tabUrl = useBrowserStore(state => state.getActiveTabUrl());
  const isFavorite = useFavoriteDappsStore(state => state.isFavorite(tabUrl || ''));
  const isOnHomepage = useBrowserStore(state => state.isOnHomepage());
  const navState = useBrowserStore(state => state.getActiveTabNavState());

  const { activeTabId, activeTabInfo, currentlyOpenTabIds, goBack, goForward, goToUrl, loadProgress } = useBrowserContext();
  const { closeTabWorklet } = useBrowserWorkletsContext();

  const addFavorite = useFavoriteDappsStore(state => state.addFavorite);
  const removeFavorite = useFavoriteDappsStore(state => state.removeFavorite);

  const handleFavoritePress = useCallback(() => {
    const url = formattedUrlValue.value;
    if (url) {
      if (isFavorite) {
        removeFavorite(url);
      } else {
        const site: FavoritedSite = {
          name: getNameFromFormattedUrl(formattedUrlValue.value),
          url: url,
          image: useBrowserStore.getState().getActiveTabLogo() || `https://${formattedUrlValue.value}/apple-touch-icon.png`,
        };
        addFavorite(site);
      }
    }
  }, [addFavorite, formattedUrlValue, isFavorite, removeFavorite]);

  const menuConfig = useMemo(() => {
    const menuItems = [
      {
        actionKey: 'closeTab',
        actionTitle: i18n.t(i18n.l.dapp_browser.menus.close_tab),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'xmark',
        },
        menuAttributes: ['destructive' as const],
      },
      {
        actionKey: 'share',
        actionTitle: i18n.t(i18n.l.dapp_browser.menus.share),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.and.arrow.up',
        },
      },
    ];

    const isGoogleSearch = tabUrl?.includes('google.com/search');
    if (!isGoogleSearch) {
      menuItems.push({
        actionKey: 'favorite',
        actionTitle: isFavorite ? i18n.t(i18n.l.dapp_browser.menus.undo_favorite) : i18n.t(i18n.l.dapp_browser.menus.favorite),
        icon: {
          iconType: 'SYSTEM',
          iconValue: isFavorite ? 'star.slash' : 'star',
        },
      });
    }
    if (!isOnHomepage) {
      menuItems.push({
        actionKey: 'home',
        actionTitle: i18n.t(i18n.l.dapp_browser.menus.home),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'house',
        },
      });
    }
    if (navState.canGoForward) {
      menuItems.push({
        actionKey: 'forward',
        actionTitle: i18n.t(i18n.l.dapp_browser.menus.forward),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'arrowshape.forward',
        },
      });
    }
    if (navState.canGoBack) {
      menuItems.push({
        actionKey: 'back',
        actionTitle: i18n.t(i18n.l.dapp_browser.menus.back),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'arrowshape.backward',
        },
      });
    }

    return {
      menuTitle: '',
      menuItems,
    };
  }, [isFavorite, isOnHomepage, navState, tabUrl]);

  const goHome = useCallback(() => {
    goToUrl(RAINBOW_HOME);
    loadProgress.value = 0;
  }, [goToUrl, loadProgress]);

  const onPressMenuItem = useCallback(
    async ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: MenuActionKey } }) => {
      haptics.selection();
      if (actionKey === 'favorite') {
        handleFavoritePress();
      } else if (actionKey === 'back') {
        goBack();
      } else if (actionKey === 'forward') {
        goForward();
      } else if (actionKey === 'home') {
        goHome();
      } else if (actionKey === 'share') {
        const url = activeTabInfo.value.url;
        if (url) handleShareUrl(url);
      } else if (actionKey === 'closeTab') {
        runOnUI(() => {
          const multipleTabsOpen = currentlyOpenTabIds.value.length > 1;
          if (multipleTabsOpen) {
            const tabId = activeTabId.value;
            const tabIndex = currentlyOpenTabIds.value.indexOf(tabId);
            currentlyOpenTabIds.modify(value => {
              value.splice(tabIndex, 1);
              return value;
            });
            closeTabWorklet({ tabId, tabIndex });
          } else {
            runOnJS(goHome)();
          }
        })();
      }
    },
    [activeTabId, activeTabInfo, closeTabWorklet, currentlyOpenTabIds, goBack, goForward, goHome, handleFavoritePress]
  );

  const onPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        ...{ cancelButtonIndex: menuConfig.menuItems.length - 1 },
        options: menuConfig.menuItems.map(item => item?.actionTitle),
      },
      (buttonIndex: number) => {
        onPressMenuItem({ nativeEvent: { actionKey: menuConfig.menuItems[buttonIndex]?.actionKey as MenuActionKey } });
      }
    );
  }, [menuConfig, onPressMenuItem]);

  return (
    <>
      {IS_IOS ? (
        <View style={styles.searchBarContextMenuContainer}>
          <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={onPressMenuItem} style={styles.searchBarContextMenu}>
            <ToolbarIcon
              color="label"
              icon="􀍡"
              onPress={() => {
                return;
              }}
              side="left"
              size="icon 17px"
              weight="heavy"
            />
          </ContextMenuButton>
        </View>
      ) : (
        <ToolbarIcon color="label" icon="􀍡" onPress={onPressAndroid} side="left" size="icon 17px" weight="heavy" />
      )}
    </>
  );
};

export const SearchInput = memo(function SearchInput({
  inputRef,
  onBlurWorklet,
  onPressWorklet,
  onSubmitEditing,
}: {
  inputRef: AnimatedRef<TextInput>;
  onBlurWorklet: () => void;
  onPressWorklet: () => void;
  onSubmitEditing: (newUrl: string) => void;
}) {
  const {
    activeTabId,
    animatedTabUrls,
    currentlyOpenTabIds,
    loadProgress,
    pendingTabSwitchOffset,
    refreshPage,
    stopLoading,
    tabViewGestureState,
    tabViewProgress,
  } = useBrowserContext();
  const { isDarkMode } = useColorMode();
  const { isFocused } = useSearchContext();

  const tabUrl = useDerivedValue(() => {
    if (!_WORKLET) return useBrowserStore.getState().getActiveTabUrl() || RAINBOW_HOME;
    const pendingTabIndex = currentlyOpenTabIds.value.indexOf(activeTabId.value) + pendingTabSwitchOffset.value;
    const currentTabId = pendingTabSwitchOffset.value ? currentlyOpenTabIds.value[pendingTabIndex] : activeTabId.value;
    const url = animatedTabUrls.value[currentTabId] || RAINBOW_HOME;
    return url;
  });

  const formattedUrlValue = useDerivedValue(() => {
    const url = _WORKLET ? tabUrl.value : useBrowserStore.getState().getActiveTabUrl();
    if (!url || url === RAINBOW_HOME) return SEARCH_PLACEHOLDER_TEXT;

    return formatUrlForSearchInput(url, true);
  });

  const isLoading = useDerivedValue(() => _WORKLET && loadProgress.value !== 1 && loadProgress.value !== 0);

  const pointerEventsStyle = useAnimatedStyle(() => ({
    pointerEvents:
      _WORKLET && (tabViewGestureState.value !== TabViewGestureStates.INACTIVE || tabViewProgress.value / 100 < 1) ? 'auto' : 'none',
  }));

  const refreshButtonStyle = useAnimatedStyle(() => {
    const showRefreshButton = _WORKLET && !isLoading.value;
    return {
      opacity: withTiming(showRefreshButton ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
      pointerEvents: showRefreshButton ? 'box-none' : 'none',
      transform: [{ scale: withTiming(showRefreshButton ? 1 : 0.6, TIMING_CONFIGS.slowFadeConfig) }],
    };
  });

  const stopLoadingButtonStyle = useAnimatedStyle(() => {
    const showStopButton = _WORKLET && isLoading.value;
    return {
      opacity: withTiming(showStopButton ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
      pointerEvents: showStopButton ? 'box-none' : 'none',
      transform: [{ scale: withTiming(showStopButton ? 1 : 0.6, TIMING_CONFIGS.slowFadeConfig) }],
    };
  });

  const toolbarIconStyle = useAnimatedStyle(() => {
    const isOnHomepage = _WORKLET ? tabUrl.value === RAINBOW_HOME : useBrowserStore.getState().isOnHomepage();
    const shouldHide = isOnHomepage || (_WORKLET && (isFocused.value || formattedUrlValue.value === SEARCH_PLACEHOLDER_TEXT));
    return {
      opacity: shouldHide ? withTiming(0, TIMING_CONFIGS.fadeConfig) : withSpring(1, SPRING_CONFIGS.keyboardConfig),
      pointerEvents: shouldHide ? 'none' : 'auto',
    };
  });

  return (
    <BrowserButtonShadows
      backgroundColor={isDarkMode ? HOMEPAGE_BACKGROUND_COLOR_DARK : undefined}
      borderRadius={SEARCH_BAR_BORDER_RADIUS}
      hideDarkModeShadows
    >
      <Animated.View style={pointerEventsStyle}>
        <AddressBar
          formattedUrlValue={formattedUrlValue}
          inputRef={inputRef}
          onBlurWorklet={onBlurWorklet}
          onPressWorklet={onPressWorklet}
          onSubmitEditing={onSubmitEditing}
          pointerEventsStyle={pointerEventsStyle}
          tabUrl={tabUrl}
        />
        <Animated.View style={[toolbarIconStyle, styles.toolbarIconStyleLeft]}>
          <ThreeDotMenu formattedUrlValue={formattedUrlValue} />
        </Animated.View>
        <Animated.View style={[refreshButtonStyle, styles.toolbarIconStyleRight]}>
          <Animated.View style={toolbarIconStyle}>
            <ToolbarIcon color="label" icon="􀅈" onPress={refreshPage} side="right" size="icon 17px" weight="heavy" />
          </Animated.View>
        </Animated.View>
        <Animated.View style={[stopLoadingButtonStyle, styles.toolbarIconStyleRight]}>
          <Animated.View style={toolbarIconStyle}>
            <ToolbarIcon color="label" icon="􀆄" onPress={stopLoading} side="right" size="icon 16px" weight="heavy" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </BrowserButtonShadows>
  );
});

const AddressBar = memo(function AddressBar({
  formattedUrlValue,
  inputRef,
  onBlurWorklet,
  onPressWorklet,
  onSubmitEditing,
  pointerEventsStyle,
  tabUrl,
}: {
  formattedUrlValue: DerivedValue<string>;
  inputRef: AnimatedRef<TextInput>;
  onBlurWorklet: () => void;
  onPressWorklet: () => void;
  onSubmitEditing: (newUrl: string) => void;
  pointerEventsStyle: AnimatedStyle;
  tabUrl: DerivedValue<string>;
}) {
  const { searchViewProgress } = useBrowserContext();
  const { isFocused, searchQuery } = useSearchContext();
  const { isDarkMode } = useColorMode();

  const fillSecondary = useForegroundColor('fillSecondary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  const animatedButtonWrapperStyle = useAnimatedStyle(() => ({
    pointerEvents: _WORKLET && isFocused.value ? 'none' : 'auto',
  }));

  const inputStyle = useAnimatedStyle(() => ({
    opacity:
      _WORKLET && isFocused.value && searchViewProgress.value > 10
        ? withSpring(1, SPRING_CONFIGS.slowSpring)
        : withTiming(0, TIMING_CONFIGS.fadeConfig),
    pointerEvents: _WORKLET && isFocused.value ? 'auto' : 'none',
  }));

  const formattedInputStyle = useAnimatedStyle(() => ({
    display: tabUrl.value === RAINBOW_HOME ? 'none' : 'flex',
    opacity:
      _WORKLET && (isFocused.value || searchViewProgress.value > 90)
        ? withTiming(0, TIMING_CONFIGS.fadeConfig)
        : withSpring(1, SPRING_CONFIGS.slowSpring),
  }));

  const searchPlaceholderStyle = useAnimatedStyle(() => ({
    display: tabUrl.value === RAINBOW_HOME ? 'flex' : 'none',
    opacity:
      _WORKLET && (isFocused.value || searchViewProgress.value > 90)
        ? withTiming(0, TIMING_CONFIGS.fadeConfig)
        : withSpring(1, SPRING_CONFIGS.slowSpring),
  }));

  const searchInputValue = useAnimatedProps(() => {
    const urlOrSearchQuery = formatUrlForSearchInput(_WORKLET ? tabUrl.value : useBrowserStore.getState().getActiveTabUrl());

    // Removing the value when the input is focused allows the input to be reset to the correct value on blur
    const url = _WORKLET && isFocused.value ? undefined : urlOrSearchQuery;

    return { defaultValue: urlOrSearchQuery, text: url };
  });

  const onSearchQueryChange = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      searchQuery.value = event.nativeEvent.text;
    },
    [searchQuery]
  );

  return (
    <View style={styles.inputContainer}>
      <Animated.View style={[styles.gestureHandlerButton, animatedButtonWrapperStyle]}>
        <GestureHandlerButton onPressWorklet={onPressWorklet} scaleTo={0.965} style={styles.gestureHandlerButton}>
          <MaskedView
            maskElement={<FadeMask fadeEdgeInset={36} fadeWidth={12} height={SEARCH_BAR_HEIGHT} side="right" />}
            style={styles.fadeMaskStyle}
          >
            <Animated.View style={[formattedInputStyle, styles.formattedInputTextContainer]}>
              <AnimatedText
                align="center"
                color="label"
                ellipsizeMode="clip"
                numberOfLines={1}
                size="17pt"
                style={styles.formattedInputText}
                weight="bold"
              >
                {formattedUrlValue}
              </AnimatedText>
            </Animated.View>
          </MaskedView>
          <Animated.View style={[searchPlaceholderStyle, styles.fadeMaskStyle, styles.formattedInputTextContainer]}>
            <AnimatedText
              align="center"
              color="labelQuaternary"
              ellipsizeMode="clip"
              numberOfLines={1}
              size="17pt"
              style={styles.placeholderText}
              weight="bold"
            >
              {formattedUrlValue}
            </AnimatedText>
          </Animated.View>
          {IS_IOS && (
            <Box
              as={AnimatedBlurView}
              blurAmount={20}
              blurType={isDarkMode ? 'dark' : 'light'}
              style={[styles.blurViewStyle, pointerEventsStyle]}
            />
          )}
          <Animated.View
            style={[
              {
                backgroundColor: buttonColor,
                borderColor: separatorSecondary,
                borderWidth: IS_IOS && isDarkMode ? THICK_BORDER_WIDTH : 0,
              },
              styles.inputBorderStyle,
              pointerEventsStyle,
            ]}
          />
        </GestureHandlerButton>
      </Animated.View>
      <Animated.View style={[styles.inputContentWrapper, inputStyle]}>
        <AnimatedInput
          animatedProps={searchInputValue}
          clearButtonMode="while-editing"
          enablesReturnKeyAutomatically
          keyboardType="web-search"
          onBlur={() => runOnUI(onBlurWorklet)()}
          onChange={onSearchQueryChange}
          onSubmitEditing={e => {
            const url = e.nativeEvent.text.trim();
            if (url) onSubmitEditing(url);
          }}
          placeholder={i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder)}
          placeholderTextColor={labelQuaternary}
          ref={inputRef}
          returnKeyType="go"
          selectTextOnFocus
          spellCheck={false}
          style={[styles.input, { color: label }]}
          testID="browser-search-input"
          textAlign="left"
          textAlignVertical="center"
        />
      </Animated.View>
    </View>
  );
});

const PRETTY_URL_REGEX = /^(?:https?:\/\/)?(?:[^/\n]*@)?([^/:\n?]+)(?:[/:?]|$)/i;

function getPrettyUrl(url: string) {
  'worklet';
  const match = url.match(PRETTY_URL_REGEX);
  const prettyDomain = match?.[1]?.startsWith('www.') ? match[1].slice(4) : match?.[1];
  if (prettyDomain) return prettyDomain;
  return null;
}

function extractQueryParam(url: string, param: string) {
  'worklet';
  if (!url.includes('?')) return null; // No query string present

  const queryString = url.split('?')[1].split('#')[0]; // Avoid taking anything after a hash
  const params = queryString.split('&');

  for (let i = 0; i < params.length; i++) {
    const pair = params[i].split('=');
    if (pair[0] === param && pair[1]) {
      return decodeURIComponent(pair[1]);
    }
  }
  // No param found
  return null;
}

function formatUrlForSearchInput(url: string | undefined, prettifyUrl?: boolean) {
  'worklet';
  if (!url || url === RAINBOW_HOME) return '';

  const isGoogleSearch = url.includes('google.com/search');
  let formattedUrl = url;

  if (isGoogleSearch) {
    const query = extractQueryParam(formattedUrl, 'q');
    formattedUrl = query || '';
  } else if (prettifyUrl) {
    formattedUrl = getPrettyUrl(formattedUrl) || formattedUrl;
  } else if (formattedUrl?.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, -1);
  }

  return formattedUrl;
}

const styles = StyleSheet.create({
  blurViewStyle: {
    borderCurve: 'continuous',
    borderRadius: SEARCH_BAR_BORDER_RADIUS,
    height: SEARCH_BAR_HEIGHT,
    position: 'absolute',
    width: '100%',
  },
  fadeMaskStyle: {
    alignItems: 'center',
    flexDirection: 'row',
    height: SEARCH_BAR_HEIGHT,
    justifyContent: 'center',
    pointerEvents: 'none',
    position: 'absolute',
    width: SEARCH_BAR_WIDTH,
    zIndex: 99,
  },
  formattedInputText: {
    alignSelf: 'center',
    paddingHorizontal: 40,
    width: SEARCH_BAR_WIDTH,
  },
  formattedInputTextContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: SEARCH_BAR_WIDTH,
  },
  gestureHandlerButton: {
    alignItems: 'center',
    height: SEARCH_BAR_HEIGHT,
    justifyContent: 'center',
    width: '100%',
  },
  input: {
    fontSize: 20,
    height: IS_IOS ? SEARCH_BAR_HEIGHT : 60,
    letterSpacing: 0.36,
    lineHeight: IS_IOS ? undefined : 24,
    marginRight: 7,
    paddingLeft: 16,
    paddingRight: 9,
    paddingVertical: 10,
    zIndex: 100,
    ...fontWithWidth(font.weight.semibold),
  },
  inputBorderStyle: {
    borderCurve: 'continuous',
    borderRadius: SEARCH_BAR_BORDER_RADIUS,
    height: SEARCH_BAR_HEIGHT,
    overflow: 'hidden',
    position: 'absolute',
    width: '100%',
  },
  inputContainer: {
    alignItems: 'center',
    height: SEARCH_BAR_HEIGHT,
    justifyContent: 'center',
    pointerEvents: 'box-none',
    width: '100%',
  },
  inputContentWrapper: {
    height: IS_IOS ? SEARCH_BAR_HEIGHT : 60,
    position: 'absolute',
    width: '100%',
  },
  placeholderText: {
    alignSelf: 'center',
  },
  searchBarContextMenu: {
    marginTop: -6,
    paddingTop: 6,
    width: SEARCH_BAR_WIDTH,
  },
  searchBarContextMenuContainer: {
    height: SEARCH_BAR_HEIGHT,
    overflow: 'hidden',
    width: 40,
  },
  toolbarIconStyleLeft: {
    position: 'absolute',
    left: 0,
  },
  toolbarIconStyleRight: {
    position: 'absolute',
    right: 0,
  },
});
