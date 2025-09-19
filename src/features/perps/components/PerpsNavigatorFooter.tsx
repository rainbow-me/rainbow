import React, { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Box, Text, TextShadow, useColorMode } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert, NativeSyntheticEvent, StyleSheet, TextInput, TextInputChangeEventData } from 'react-native';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { PERPS_COLORS } from '@/features/perps/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import Routes from '@/navigation/routesNames';
import Animated, { FadeIn, FadeOut, useAnimatedRef } from 'react-native-reanimated';
import { AnimatedInput } from '@/components/AnimatedComponents/AnimatedInput';
import { Navigation } from '@/navigation';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { fontWithWidth } from '@/styles/buildTextStyles';
import font from '@/styles/fonts';
import { hyperliquidMarketStoreActions, useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { hlNewPositionStoreActions, useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { PerpPositionSide } from '@/features/perps/types';
import { hyperliquidAccountStoreActions, useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { createIsolatedMarginPosition } from '@/features/perps/services/hyperliquid-trading-actions';
import { ensureError, logger, RainbowError } from '@/logger';
import { HoldToActivateButton } from '@/screens/token-launcher/components/HoldToActivateButton';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { useOrderAmountValidation } from '@/features/perps/hooks/useOrderAmountValidation';
import { getSolidColorEquivalent } from '@/worklets/colors';

const BUTTON_HEIGHT = 48;

// Routes that appear over the perps stack that we do not want to affect the footer
const IGNORED_ROUTES = new Set<string>([
  Routes.PERPS_WITHDRAWAL_SCREEN,
  Routes.PERPS_DEPOSIT_SCREEN,
  Routes.CLOSE_POSITION_BOTTOM_SHEET,
  Routes.PERPS_DETAIL_SCREEN,
  Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET,
]);

const FOOTER_ROUTES = new Set<string>([
  Routes.PERPS_SEARCH_SCREEN,
  Routes.PERPS_NEW_POSITION_SEARCH_SCREEN,
  Routes.PERPS_ACCOUNT_SCREEN,
  Routes.PERPS_NEW_POSITION_SCREEN,
]);

const usePersistedFooterRoute = () => {
  const activeRoute = useNavigationStore(state => state.activeRoute);
  const lastRelevantRoute = useRef<string | null>(null);

  // Update last relevant route only if current route is a footer route
  if (activeRoute && FOOTER_ROUTES.has(activeRoute) && !IGNORED_ROUTES.has(activeRoute)) {
    lastRelevantRoute.current = activeRoute;
  }

  return IGNORED_ROUTES.has(activeRoute || '') ? lastRelevantRoute.current : activeRoute;
};

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
    useHyperliquidMarketsStore.getState().setSearchQuery(event.nativeEvent.text);
  }, []);

  useEffect(() => {
    return () => {
      hyperliquidMarketStoreActions.setSearchQuery('');
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
          clearButtonMode="while-editing"
          enablesReturnKeyAutomatically
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
  const { isDarkMode } = useColorMode();
  const balance = useHyperliquidAccountStore(state => state.balance);
  const hasZeroBalance = Number(balance) === 0;

  return (
    <HyperliquidButton
      onPress={() => {
        Navigation.handleAction(hasZeroBalance ? Routes.PERPS_DEPOSIT_SCREEN : Routes.PERPS_NEW_POSITION_SEARCH_SCREEN);
      }}
      paddingVertical={'12px'}
      borderRadius={24}
      height={48}
      justifyContent={'center'}
      alignItems={'center'}
    >
      <Text size="20pt" weight={'black'} color={isDarkMode ? 'black' : 'white'}>
        {hasZeroBalance ? 'Deposit' : 'New Position'}
      </Text>
    </HyperliquidButton>
  );
};

const PerpsNewPositionScreenFooter = memo(function PerpsNewPositionScreenFooter() {
  // const navigation = useNavigation();
  const { accentColors } = usePerpsAccentColorContext();
  const { isDarkMode } = useColorMode();
  const { isValid } = useOrderAmountValidation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const green = PERPS_COLORS.longGreen;
  const red = PERPS_COLORS.shortRed;

  const positionSide = useHlNewPositionStore(state => state.positionSide);

  const button = useMemo(() => {
    const isLong = positionSide === PerpPositionSide.LONG;
    const positionSideColor = isLong ? green : red;
    const darkModeTextColor = isValid ? (isLong ? 'black' : 'white') : opacityWorklet(positionSideColor, 0.4);
    const lightModeTextColor = isValid ? 'white' : opacityWorklet(positionSideColor, 0.4);
    const backTextColor = isDarkMode ? (isLong ? 'black' : 'white') : 'white';
    return {
      textColor: isDarkMode ? darkModeTextColor : lightModeTextColor,
      backTextColor,
      backgroundColor: positionSideColor,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      text: isLong ? 'Hold to Long' : 'Hold to Short',
      disabledBackgroundColor: getSolidColorEquivalent({
        background: accentColors.surfacePrimary,
        foreground: positionSideColor,
        opacity: 0.07,
      }),
    };
  }, [positionSide, green, red, isValid, isDarkMode, accentColors]);

  const submitNewPosition = useCallback(async () => {
    const { market, positionSide, leverage, amount, triggerOrders } = useHlNewPositionStore.getState();
    if (!market || !leverage) return;
    setIsSubmitting(true);
    try {
      const livePrice = useLiveTokensStore.getState().tokens[getHyperliquidTokenId(market.symbol)].midPrice;
      await createIsolatedMarginPosition({
        symbol: market.symbol,
        side: positionSide,
        leverage,
        marginAmount: amount,
        // TODO (kane): market.price will be stale and the live price shouldn't actually be null in any case
        price: livePrice ?? market.price,
        triggerOrders,
      });
      hlNewPositionStoreActions.reset();
      Navigation.handleAction(Routes.PERPS_ACCOUNT_SCREEN);
    } catch (e) {
      const error = ensureError(e);
      Alert.alert('Error submitting order', error.message);
      logger.error(new RainbowError('[PerpsNewPositionScreenFooter] Failed to submit new position', e));
    }
    setIsSubmitting(false);
  }, []);

  return (
    <Box flexDirection={'row'} gap={12} width="full" alignItems={'center'} justifyContent={'space-between'}>
      <BackButton
        onPress={() => {
          // navigation.goBack();
          Navigation.goBack();
        }}
        backgroundColor={button.backgroundColor}
        borderColor={button.borderColor}
        textColor={button.backTextColor}
      />

      <Box style={{ flex: 1 }}>
        <HoldToActivateButton
          disabled={!isValid}
          backgroundColor={button.backgroundColor}
          disabledBackgroundColor={button.disabledBackgroundColor}
          isProcessing={isSubmitting}
          showBiometryIcon={false}
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
});

export const PerpsNavigatorFooter = memo(function PerpsNavigatorFooter() {
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();
  const { accentColors } = usePerpsAccentColorContext();
  const activeRoute = useNavigationStore(state => state.activeRoute);
  const effectiveRoute = usePersistedFooterRoute();

  return (
    <KeyboardStickyView
      // TODO (kane): Where does this 6 come from?
      offset={{ opened: safeAreaInsets.bottom + 6 - 20 }}
      enabled={activeRoute !== Routes.CREATE_TRIGGER_ORDER_BOTTOM_SHEET}
    >
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
          borderTopWidth: 2,
          borderTopColor: accentColors.opacity6,
          paddingBottom: Math.max(safeAreaInsets.bottom, 20),
          paddingTop: 20,
          backgroundColor: isDarkMode ? accentColors.surfacePrimary : 'white',
        }}
      >
        <Box as={Animated.View} entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} paddingHorizontal={'20px'}>
          {(effectiveRoute === Routes.PERPS_SEARCH_SCREEN || effectiveRoute === Routes.PERPS_NEW_POSITION_SEARCH_SCREEN) && (
            <PerpsSearchScreenFooter />
          )}
          {effectiveRoute === Routes.PERPS_ACCOUNT_SCREEN && <PerpsAccountScreenFooter />}
          {effectiveRoute === Routes.PERPS_NEW_POSITION_SCREEN && <PerpsNewPositionScreenFooter />}
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
