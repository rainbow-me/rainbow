import React, { RefObject } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import Input from '@/components/inputs/Input';
import * as i18n from '@/languages';
import { NativeSyntheticEvent, TextInput, TextInputSubmitEditingEventData } from 'react-native';
import { ToolbarIcon } from '../BrowserToolbar';
import { IS_IOS } from '@/env';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/screens/Swap/utils';
import { DappBrowserShadows } from '../DappBrowserShadows';
import { useBrowserContext } from '../BrowserContext';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const SearchInput = ({
  inputValue,
  onPress,
  onBlur,
  onFocus,
  onChangeText,
  onSubmitEditing,
  tabViewProgress,
  shouldShowMenuButton,
  shouldShowRefreshButton,
  onRefresh,
}: {
  inputValue: string | undefined;
  onPress: () => void;
  onBlur: () => void;
  onFocus: () => void;
  onChangeText: (newUrl: string) => void;
  onSubmitEditing: (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  tabViewProgress: SharedValue<number> | undefined;
  shouldShowMenuButton: boolean;
  shouldShowRefreshButton: boolean;
  onRefresh: () => void;
}) => {
  const { isSearchInputFocused, searchInputRef } = useBrowserContext();
  const { isDarkMode } = useColorMode();

  const fillSecondary = useForegroundColor('fillSecondary');
  const labelSecondary = useForegroundColor('labelSecondary');
  const labelQuaternary = useForegroundColor('labelQuaternary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  const inputStyle = useAnimatedStyle(() => ({
    pointerEvents: (tabViewProgress?.value ?? 0) < 1 ? 'auto' : 'none',
  }));

  return (
    <DappBrowserShadows>
      <Box as={Animated.View} justifyContent="center" style={inputStyle}>
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
            <Input
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              keyboardType="web-search"
              // i18n
              placeholder={i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder)}
              placeholderTextColor={labelQuaternary}
              onBlur={onBlur}
              onChangeText={onChangeText}
              onFocus={onFocus}
              onSubmitEditing={onSubmitEditing}
              ref={searchInputRef}
              returnKeyType="go"
              selectTextOnFocus
              spellCheck={false}
              style={{
                color: labelSecondary,
                flex: 1,
                fontSize: 17,
                fontWeight: '700',
                height: 48,
                marginRight: 8,
                paddingLeft: 16,
                paddingRight: 8,
                paddingVertical: 10,
                pointerEvents: isSearchInputFocused ? 'auto' : 'none',
                textAlign: isSearchInputFocused ? 'left' : 'center',
                elevation: 99,
              }}
              value={inputValue}
            />
          </MaskedView>
          {IS_IOS && (
            <Box
              as={AnimatedBlurView}
              blurAmount={20}
              blurType={isDarkMode ? 'dark' : 'light'}
              height={{ custom: 48 }}
              position="absolute"
              style={[{ borderRadius: 18 }, inputStyle]}
              width="full"
            />
          )}
          <Box
            as={Animated.View}
            borderRadius={18}
            height={{ custom: 48 }}
            position="absolute"
            style={[
              { backgroundColor: buttonColor, borderColor: separatorSecondary, borderWidth: IS_IOS && isDarkMode ? THICK_BORDER_WIDTH : 0 },
              inputStyle,
            ]}
            width="full"
          />
        </ButtonPressAnimation>
        {shouldShowMenuButton && (
          <Box position="absolute" style={{ left: 14 }}>
            <ToolbarIcon
              color="labelSecondary"
              icon="􀍡"
              onPress={() => {
                return;
              }}
              size="icon 17px"
            />
          </Box>
        )}
        {shouldShowRefreshButton && (
          <Box position="absolute" style={{ right: 14 }}>
            <ToolbarIcon color="labelSecondary" icon="􀅈" onPress={onRefresh} size="icon 17px" />
          </Box>
        )}
      </Box>
    </DappBrowserShadows>
  );
};
