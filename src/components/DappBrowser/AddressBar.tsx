import validator from 'validator';
import { Input } from '@/components/inputs';
import { Box, useForegroundColor, Text } from '@/design-system';
import React, { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { NativeSyntheticEvent, TextInput, TextInputSubmitEditingEventData } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ToolbarIcon } from './BrowserToolbar';
import isValidDomain from 'is-valid-domain';
import { RAINBOW_HOME, useBrowserContext } from './BrowserContext';
import { ButtonPressAnimation } from '@/components/animations';
import useDimensions from '@/hooks/useDimensions';
import { BlurView } from '@react-native-community/blur';
import * as i18n from '@/languages';
import { AccountIcon } from './address-bar/AccountIcon';
import { TabButton } from './address-bar/TabButton';

const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=';
const HTTP = 'http://';
const HTTPS = 'https://';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const AnimatedInline = Animated.createAnimatedComponent(Box);

export const AddressBar = ({ setIsAddressBarFocused }: { setIsAddressBarFocused: Dispatch<SetStateAction<boolean>> }) => {
  const { tabStates, activeTabIndex, tabViewProgress, onRefresh, updateActiveTabState, toggleTabView } = useBrowserContext();

  const [url, setUrl] = useState<string>(tabStates[activeTabIndex].url);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const { width: deviceWidth } = useDimensions();

  const fill = useForegroundColor('fill');

  const lol = useForegroundColor('fillSecondary');

  const inputRef = useRef<TextInput>(null);

  const barStyle = useAnimatedStyle(() => ({
    opacity: 1 - (tabViewProgress?.value ?? 0),
    pointerEvents: (tabViewProgress?.value ?? 0) < 1 ? 'auto' : 'none',
    transform: [
      {
        translateY: interpolate(tabViewProgress?.value ?? 0, [0, 1], [0, 58], 'clamp'),
      },
      {
        scale: interpolate(tabViewProgress?.value ?? 0, [0, 1], [1, 0.9], 'clamp'),
      },
    ],
  }));

  const inputStyle = useAnimatedStyle(() => ({
    pointerEvents: (tabViewProgress?.value ?? 0) < 1 ? 'auto' : 'none',
    width: interpolate(isFocused ? 1 : 0, [1, 0], [deviceWidth - 100, deviceWidth - 120], 'clamp'),
    height: 48,
  }));

  const animationProgress = useSharedValue(0);

  useEffect(() => {
    if (isFocused) {
      animationProgress.value = withTiming(1, { duration: 200 });
    } else {
      animationProgress.value = withTiming(0, { duration: 200 });
    }
  }, [animationProgress, isFocused]);

  const inputUnderlayStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animationProgress.value ?? 0,
      [0, 1], // inputRange
      [fill, 'transparent']
    );

    return {
      pointerEvents: (tabViewProgress?.value ?? 0) < 1 ? 'auto' : 'none',
      width: interpolate(isFocused ? 1 : 0, [1, 0], [deviceWidth - 100, deviceWidth - 120], 'clamp'),
      height: 48,
      backgroundColor,
    };
  });

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
    if (validator.isURL(newUrl)) {
      setUrl(newUrl);
    }
  };

  const isGoogleSearch = url.startsWith(GOOGLE_SEARCH_URL);
  const isHome = formattedUrl === RAINBOW_HOME;
  const inputValue = isHome ? undefined : isFocused && !isGoogleSearch ? url : formattedUrl;

  const shouldShowDetails = !isFocused && !isHome;

  return (
    <AnimatedInline gap={12} style={[{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, barStyle]}>
      {shouldShowDetails && <AccountIcon />}
      <Box as={Animated.View} style={[inputStyle]}>
        <ButtonPressAnimation
          onPress={() => {
            if (!isFocused) {
              setIsFocused(true);
              setTimeout(() => {
                inputRef.current?.focus();
              }, 50);
            }
          }}
          pointerEvents={isFocused ? 'auto' : 'box-only'}
          scaleTo={0.975}
          style={{
            flexDirection: 'row',
          }}
        >
          <Input
            clearButtonMode="while-editing"
            enablesReturnKeyAutomatically
            å
            keyboardType="web-search"
            // i18n
            placeholder={i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder)}
            onBlur={() => {
              setIsAddressBarFocused(false);
              setIsFocused(false);
            }}
            onChangeText={onUrlChange}
            onFocus={() => {
              setIsAddressBarFocused(true);
              setIsFocused(true);
            }}
            onSubmitEditing={handleUrlSubmit}
            ref={inputRef}
            returnKeyType="go"
            selectTextOnFocus
            spellCheck={false}
            style={{
              borderRadius: 16,
              flex: 1,
              fontSize: 17,
              fontWeight: '500',
              height: 48,
              paddingHorizontal: 16,
              paddingVertical: 10,
              pointerEvents: isFocused ? 'auto' : 'none',
              textAlign: isFocused ? 'left' : 'center',
              zIndex: 99,
              elevation: 99,
              borderWidth: 1,
              borderColor: lol,
            }}
            value={inputValue}
          ></Input>
          <Box as={AnimatedBlurView} blurAmount={70} blurType={'dark'} style={[{ position: 'absolute', borderRadius: 16 }, inputStyle]} />
          <Box as={AnimatedInline} style={[{ position: 'absolute', borderRadius: 16 }, inputUnderlayStyle]} />
        </ButtonPressAnimation>
        {shouldShowDetails && (
          <Box position="absolute" style={{ left: 10, top: 15 }}>
            <ToolbarIcon color="labelSecondary" icon="􀍡" onPress={() => {}} size="icon 17px" />
          </Box>
        )}
        {!isHome && tabStates[activeTabIndex].url && !isFocused && (
          <Box position="absolute" style={{ right: 10, top: 15 }}>
            <ToolbarIcon color="labelSecondary" icon="􀅈" onPress={onRefresh} size="icon 17px" />
          </Box>
        )}
      </Box>

      <TabButton toggleTabView={toggleTabView} isFocused={isFocused} inputRef={inputRef} animationProgress={animationProgress} />
    </AnimatedInline>
  );
};
