import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, NativeSyntheticEvent, StyleSheet, TextInput, TextInputChangeEventData } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_MOUNT_ANIMATIONS } from '@/components/utilities/MountWhenFocused';
import { Border, Box, Text, TextShadow, useColorMode } from '@/design-system';
import { typeHierarchy } from '@/design-system/typography/typeHierarchy';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import Routes from '@/navigation/routesNames';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { AnimatedInput } from '@/components/AnimatedComponents/AnimatedInput';
import { Navigation } from '@/navigation';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { fontWithWidth } from '@/styles/buildTextStyles';
import font from '@/styles/fonts';
import { hyperliquidMarketsActions } from '@/features/perps/stores/hyperliquidMarketsStore';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { PerpPositionSide } from '@/features/perps/types';
import { hyperliquidAccountActions, useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { logger, RainbowError } from '@/logger';
import { PerpsRoute } from '@/navigation/types';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { getHyperliquidTokenId, parseHyperliquidErrorMessage } from '@/features/perps/utils';
import { useOrderAmountValidation } from '@/features/perps/stores/derived/useOrderAmountValidation';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { PerpsNavigation, usePerpsNavigationStore } from '@/features/perps/screens/PerpsNavigator';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import i18n from '@/languages';
import LinearGradient from 'react-native-linear-gradient';
import { IS_ANDROID } from '@/env';
import { analytics } from '@/analytics';

const BUTTON_HEIGHT = 48;

type BackButtonProps = {
  onPress: () => void;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

function BackButton({ onPress, backgroundColor, borderColor, textColor }: BackButtonProps) {
  return (
    <ButtonPressAnimation onPress={onPress}>
      <Box
        borderRadius={24}
        height={BUTTON_HEIGHT}
        width={BUTTON_HEIGHT}
        justifyContent={'center'}
        alignItems={'center'}
        backgroundColor={backgroundColor}
        borderWidth={2}
        borderColor={{ custom: borderColor }}
      >
        <Text size="20pt" weight={'black'} color={{ custom: textColor }}>
          {'􀯶'}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}

const PerpsSearchScreenFooter = () => {
  const { accentColors } = usePerpsAccentColorContext();
  const inputRef = useAnimatedRef<TextInput>();

  const onSearchQueryChange = useCallback((event: NativeSyntheticEvent<TextInputChangeEventData>) => {
    hyperliquidMarketsActions.setSearchQuery(event.nativeEvent.text);
  }, []);

  useEffect(() => {
    return () => hyperliquidMarketsActions.setSearchQuery('');
  }, []);

  return (
    <Box flexDirection={'row'} gap={12} width="full" alignItems={'center'} justifyContent={'space-between'}>
      <BackButton
        onPress={() => PerpsNavigation.navigate(Routes.PERPS_ACCOUNT_SCREEN)}
        backgroundColor={accentColors.opacity12}
        borderColor={accentColors.opacity6}
        textColor={accentColors.opacity100}
      />
      <Box
        height={BUTTON_HEIGHT}
        borderRadius={20}
        backgroundColor={accentColors.opacity12}
        borderColor={{ custom: accentColors.opacity6 }}
        borderWidth={2}
        style={{ flex: 1 }}
        alignItems={'center'}
        flexDirection={'row'}
        paddingHorizontal={'16px'}
      >
        <TextShadow shadowOpacity={0.24} blur={8}>
          <Text size="17pt" weight="heavy" color={{ custom: accentColors.opacity100 }}>
            {'􀊫'}
          </Text>
        </TextShadow>
        <AnimatedInput
          clearButtonMode="while-editing"
          enablesReturnKeyAutomatically
          onChange={onSearchQueryChange}
          placeholder={i18n.perps.search.search_markets()}
          placeholderTextColor={accentColors.opacity40}
          ref={inputRef}
          returnKeyType="go"
          spellCheck={false}
          selectionColor={accentColors.opacity100}
          style={[styles.input, { color: accentColors.opacity100 }]}
          textAlign="left"
          textAlignVertical="center"
        />
      </Box>
    </Box>
  );
};

const PerpsAccountScreenFooter = () => {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  const safeAreaInsets = useSafeAreaInsets();
  const balance = useHyperliquidAccountStore(state => state.getBalance());
  const hasZeroBalance = Number(balance) === 0;
  const hasNoAssets = useUserAssetsStore(state => !state.getFilteredUserAssetIds().length);

  return (
    <>
      {!isDarkMode && (
        <Box
          style={[
            styles.gradientFill,
            {
              bottom: -(Math.max(safeAreaInsets.bottom, PADDING) + 4),
            },
          ]}
        >
          <Box style={StyleSheet.absoluteFillObject} backgroundColor={accentColors.opacity100} />
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.96)', 'rgba(255, 255, 255, 0.88)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Box>
      )}
      <HyperliquidButton
        onPress={() => {
          if (hasZeroBalance) {
            Navigation.handleAction(hasNoAssets ? Routes.ADD_CASH_SHEET : Routes.PERPS_DEPOSIT_SCREEN);
          } else {
            PerpsNavigation.navigate(Routes.PERPS_SEARCH_SCREEN, { type: 'newPosition' });
          }
        }}
        paddingVertical={'12px'}
        borderRadius={24}
        height={BUTTON_HEIGHT}
        justifyContent={'center'}
        alignItems={'center'}
      >
        <Text size="20pt" weight={'black'} color={isDarkMode ? 'black' : 'white'}>
          {hasNoAssets ? i18n.perps.actions.fund_wallet() : hasZeroBalance ? i18n.perps.deposit.title() : i18n.perps.actions.new_position()}
        </Text>
      </HyperliquidButton>
    </>
  );
};

const PerpsNewPositionScreenFooter = memo(function PerpsNewPositionScreenFooter() {
  const { accentColors } = usePerpsAccentColorContext();
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();

  const isValidOrder = useOrderAmountValidation(state => state.isValid);
  const positionSide = useHlNewPositionStore(state => state.positionSide);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const green = accentColors.longGreen;
  const red = accentColors.shortRed;

  const isLong = positionSide === PerpPositionSide.LONG;

  const button = useMemo(() => {
    const positionSideColor = isLong ? green : red;
    const darkModeTextColor = isValidOrder ? (isLong ? 'black' : 'white') : opacityWorklet(positionSideColor, 0.4);
    const lightModeTextColor = isValidOrder ? 'white' : opacityWorklet(positionSideColor, 0.4);
    const backTextColor = isDarkMode ? (isLong ? 'black' : 'white') : 'white';
    return {
      textColor: isDarkMode ? darkModeTextColor : lightModeTextColor,
      backTextColor,
      backgroundColor: positionSideColor,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      text: isLong ? i18n.perps.new_position.hold_to_long() : i18n.perps.new_position.hold_to_short(),
      disabledBackgroundColor: getSolidColorEquivalent({
        background: accentColors.surfacePrimary,
        foreground: positionSideColor,
        opacity: 0.07,
      }),
    };
  }, [green, red, isValidOrder, isDarkMode, accentColors, isLong]);

  const submitNewPosition = useCallback(async () => {
    const { market, positionSide, leverage, amount, triggerOrders } = useHlNewPositionStore.getState();
    if (!market || !leverage) return;

    setIsSubmitting(true);

    const perpsBalance = Number(useHyperliquidAccountStore.getState().getValue());

    try {
      const livePrice = useLiveTokensStore.getState().tokens[getHyperliquidTokenId(market.symbol)].midPrice;
      const entryPrice = livePrice ?? market.price;
      await hyperliquidAccountActions.createIsolatedMarginPosition({
        symbol: market.symbol,
        side: positionSide,
        leverage,
        marginAmount: amount,
        // There is not case in which the live price should actually be null at this point
        price: entryPrice,
        triggerOrders,
      });

      const positionValue = Number(amount) * leverage;
      const positionSize = positionValue / Number(entryPrice);

      analytics.track(analytics.event.perpsOpenedPosition, {
        market: market.symbol,
        side: positionSide,
        leverage,
        perpsBalance: Number(useHyperliquidAccountStore.getState().getValue()),
        positionSize,
        positionValue,
        entryPrice: Number(entryPrice),
        triggerOrders: triggerOrders.map(order => ({
          type: order.type,
          price: Number(order.price),
        })),
      });

      PerpsNavigation.navigate(Routes.PERPS_ACCOUNT_SCREEN, { scrollToTop: true });
    } catch (e) {
      const errorMessage = parseHyperliquidErrorMessage(e);
      analytics.track(analytics.event.perpsOpenPositionFailed, {
        market: market.symbol,
        side: positionSide,
        leverage,
        perpsBalance,
        errorMessage,
      });
      Alert.alert(i18n.perps.common.error_submitting_order(), errorMessage);
      logger.error(new RainbowError('[PerpsNewPositionScreenFooter] Failed to submit new position', e));
    }
    setIsSubmitting(false);
  }, []);

  return (
    <>
      {isDarkMode && (
        <Box
          style={[
            styles.gradientFill,
            {
              bottom: -(Math.max(safeAreaInsets.bottom, PADDING) + 4),
            },
          ]}
        >
          <Box style={StyleSheet.absoluteFillObject} backgroundColor={accentColors.opacity100} />
          <LinearGradient
            colors={isLong ? [accentColors.surfacePrimary, '#142A18'] : [accentColors.surfacePrimary, '#2A1614']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 2 }}
          />
        </Box>
      )}
      <Box flexDirection={'row'} gap={12} width="full" alignItems={'center'} justifyContent={'space-between'}>
        <BackButton
          onPress={() => PerpsNavigation.navigate(Routes.PERPS_SEARCH_SCREEN, { type: 'newPosition' })}
          backgroundColor={button.backgroundColor}
          borderColor={button.borderColor}
          textColor={button.backTextColor}
        />

        <Box style={{ flex: 1 }}>
          <HoldToActivateButton
            disabled={!isValidOrder}
            backgroundColor={button.backgroundColor}
            disabledBackgroundColor={button.disabledBackgroundColor}
            isProcessing={isSubmitting}
            showBiometryIcon={false}
            processingLabel={i18n.perps.common.submitting()}
            label={button.text}
            onLongPress={submitNewPosition}
            height={BUTTON_HEIGHT}
            color={{ custom: button.textColor }}
            size="20pt"
            weight="black"
            progressColor={button.textColor}
          />
        </Box>
      </Box>
    </>
  );
});

const TOP_BORDER_WIDTH = 2;
const PADDING = 20;
// It is not clear where this 6 comes from
const MAGIC_KEYBOARD_OFFSET_NUDGE = 6;

export const PerpsNavigatorFooter = memo(function PerpsNavigatorFooter() {
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();
  const { accentColors } = usePerpsAccentColorContext();

  const enableStickyKeyboard = useNavigationStore(state => state.activeRoute !== Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET);
  const footerHeight = BUTTON_HEIGHT + PADDING + Math.max(safeAreaInsets.bottom, PADDING) + 4;

  return (
    <>
      {/* Required to block touches from passing through on Android */}
      {IS_ANDROID && <Box position="absolute" bottom="0px" left="0px" right="0px" width="full" height={footerHeight} />}
      <KeyboardStickyView offset={{ opened: safeAreaInsets.bottom + MAGIC_KEYBOARD_OFFSET_NUDGE - PADDING }} enabled={enableStickyKeyboard}>
        <Box
          position="absolute"
          bottom="0px"
          left="0px"
          right="0px"
          width="full"
          shadow={'24px'}
          style={{
            shadowOffset: {
              width: 0,
              height: -8,
            },
            borderTopWidth: isDarkMode ? TOP_BORDER_WIDTH : 0,
            borderTopColor: accentColors.opacity10,
            paddingBottom: Math.max(safeAreaInsets.bottom, PADDING) + 4,
            paddingTop: isDarkMode ? PADDING - TOP_BORDER_WIDTH : PADDING,
            backgroundColor: isDarkMode ? accentColors.surfacePrimary : 'white',
          }}
        >
          <Box as={Animated.View} paddingHorizontal="20px">
            <MountWhenFocused route={Routes.PERPS_ACCOUNT_SCREEN}>
              <PerpsAccountScreenFooter />
            </MountWhenFocused>

            <MountWhenFocused route={Routes.PERPS_SEARCH_SCREEN}>
              <PerpsSearchScreenFooter />
            </MountWhenFocused>

            <MountWhenFocused route={Routes.PERPS_NEW_POSITION_SCREEN}>
              <PerpsNewPositionScreenFooter />
            </MountWhenFocused>
          </Box>
        </Box>
      </KeyboardStickyView>
    </>
  );
});

export const MountWhenFocused = ({ children, route }: { children: React.ReactNode; route: PerpsRoute }) => {
  const isRouteActive = usePerpsNavigationStore(state => state.isRouteActive(route));
  if (!isRouteActive) return null;
  return (
    <Animated.View entering={DEFAULT_MOUNT_ANIMATIONS.entering} exiting={DEFAULT_MOUNT_ANIMATIONS.exiting}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    alignItems: 'center',
    flex: 1,
    height: BUTTON_HEIGHT,
    justifyContent: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 20,
    height: BUTTON_HEIGHT,
    letterSpacing: typeHierarchy['text']['20pt'].letterSpacing,
    paddingLeft: 10,
    paddingRight: 9,
    paddingVertical: 10,
    zIndex: 100,
    ...fontWithWidth(font.weight.semibold),
  },
  gradientFill: {
    position: 'absolute',
    top: -PADDING + TOP_BORDER_WIDTH,
    left: -PADDING,
    right: -PADDING,
  },
});
