import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import Input from '@/components/inputs/Input';
import * as i18n from '@/languages';
import { NativeSyntheticEvent, TextInputSubmitEditingEventData } from 'react-native';
import { ToolbarIcon } from '../BrowserToolbar';
import { IS_IOS } from '@/env';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/screens/Swap/utils';
import { DappBrowserShadows } from '../DappBrowserShadows';
import { RAINBOW_HOME, useBrowserContext } from '../BrowserContext';
import isValidDomain from 'is-valid-domain';

const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=';
const HTTP = 'http://';
const HTTPS = 'https://';

const AnimatedInput = Animated.createAnimatedComponent(Input);

export const SearchInput = () => {
  const {
    isSearchInputFocused,
    searchInputRef,
    tabStates,
    activeTabIndex,
    tabViewVisible,
    searchViewProgress,
    setIsSearchInputFocused,
    updateActiveTabState,
    onRefresh,
  } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const fillSecondary = useForegroundColor('fillSecondary');
  const labelSecondary = useForegroundColor('labelSecondary');
  const labelQuaternary = useForegroundColor('labelQuaternary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const [url, setUrl] = useState<string>(tabStates[activeTabIndex].url);

  const handleUrlSubmit = (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    let newUrl = event.nativeEvent.text;

    let urlForValidation = newUrl.replace(/^https?:\/\//, '');
    if (urlForValidation.endsWith('/')) {
      urlForValidation = urlForValidation.slice(0, -1);
    }

    if (!isValidDomain(urlForValidation, { wildcard: true })) {
      newUrl = GOOGLE_SEARCH_URL + newUrl;
    } else if (!newUrl.startsWith(HTTP) && !newUrl.startsWith(HTTPS)) {
      newUrl = HTTPS + newUrl;
    }

    updateActiveTabState(activeTabIndex, { url: newUrl });
  };

  const formattedUrl = useMemo(() => {
    try {
      const { hostname, pathname, search } = new URL(url);
      if (hostname === 'www.google.com' && pathname === '/search') {
        const params = new URLSearchParams(search);
        return params.get('q') || url;
      }
      return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    } catch {
      return url;
    }
  }, [url]);

  // url handling needs work
  useEffect(() => {
    if (tabStates[activeTabIndex].url !== url) {
      setUrl(tabStates[activeTabIndex].url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabIndex, tabStates]);

  const onUrlChange = (newUrl: string) => {
    setUrl(newUrl);
  };

  const isGoogleSearch = url.startsWith(GOOGLE_SEARCH_URL);
  const isHome = formattedUrl === RAINBOW_HOME;
  // eslint-disable-next-line no-nested-ternary
  const inputValue = isHome ? undefined : isSearchInputFocused && !isGoogleSearch ? url : formattedUrl;

  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  const isOnHomepage = tabStates[activeTabIndex].url === RAINBOW_HOME;

  const inputStyle = useAnimatedStyle(() => ({
    paddingLeft: 16 + (searchViewProgress?.value ?? 0) * 24,
  }));

  const onPress = useCallback(() => {
    if (!isSearchInputFocused) {
      setIsSearchInputFocused(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isSearchInputFocused, searchInputRef, setIsSearchInputFocused]);

  const onBlur = useCallback(() => {
    setIsSearchInputFocused(false);
  }, [setIsSearchInputFocused]);

  const onFocus = useCallback(() => {
    setIsSearchInputFocused(true);
  }, [setIsSearchInputFocused]);

  return (
    <DappBrowserShadows>
      <Box justifyContent="center" pointerEvents={tabViewVisible ? 'none' : 'auto'}>
        <ButtonPressAnimation
          onPress={onPress}
          pointerEvents={isSearchInputFocused ? 'auto' : 'box-only'}
          scaleTo={0.975}
          style={{
            flexDirection: 'row',
          }}
        >
          <MaskedView
            maskElement={
              <FadeMask
                fadeEdgeInset={isSearchInputFocused || !inputValue ? 0 : 36}
                fadeWidth={isSearchInputFocused || !inputValue ? 0 : 12}
                height={48}
              />
            }
            style={{
              alignItems: 'center',
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              zIndex: 99,
            }}
          >
            <AnimatedInput
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              keyboardType="web-search"
              // i18n
              placeholder={i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder)}
              placeholderTextColor={labelQuaternary}
              onBlur={onBlur}
              onChangeText={onUrlChange}
              onFocus={onFocus}
              onSubmitEditing={handleUrlSubmit}
              ref={searchInputRef}
              returnKeyType="go"
              selectTextOnFocus
              spellCheck={false}
              style={[
                inputStyle,
                {
                  color: labelSecondary,
                  flex: 1,
                  fontSize: 17,
                  fontWeight: '700',
                  height: 48,
                  marginRight: 8,
                  paddingRight: 8,
                  paddingVertical: 10,
                  pointerEvents: isSearchInputFocused ? 'auto' : 'none',
                  textAlign: isSearchInputFocused ? 'left' : 'center',
                  elevation: 99,
                },
              ]}
              value={inputValue}
            />
          </MaskedView>
          {IS_IOS && (
            <Box
              as={BlurView}
              blurAmount={20}
              blurType={isDarkMode ? 'dark' : 'light'}
              height={{ custom: 48 }}
              position="absolute"
              style={[{ borderRadius: 18 }]}
              pointerEvents={tabViewVisible ? 'none' : 'auto'}
              width="full"
            />
          )}
          <Box
            borderRadius={18}
            height={{ custom: 48 }}
            position="absolute"
            style={[
              { backgroundColor: buttonColor, borderColor: separatorSecondary, borderWidth: IS_IOS && isDarkMode ? THICK_BORDER_WIDTH : 0 },
            ]}
            pointerEvents={tabViewVisible ? 'none' : 'auto'}
            width="full"
          />
        </ButtonPressAnimation>
        {(isSearchInputFocused || !isOnHomepage) && (
          <Box position="absolute" style={{ left: 14 }}>
            <ToolbarIcon
              color="labelTertiary"
              disabled={isSearchInputFocused}
              icon={isSearchInputFocused ? '􀊫' : '􀍡'}
              onPress={() => {
                return;
              }}
              size="icon 17px"
            />
          </Box>
        )}
        {!isSearchInputFocused && !isOnHomepage && (
          <Box position="absolute" style={{ right: 14 }}>
            <ToolbarIcon color="labelTertiary" icon="􀅈" onPress={onRefresh} size="icon 17px" />
          </Box>
        )}
      </Box>
    </DappBrowserShadows>
  );
};
