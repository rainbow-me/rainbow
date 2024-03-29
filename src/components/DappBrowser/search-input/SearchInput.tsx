import React, { RefObject, useCallback, useMemo } from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { AnimatedText, Box, Cover, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import Input from '@/components/inputs/Input';
import * as i18n from '@/languages';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputFocusEventData, TextInputSubmitEditingEventData } from 'react-native';
import { ToolbarIcon } from '../ToolbarIcon';
import { IS_IOS } from '@/env';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/screens/Swap/utils/swaps';
import { BrowserButtonShadows } from '../DappBrowserShadows';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import font from '@/styles/fonts';
import { fontWithWidth } from '@/styles';
import { useBrowserContext } from '../BrowserContext';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedBlurView } from '@/__swaps__/screens/Swap/components/AnimatedBlurView';
import haptics from '@/utils/haptics';
import { useFavoriteDappsStore } from '@/state/favoriteDapps';
import { Site } from '@/state/browserState';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { getNameFromFormattedUrl, handleShareUrl } from '../utils';

const AnimatedInput = Animated.createAnimatedComponent(Input);

export const SearchInput = ({
  inputRef,
  formattedInputValue,
  inputValue,
  isGoogleSearch,
  isHome,
  onPressWorklet,
  onBlur,
  onSubmitEditing,
  isFocused,
  isFocusedValue,
}: {
  // canGoBack: boolean; // <- re-enable this when canGoBack behavior is fixed
  inputRef: RefObject<TextInput>;
  formattedInputValue: { value: string; tabIndex: number };
  inputValue: string | undefined;
  isGoogleSearch: boolean;
  isHome: boolean;
  onPressWorklet: () => void;
  onBlur: (event: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onSubmitEditing: (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  isFocused: boolean;
  isFocusedValue: SharedValue<boolean>;
}) => {
  const { animatedActiveTabIndex, goBack, onRefresh, tabViewProgress } = useBrowserContext();
  const { isFavorite, addFavorite, removeFavorite } = useFavoriteDappsStore();
  const { isDarkMode } = useColorMode();

  const fillSecondary = useForegroundColor('fillSecondary');
  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  const formattedUrl = formattedInputValue?.value;
  const formattedUrlValue = useDerivedValue(() => {
    return formattedInputValue?.tabIndex !== animatedActiveTabIndex?.value ? '' : formattedInputValue?.value;
  });

  const pointerEventsStyle = useAnimatedStyle(() => ({
    pointerEvents: (tabViewProgress?.value || 0) / 100 < 1 ? 'auto' : 'none',
  }));

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

  const hideFormattedUrlWhenTabChanges = useAnimatedStyle(() => ({
    opacity: withSpring(formattedInputValue?.tabIndex !== animatedActiveTabIndex?.value ? 0 : 1, SPRING_CONFIGS.snappierSpringConfig),
  }));

  const toolbarIconStyle = useAnimatedStyle(() => ({
    opacity:
      isHome || isFocusedValue.value || !formattedUrlValue.value
        ? withTiming(0, TIMING_CONFIGS.fadeConfig)
        : withSpring(1, SPRING_CONFIGS.keyboardConfig),
    pointerEvents: isHome || isFocusedValue.value || !formattedUrlValue.value ? 'none' : 'auto',
  }));

  const handleFavoritePress = useCallback(() => {
    if (inputValue) {
      if (isFavorite(inputValue)) {
        removeFavorite(inputValue);
      } else {
        const site: Omit<Site, 'timestamp'> = {
          name: getNameFromFormattedUrl(formattedUrl),
          url: inputValue,
          // ⚠️ Removed the favicons for now since they tend to be worse
          // than having no image. Need to pull in dapp metadata and ideally
          // grab the website's apple-touch-icon as a fallback if it exists.
          image: '',
        };
        addFavorite(site);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedUrl, inputValue]);

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
        !isGoogleSearch
          ? {
              actionKey: 'favorite',
              actionTitle: isFavorite(formattedUrl) ? 'Undo Favorite' : 'Favorite',
              icon: {
                iconType: 'SYSTEM',
                iconValue: isFavorite(formattedUrl) ? 'star.slash' : 'star',
              },
            }
          : {},
        // ⚠️ TODO: Re-enable this when canGoBack behavior is fixed:
        // canGoBack
        //   ? {
        //       actionKey: 'back',
        //       actionTitle: 'Back',
        //       icon: {
        //         iconType: 'SYSTEM',
        //         iconValue: 'arrow.uturn.left',
        //       },
        //     }
        //   : {},
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [/* canGoBack, */ isFavorite(formattedUrl), isGoogleSearch]
  );

  const onPressMenuItem = async ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: 'share' | 'favorite' | 'back' } }) => {
    haptics.selection();
    if (actionKey === 'favorite') {
      handleFavoritePress();
    } else if (actionKey === 'back') {
      goBack();
    } else if (inputValue) {
      handleShareUrl(inputValue);
    }
  };

  return (
    <BrowserButtonShadows>
      <Box as={Animated.View} justifyContent="center" style={pointerEventsStyle}>
        <GestureHandlerV1Button
          disabled={isFocused}
          onPressWorklet={onPressWorklet}
          scaleTo={0.965}
          style={[
            buttonWrapperStyle,
            {
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            },
          ]}
        >
          <MaskedView
            maskElement={
              <FadeMask
                fadeEdgeInset={isFocused || !inputValue ? 0 : 36}
                fadeWidth={isFocused || !inputValue ? 0 : 12}
                height={48}
                side="right"
              />
            }
            style={{
              alignItems: 'center',
              flex: 1,
              flexDirection: 'row',
              height: 48,
              justifyContent: 'center',
              zIndex: 99,
            }}
          >
            <AnimatedInput
              clearButtonMode="while-editing"
              enablesReturnKeyAutomatically
              keyboardType="web-search"
              placeholder={i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder)}
              placeholderTextColor={labelQuaternary}
              onBlur={onBlur}
              onSubmitEditing={onSubmitEditing}
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
              defaultValue={inputValue}
            />
            <Cover alignHorizontal="center" alignVertical="center" pointerEvents="none">
              <Box alignItems="center" as={Animated.View} height="full" justifyContent="center" style={formattedInputStyle} width="full">
                <AnimatedText
                  align={isHome ? 'center' : undefined}
                  color={isHome ? 'labelQuaternary' : 'label'}
                  ellipsizeMode="clip"
                  numberOfLines={1}
                  size="17pt"
                  style={[{ alignSelf: 'center', paddingHorizontal: isHome ? 0 : 40 }, hideFormattedUrlWhenTabChanges]}
                  text={formattedUrlValue}
                  weight="bold"
                />
              </Box>
            </Cover>
          </MaskedView>
          {IS_IOS && (
            <Box
              as={AnimatedBlurView}
              blurAmount={20}
              blurType={isDarkMode ? 'dark' : 'light'}
              height={{ custom: 48 }}
              position="absolute"
              style={[{ borderCurve: 'continuous', borderRadius: 18 }, pointerEventsStyle]}
              width="full"
            />
          )}
          <Box
            as={Animated.View}
            borderRadius={18}
            height={{ custom: 48 }}
            position="absolute"
            style={[
              {
                backgroundColor: buttonColor,
                borderColor: separatorSecondary,
                borderWidth: IS_IOS && isDarkMode ? THICK_BORDER_WIDTH : 0,
                overflow: 'hidden',
              },
              pointerEventsStyle,
            ]}
            width="full"
          />
        </GestureHandlerV1Button>
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
};

const styles = StyleSheet.create({
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
    ...fontWithWidth(font.weight.semibold),
  },
});
