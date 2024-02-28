import { Input } from '@/components/inputs';
import { Box, globalColors, useForegroundColor } from '@/design-system';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NativeSyntheticEvent, TextInput, TextInputSubmitEditingEventData } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { ToolbarIcon } from './BrowserToolbar';
import isValidDomain from 'is-valid-domain';
import { useBrowserContext } from './BrowserContext';
import { ButtonPressAnimation } from '@/components/animations';

const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=';
const HTTP = 'http://';
const HTTPS = 'https://';

export const AddressBar = () => {
  const { tabStates, activeTabIndex, onRefresh, tabViewProgress, updateActiveTabState } = useBrowserContext();

  const fill = useForegroundColor('fill');

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

  const [url, setUrl] = useState<string>(tabStates[activeTabIndex].url);
  const [isFocused, setIsFocused] = useState<boolean>(false);

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

  const isGoogleSearch = url.startsWith(GOOGLE_SEARCH_URL);

  return (
    <Box as={Animated.View} style={[barStyle, { position: 'relative' }]}>
      <ButtonPressAnimation
        onPress={() => {
          if (!isFocused) {
            setIsFocused(true);
            setTimeout(() => {
              inputRef.current?.focus();
            }, 50);
          }
        }}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        pointerEvents={isFocused ? 'auto' : 'box-only'}
        scaleTo={0.975}
        style={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Input
          clearButtonMode="while-editing"
          enablesReturnKeyAutomatically
          å
          keyboardType="web-search"
          onBlur={() => setIsFocused(false)}
          onChangeText={setUrl}
          onFocus={() => setIsFocused(true)}
          onSubmitEditing={handleUrlSubmit}
          placeholderText="Search or enter website name"
          ref={inputRef}
          returnKeyType="go"
          selectTextOnFocus
          spellCheck={false}
          style={{
            backgroundColor: fill,
            borderRadius: 16,
            color: globalColors.white100,
            flex: 1,
            fontSize: 17,
            fontWeight: '500',
            height: 48,
            paddingHorizontal: 16,
            paddingVertical: 10,
            pointerEvents: isFocused ? 'auto' : 'none',
          }}
          value={isFocused && !isGoogleSearch ? url : formattedUrl}
        />
      </ButtonPressAnimation>
      <Box position="absolute" style={{ right: 26, top: 25 }}>
        <ToolbarIcon color="label" icon="􀅈" onPress={onRefresh} size="icon 17px" />
      </Box>
    </Box>
  );
};
