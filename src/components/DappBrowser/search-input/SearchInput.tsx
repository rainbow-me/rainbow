import React, { useCallback, useMemo } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputSubmitEditingEventData, View } from 'react-native';
// import MaskedView from '@react-native-masked-view/masked-view';
import { AnimatedText, Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  DerivedValue,
  SharedValue,
  dispatchCommand,
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
// import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { opacity } from '@/__swaps__/utils/swaps';
import haptics from '@/utils/haptics';
import { useBrowserContext } from '../BrowserContext';
import { BrowserButtonShadows } from '../DappBrowserShadows';
import { ToolbarIcon } from '../ToolbarIcon';
import { RAINBOW_HOME } from '../constants';
import { getNameFromFormattedUrl, handleShareUrl } from '../utils';

const SEARCH_PLACEHOLDER_TEXT = i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder);

export const SearchInput = React.memo(function SearchInput({
  inputRef,
  onPressWorklet,
  onBlur,
  onSubmitEditing,
  isFocused,
  isFocusedValue,
  canGoBack,
  canGoForward,
}: {
  inputRef: AnimatedRef<TextInput>;
  onPressWorklet: () => void;
  onBlur: () => void;
  onSubmitEditing: (currentUrl: string | undefined, updatedUrl: string) => void;
  isFocused: boolean;
  isFocusedValue: SharedValue<boolean>;
  canGoBack: boolean;
  canGoForward: boolean;
}) {
  const { activeTabInfo, goBack, goForward, onRefresh, tabViewProgress } = useBrowserContext();

  const addFavorite = useFavoriteDappsStore(state => state.addFavorite);
  const removeFavorite = useFavoriteDappsStore(state => state.removeFavorite);

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

  const isFavorite = useFavoriteDappsStore(state => state.isFavorite(formattedUrlValue.value));

  const handleFavoritePress = useCallback(() => {
    // const url = animatedTabUrls.value[currentlyOpenTabIds.value[Math.abs(animatedActiveTabIndex.value)]];
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

  const menuConfig = useMemo(
    () => ({
      menuTitle: '',
      menuItems: [
        {
          actionKey: 'share',
          actionTitle: 'Share',
          icon: {
            iconType: 'SYSTEM',
            iconValue: 'square.and.arrow.up',
          },
        },
        !activeTabInfo.value.isGoogleSearch
          ? {
              actionKey: 'favorite',
              actionTitle: isFavorite ? 'Undo Favorite' : 'Favorite',
              icon: {
                iconType: 'SYSTEM',
                iconValue: isFavorite ? 'star.slash' : 'star',
              },
            }
          : {},
        canGoForward
          ? {
              actionKey: 'forward',
              actionTitle: 'Forward',
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'arrowshape.forward',
              },
            }
          : {},
        canGoBack
          ? {
              actionKey: 'back',
              actionTitle: 'Back',
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'arrowshape.backward',
              },
            }
          : {},
      ],
    }),

    [activeTabInfo, canGoBack, canGoForward, isFavorite]
  );

  const onPressMenuItem = async ({
    nativeEvent: { actionKey },
  }: {
    nativeEvent: { actionKey: 'share' | 'favorite' | 'back' | 'forward' };
  }) => {
    haptics.selection();
    if (actionKey === 'favorite') {
      handleFavoritePress();
    } else if (actionKey === 'back') {
      goBack();
    } else if (actionKey === 'forward') {
      goForward();
    } else {
      const url = activeTabInfo.value.url;
      if (url) handleShareUrl(url);
    }
  };

  return (
    <BrowserButtonShadows>
      <Box as={Animated.View} justifyContent="center" style={pointerEventsStyle}>
        <AddressBar
          formattedUrlValue={formattedUrlValue}
          isFocusedValue={isFocusedValue}
          inputRef={inputRef}
          isFocused={isFocused}
          onBlur={onBlur}
          onPressWorklet={onPressWorklet}
          onSubmitEditing={onSubmitEditing}
          pointerEventsStyle={pointerEventsStyle}
        />
        <Box as={Animated.View} left="0px" position="absolute" style={toolbarIconStyle}>
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
        </Box>
        <Box as={Animated.View} position="absolute" right="0px" style={toolbarIconStyle}>
          <ToolbarIcon color="label" icon="􀅈" onPress={onRefresh} side="right" size="icon 17px" weight="heavy" />
        </Box>
      </Box>
    </BrowserButtonShadows>
  );
});

const AddressBar = React.memo(function AddressBar({
  formattedUrlValue,
  isFocusedValue,
  inputRef,
  isFocused,
  onBlur,
  onPressWorklet,
  onSubmitEditing,
  pointerEventsStyle,
}: {
  formattedUrlValue: DerivedValue<string>;
  isFocusedValue: SharedValue<boolean>;
  inputRef: AnimatedRef<TextInput>;
  isFocused: boolean;
  onBlur: () => void;
  onPressWorklet: () => void;
  onSubmitEditing: (currentUrl: string | undefined, updatedUrl: string) => void;
  pointerEventsStyle: AnimatedStyle;
}) {
  const { activeTabInfo } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const fillSecondary = useForegroundColor('fillSecondary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  const buttonWrapperStyle = useAnimatedStyle(() => ({
    pointerEvents: isFocusedValue.value ? 'auto' : 'box-only',
  }));

  const inputStyle = useAnimatedStyle(() => ({
    opacity: isFocusedValue.value ? withSpring(1, SPRING_CONFIGS.keyboardConfig) : withTiming(0, TIMING_CONFIGS.fadeConfig),
    pointerEvents: isFocusedValue.value ? 'auto' : 'none',
  }));

  const formattedInputStyle = useAnimatedStyle(() => ({
    opacity: isFocusedValue.value ? withTiming(0, TIMING_CONFIGS.fadeConfig) : withSpring(1, SPRING_CONFIGS.keyboardConfig),
  }));

  const formattedInputTextStyle = useAnimatedStyle(() => ({
    color: formattedUrlValue.value === SEARCH_PLACEHOLDER_TEXT ? labelQuaternary : label,
    paddingHorizontal: formattedUrlValue.value === SEARCH_PLACEHOLDER_TEXT ? 0 : 40,
  }));

  const searchInputValue = useAnimatedProps(() => {
    const urlOrSearchQuery = formatUrlForSearchInput(activeTabInfo.value.url);

    // Removing the value when the input is focused allows the input to be reset to the correct value on blur
    const url = isFocusedValue.value ? undefined : urlOrSearchQuery;

    return { defaultValue: urlOrSearchQuery, text: url };
  });

  const updateUrl = useCallback(
    (newUrl: string) => {
      'worklet';
      if (newUrl) {
        onSubmitEditing(activeTabInfo.value.url, newUrl);
      }
    },
    [activeTabInfo, onSubmitEditing]
  );

  const handlePressGo = useCallback(
    (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      dispatchCommand(inputRef, 'blur');

      const newUrl = event.nativeEvent.text;
      runOnUI(updateUrl)(newUrl);
    },
    [inputRef, updateUrl]
  );

  return (
    <GestureHandlerV1Button
      disabled={isFocused}
      onPressWorklet={onPressWorklet}
      scaleTo={0.965}
      style={[buttonWrapperStyle, styles.buttonWrapper]}
    >
      <AnimatedInput
        clearButtonMode="while-editing"
        enablesReturnKeyAutomatically
        keyboardType="web-search"
        placeholder={i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder)}
        placeholderTextColor={labelQuaternary}
        onBlur={onBlur}
        onSubmitEditing={handlePressGo}
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
        animatedProps={searchInputValue}
      />
      {/* <MaskedView
        maskElement={
          <FadeMask
            fadeEdgeInset={isFocused || formattedUrlValue.value === SEARCH_PLACEHOLDER_TEXT ? 0 : 36}
            fadeWidth={isFocused || formattedUrlValue.value === SEARCH_PLACEHOLDER_TEXT ? 0 : 12}
            height={48}
            side="right"
          />
        }
        style={styles.fadeMaskStyle}
      > */}
      <View style={styles.fadeMaskStyle}>
        <Animated.View style={[formattedInputStyle, styles.formattedInputTextContainer]}>
          <AnimatedText
            align="center"
            ellipsizeMode="clip"
            numberOfLines={1}
            size="17pt"
            style={[styles.formattedInputText, formattedInputTextStyle]}
            weight="bold"
          >
            {formattedUrlValue}
          </AnimatedText>
        </Animated.View>
      </View>
      {/* </MaskedView> */}
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
  blurViewStyle: { borderCurve: 'continuous', borderRadius: 18, height: 48, position: 'absolute', width: '100%' },
  buttonWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fadeMaskStyle: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
    zIndex: 99,
  },
  formattedInputText: {
    alignSelf: 'center',
  },
  formattedInputTextContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 20,
    height: IS_IOS ? 48 : 60,
    letterSpacing: 0.36,
    lineHeight: IS_IOS ? undefined : 24,
    marginRight: 7,
    paddingLeft: 16,
    paddingRight: 9,
    paddingVertical: 10,
    width: '100%',
    zIndex: 100,
    ...fontWithWidth(font.weight.semibold),
  },
  inputBorderStyle: {
    borderCurve: 'continuous',
    borderRadius: 18,
    height: 48,
    overflow: 'hidden',
    position: 'absolute',
    width: '100%',
  },
});
