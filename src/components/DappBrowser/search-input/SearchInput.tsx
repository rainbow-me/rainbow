import React, { useCallback, useMemo } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputChangeEventData, TextInputSubmitEditingEventData, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { AnimatedText, Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  DerivedValue,
  SharedValue,
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
import { Site } from '@/state/browserHistory';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useFavoriteDappsStore } from '@/state/favoriteDapps';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { opacity } from '@/__swaps__/utils/swaps';
import haptics from '@/utils/haptics';
import { useBrowserContext } from '../BrowserContext';
import { BrowserButtonShadows } from '../DappBrowserShadows';
import { ToolbarIcon } from '../ToolbarIcon';
import { RAINBOW_HOME } from '../constants';
import { getNameFromFormattedUrl, handleShareUrl } from '../utils';
import { useSearchContext } from '../search/SearchContext';
import showActionSheetWithOptions from '@/utils/actionsheet';

export const SEARCH_BAR_HEIGHT = 48;
const SEARCH_PLACEHOLDER_TEXT = i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder);

const TheeDotMenu = function TheeDotMenu({
  formattedUrlValue,
  canGoBack,
  canGoForward,
}: {
  formattedUrlValue: SharedValue<string>;
  canGoBack: boolean;
  canGoForward: boolean;
}) {
  const tabUrl = useBrowserStore(state => state.getActiveTabUrl());
  const isFavorite = useFavoriteDappsStore(state => state.isFavorite(tabUrl || ''));

  const { activeTabInfo, goBack, goForward } = useBrowserContext();

  const addFavorite = useFavoriteDappsStore(state => state.addFavorite);
  const removeFavorite = useFavoriteDappsStore(state => state.removeFavorite);

  const handleFavoritePress = useCallback(() => {
    const url = formattedUrlValue.value;
    if (url) {
      if (isFavorite) {
        removeFavorite(url);
      } else {
        const site: Omit<Site, 'timestamp'> = {
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
        actionKey: 'share',
        actionTitle: 'Share',
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
    if (canGoForward) {
      menuItems.push({
        actionKey: 'forward',
        actionTitle: i18n.t(i18n.l.dapp_browser.menus.forward),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'arrowshape.forward',
        },
      });
    }
    if (canGoBack) {
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
  }, [canGoBack, canGoForward, isFavorite, tabUrl]);

  const onPressMenuItem = useCallback(
    async ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: 'share' | 'favorite' | 'back' | 'forward' } }) => {
      haptics.selection();
      if (actionKey === 'favorite') {
        handleFavoritePress();
      } else if (actionKey === 'back') {
        goBack();
      } else if (actionKey === 'forward') {
        goForward();
      } else if (actionKey === 'share') {
        const url = activeTabInfo.value.url;
        if (url) handleShareUrl(url);
      }
    },
    [activeTabInfo, goBack, goForward, handleFavoritePress]
  );

  const onPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        ...{ cancelButtonIndex: menuConfig.menuItems.length - 1 },
        options: menuConfig.menuItems.map(item => item?.actionTitle),
      },
      (buttonIndex: number) => {
        onPressMenuItem({ nativeEvent: { actionKey: menuConfig.menuItems[buttonIndex]?.actionKey as any } });
      }
    );
  }, [menuConfig, onPressMenuItem]);

  return (
    <>
      {IS_IOS ? (
        <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={onPressMenuItem}>
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
      ) : (
        <ToolbarIcon color="label" icon="􀍡" onPress={onPressAndroid} side="left" size="icon 17px" weight="heavy" />
      )}
    </>
  );
};
export const SearchInput = React.memo(function SearchInput({
  canGoBack,
  canGoForward,
  inputRef,
  isFocusedValue,
  onBlur,
  onPressWorklet,
  onSubmitEditing,
}: {
  canGoBack: boolean;
  canGoForward: boolean;
  inputRef: AnimatedRef<TextInput>;
  isFocusedValue: SharedValue<boolean>;
  onBlur: () => void;
  onPressWorklet: () => void;
  onSubmitEditing: (newUrl: string) => void;
}) {
  const { activeTabInfo, refreshPage, tabViewProgress } = useBrowserContext();

  const formattedUrlValue = useDerivedValue(() => {
    const url = activeTabInfo.value.url;
    if (!url || url === RAINBOW_HOME) return SEARCH_PLACEHOLDER_TEXT;

    return formatUrlForSearchInput(url, true);
  });

  const pointerEventsStyle = useAnimatedStyle(() => ({
    pointerEvents: tabViewProgress.value / 100 < 1 ? 'auto' : 'none',
  }));

  const toolbarIconStyle = useAnimatedStyle(() => {
    const url = activeTabInfo.value.url;
    const isHome = !url || url === RAINBOW_HOME;

    return {
      opacity:
        isHome || isFocusedValue.value || formattedUrlValue.value === SEARCH_PLACEHOLDER_TEXT
          ? withTiming(0, TIMING_CONFIGS.fadeConfig)
          : withSpring(1, SPRING_CONFIGS.keyboardConfig),
      pointerEvents: isHome || isFocusedValue.value || !formattedUrlValue.value ? 'none' : 'auto',
    };
  });

  return (
    <BrowserButtonShadows>
      <Box as={Animated.View} justifyContent="center" style={pointerEventsStyle}>
        <AddressBar
          formattedUrlValue={formattedUrlValue}
          isFocusedValue={isFocusedValue}
          inputRef={inputRef}
          onBlur={onBlur}
          onPressWorklet={onPressWorklet}
          onSubmitEditing={onSubmitEditing}
          pointerEventsStyle={pointerEventsStyle}
        />
        <Box as={Animated.View} left="0px" position="absolute" style={toolbarIconStyle}>
          <TheeDotMenu formattedUrlValue={formattedUrlValue} canGoBack={canGoBack} canGoForward={canGoForward} />
        </Box>
        <Box as={Animated.View} position="absolute" right="0px" style={toolbarIconStyle}>
          <ToolbarIcon color="label" icon="􀅈" onPress={refreshPage} side="right" size="icon 17px" weight="heavy" />
        </Box>
      </Box>
    </BrowserButtonShadows>
  );
});

const AddressBar = React.memo(function AddressBar({
  formattedUrlValue,
  isFocusedValue,
  inputRef,
  onBlur,
  onPressWorklet,
  onSubmitEditing,
  pointerEventsStyle,
}: {
  formattedUrlValue: DerivedValue<string>;
  isFocusedValue: SharedValue<boolean>;
  inputRef: AnimatedRef<TextInput>;
  onBlur: () => void;
  onPressWorklet: () => void;
  onSubmitEditing: (newUrl: string) => void;
  pointerEventsStyle: AnimatedStyle;
}) {
  const { activeTabInfo } = useBrowserContext();
  const { searchQuery } = useSearchContext();
  const { isDarkMode } = useColorMode();

  const fillSecondary = useForegroundColor('fillSecondary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  const animatedButtonWrapperStyle = useAnimatedStyle(() => ({
    pointerEvents: isFocusedValue.value ? 'none' : 'auto',
  }));

  const animatedInputContentWrapperStyle = useAnimatedStyle(() => ({
    pointerEvents: isFocusedValue.value ? 'auto' : 'none',
  }));

  const inputStyle = useAnimatedStyle(() => ({
    opacity: isFocusedValue.value ? withSpring(1, SPRING_CONFIGS.keyboardConfig) : withTiming(0, TIMING_CONFIGS.fadeConfig),
    pointerEvents: isFocusedValue.value ? 'auto' : 'none',
  }));

  const formattedInputStyle = useAnimatedStyle(() => ({
    display: activeTabInfo.value.url === RAINBOW_HOME ? 'none' : 'flex',
    opacity: isFocusedValue.value ? withTiming(0, TIMING_CONFIGS.fadeConfig) : withSpring(1, SPRING_CONFIGS.keyboardConfig),
  }));

  const searchPlaceholderStyle = useAnimatedStyle(() => ({
    display: activeTabInfo.value.url === RAINBOW_HOME ? 'flex' : 'none',
    opacity: isFocusedValue.value ? withTiming(0, TIMING_CONFIGS.fadeConfig) : withSpring(1, SPRING_CONFIGS.keyboardConfig),
  }));

  const searchInputValue = useAnimatedProps(() => {
    const urlOrSearchQuery = formatUrlForSearchInput(activeTabInfo.value.url);

    // Removing the value when the input is focused allows the input to be reset to the correct value on blur
    const url = isFocusedValue.value ? undefined : urlOrSearchQuery;

    return { defaultValue: urlOrSearchQuery, text: url };
  });

  // ⚠️ TODO: Refactor
  const updateUrl = useCallback(
    (newUrl: string) => {
      'worklet';
      if (newUrl) {
        onSubmitEditing(newUrl);
      }
    },
    [onSubmitEditing]
  );

  // ⚠️ TODO: Refactor
  const handlePressGo = useCallback(
    (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      inputRef.current?.blur();

      const newUrl = event.nativeEvent.text;
      runOnUI(updateUrl)(newUrl);
    },
    [inputRef, updateUrl]
  );

  const onSearchQueryChange = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      searchQuery.value = event.nativeEvent.text;
    },
    [searchQuery]
  );

  return (
    <View style={styles.inputContainer}>
      <Animated.View style={[styles.gestureHandlerButton, animatedButtonWrapperStyle]}>
        <GestureHandlerV1Button
          buttonPressWrapperStyleIOS={styles.gestureHandlerButton}
          onPressWorklet={onPressWorklet}
          scaleTo={0.965}
          style={styles.gestureHandlerButton}
        >
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
        </GestureHandlerV1Button>
      </Animated.View>
      <Animated.View style={[styles.inputContentWrapper, animatedInputContentWrapperStyle]}>
        <AnimatedInput
          testID={'browser-search-input'}
          animatedProps={searchInputValue}
          clearButtonMode="while-editing"
          enablesReturnKeyAutomatically
          keyboardType="web-search"
          onBlur={onBlur}
          onChange={onSearchQueryChange}
          onSubmitEditing={handlePressGo}
          placeholder={i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder)}
          placeholderTextColor={labelQuaternary}
          ref={inputRef}
          returnKeyType="go"
          selectTextOnFocus
          spellCheck={false}
          style={[
            inputStyle,
            styles.input,
            {
              color: label,
            },
          ]}
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
  if (!url || url === '' || url === RAINBOW_HOME) return '';

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
    borderRadius: 18,
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
    width: '100%',
    zIndex: 99,
  },
  formattedInputText: {
    alignSelf: 'center',
    paddingHorizontal: 40,
  },
  formattedInputTextContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  gestureHandlerButton: {
    height: SEARCH_BAR_HEIGHT,
    width: '100%',
  },
  input: {
    flex: 1,
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
    borderRadius: 18,
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
});
