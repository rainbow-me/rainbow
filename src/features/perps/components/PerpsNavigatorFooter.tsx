import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text, TextIcon, TextShadow, useForegroundColor } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputChangeEventData, View } from 'react-native';
import { Portal } from '@/react-native-cool-modals/Portal';
import { PerpsAccentColorContextProvider, usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { HYPERLIQUID_COLORS, PERPS_COLORS } from '@/features/perps/constants';
import { ButtonPressAnimation } from '@/components/animations';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import Routes from '@/navigation/routesNames';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import Animated, {
  dispatchCommand,
  runOnUI,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { AnimatedInput } from '@/components/AnimatedComponents/AnimatedInput';
import { Navigation } from '@/navigation';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { fontWithWidth } from '@/styles/buildTextStyles';
import font from '@/styles/fonts';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { PerpPositionSide } from '@/features/perps/types';
import { hyperliquidAccountStoreActions } from '@/features/perps/stores/hyperliquidAccountStore';
import { logger, RainbowError } from '@/logger';
import { HoldToActivateButton } from '@/screens/token-launcher/components/HoldToActivateButton';

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
  // const isFocused = useSharedValue<boolean>(false);

  // const onPressSearchWorklet = useCallback(() => {
  //   'worklet';
  //   isFocused.value = true;
  //   dispatchCommand(inputRef, 'focus');
  // }, []);

  // const onBlurWorklet = useCallback(() => {
  //   'worklet';
  //   console.log('onBlurWorklet');
  //   isFocused.value = false;
  // }, [isFocused]);

  // const onFocusWorklet = useCallback(() => {
  //   'worklet';
  //   console.log('onFocusWorklet');
  //   isFocused.value = true;
  // }, [isFocused]);

  const onSearchQueryChange = useCallback((event: NativeSyntheticEvent<TextInputChangeEventData>) => {
    useHyperliquidMarketsStore.getState().setSearchQuery(event.nativeEvent.text);
  }, []);

  useEffect(() => {
    return () => {
      useHyperliquidMarketsStore.getState().setSearchQuery('');
    };
  }, []);

  return (
    <Box flexDirection={'row'} gap={12} width="full" alignItems={'center'} justifyContent={'space-between'}>
      <BackButton
        onPress={() => {
          Navigation.handleAction(Routes.PERPS_ACCOUNT_SCREEN);
        }}
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
          // animatedProps={searchInputValue}
          clearButtonMode="while-editing"
          enablesReturnKeyAutomatically
          // onBlur={() => runOnUI(onBlurWorklet)()}
          // onFocus={() => runOnUI(onFocusWorklet)()}
          onChange={onSearchQueryChange}
          placeholder={'Search markets'}
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
  const label = useForegroundColor('label');

  return (
    <Box>
      <ButtonPressAnimation
        onPress={() => {
          Navigation.handleAction(Routes.PERPS_NEW_POSITION_SEARCH_SCREEN);
        }}
      >
        <Box
          borderRadius={24}
          height={48}
          justifyContent={'center'}
          alignItems={'center'}
          borderWidth={2}
          borderColor={{ custom: opacityWorklet(label, 0.16) }}
        >
          <LinearGradient
            colors={HYPERLIQUID_COLORS.gradient}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000', opacity: 0.12 }]} />
          <Text size="20pt" weight={'black'} color={{ custom: '#000000' }}>
            {'New Position'}
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
};

const PerpsNewPositionScreenFooter = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const green = PERPS_COLORS.longGreen;
  const red = PERPS_COLORS.shortRed;

  const positionSide = useHlNewPositionStore(state => state.positionSide);

  const button = useMemo(() => {
    return {
      textColor: positionSide === PerpPositionSide.LONG ? '#000000' : '#FFFFFF',
      backgroundColor: positionSide === PerpPositionSide.LONG ? green : red,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      text: positionSide === PerpPositionSide.LONG ? 'Hold to Long' : 'Hold to Short',
    };
  }, [positionSide, green, red]);

  const submitNewPosition = useCallback(async () => {
    const { market, positionSide, leverage, amount, triggerOrders } = useHlNewPositionStore.getState();
    if (!market || !leverage) return;
    setIsSubmitting(true);
    try {
      const result = await hyperliquidAccountStoreActions.createIsolatedMarginPosition({
        symbol: market.symbol,
        side: positionSide,
        leverage: leverage,
        amount,
        assetPrice: market.price,
        decimals: market.decimals,
      });

      // TODO (kane): how do we want to handle partially filled orders?
      const allOrdersFilled = result.response.data.statuses.every(status => {
        return 'filled' in status;
      });

      if (allOrdersFilled) {
        hlNewPositionStoreActions.reset();
        hyperliquidAccountStoreActions.fetch(undefined, { force: true });
        Navigation.handleAction(Routes.PERPS_ACCOUNT_SCREEN);
      }
    } catch (e) {
      logger.error(new RainbowError('[PerpsNewPositionScreenFooter] Failed to submit new position', e));
    }
    setIsSubmitting(false);
  }, []);

  return (
    <Box flexDirection={'row'} gap={12} width="full" alignItems={'center'} justifyContent={'space-between'}>
      <BackButton
        onPress={() => {
          Navigation.handleAction(Routes.PERPS_NEW_POSITION_SEARCH_SCREEN);
        }}
        backgroundColor={button.backgroundColor}
        borderColor={button.borderColor}
        textColor={button.textColor}
      />

      <Box style={{ flex: 1 }}>
        <HoldToActivateButton
          backgroundColor={button.backgroundColor}
          disabledBackgroundColor={button.borderColor}
          isProcessing={isSubmitting}
          showBiometryIcon={true}
          processingLabel={'Submitting...'}
          label={button.text}
          onLongPress={submitNewPosition}
          height={48}
          textStyle={{
            color: button.textColor,
            fontSize: 20,
            fontWeight: '900',
          }}
          progressColor={button.textColor}
        />
      </Box>
    </Box>
  );
};

export const PerpsNavigatorFooter = memo(function PerpsNavigatorFooter() {
  const safeAreaInsets = useSafeAreaInsets();
  const { accentColors } = usePerpsAccentColorContext();
  const activeRoute = useNavigationStore(state => state.activeRoute);

  if (activeRoute === Routes.PERPS_DEPOSIT_SCREEN) {
    return null;
  }

  return (
    <KeyboardStickyView
      // TODO (kane): idk why this 6 is required
      offset={{ opened: safeAreaInsets.bottom + 6 - 20 }}
      enabled={activeRoute !== Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET}
    >
      <Box
        position="absolute"
        bottom="0px"
        left="0px"
        right="0px"
        width="full"
        height={110}
        shadow={'24px'}
        style={{
          shadowOffset: {
            width: 0,
            height: -8,
          },
          borderTopWidth: 2,
          borderTopColor: accentColors.opacity6,
          paddingBottom: safeAreaInsets.bottom,
          backgroundColor: PERPS_COLORS.surfacePrimary,
        }}
      >
        <Box paddingHorizontal={'20px'} paddingVertical={'20px'}>
          {activeRoute === Routes.PERPS_SEARCH_SCREEN && <PerpsSearchScreenFooter />}
          {activeRoute === Routes.PERPS_NEW_POSITION_SEARCH_SCREEN && <PerpsSearchScreenFooter />}
          {activeRoute === Routes.PERPS_ACCOUNT_SCREEN && <PerpsAccountScreenFooter />}
          {activeRoute === Routes.PERPS_NEW_POSITION_SCREEN && <PerpsNewPositionScreenFooter />}
          {activeRoute === Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET && <PerpsNewPositionScreenFooter />}
        </Box>
      </Box>
    </KeyboardStickyView>
  );
});

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 20,
    height: 48,
    letterSpacing: 0.36,
    paddingLeft: 10,
    paddingRight: 9,
    paddingVertical: 10,
    zIndex: 100,
    ...fontWithWidth(font.weight.semibold),
  },
});
