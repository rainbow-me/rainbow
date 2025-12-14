import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountImage } from '@/components/AccountImage';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import Page from '@/components/layout/Page';
import { Navbar } from '@/components/navbar/Navbar';
import { AnimatedText, Box, Inline, Inset, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { palettes } from '@/design-system/color/palettes';
import { InputValueCaret } from '@/features/perps/components/InputValueCaret';
import { NumberPad } from '@/features/perps/components/NumberPad/NumberPad';
import { PerpsSwapButton } from '@/features/perps/components/PerpsSwapButton';
import { PerpsTextSkeleton } from '@/features/perps/components/PerpsTextSkeleton';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { SliderWithLabels } from '@/features/perps/components/Slider';
import { USDC_ASSET } from '@/features/perps/constants';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { ChainId } from '@/state/backendNetworks/types';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { SEPARATOR_COLOR, THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { addCommasToNumber, opacity, stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { FOOTER_HEIGHT, SLIDER_WIDTH, SLIDER_WITH_LABELS_HEIGHT } from '../constants';
import { useWithdrawalContext, WithdrawalProvider } from '../contexts/WithdrawalContext';
import { useWithdrawalController } from '../hooks/useWithdrawalController';
import { useWithdrawalHandler } from '../hooks/useWithdrawalHandler';
import {
  BalanceQueryStore,
  FundingScreenTheme,
  WithdrawalConfig,
  WithdrawalInfoCardConfig,
  WithdrawalStoreType,
  WithdrawalTokenData,
  WithdrawalTokenStoreType,
  getAccentColor,
} from '../types';
import { ChainSelectorButton } from './shared/ChainSelectorButton';

// ============ Types ========================================================== //

type WithdrawalScreenProps<T extends BalanceQueryStore> = {
  config: WithdrawalConfig<T>;
  theme: FundingScreenTheme;
};

// ============ Translations =================================================== //

const translations = {
  confirmButton: i18n.t(i18n.l.perps.withdraw.confirm_button_text),
  confirmButtonLoading: i18n.t(i18n.l.perps.withdraw.confirm_button_loading_text),
  confirmButtonOverBalance: i18n.t(i18n.l.perps.withdraw.confirm_button_over_balance_text),
  confirmButtonZero: i18n.t(i18n.l.perps.withdraw.confirm_button_zero_text),
};

// ============ Main Screen ==================================================== //

export const WithdrawalScreen = memo(function WithdrawalScreen<T extends BalanceQueryStore>({ config, theme }: WithdrawalScreenProps<T>) {
  return (
    <WithdrawalProvider config={config} theme={theme}>
      <WithdrawalScreenContent />
    </WithdrawalProvider>
  );
});

// ============ Screen Content ================================================= //

const WithdrawalScreenContent = memo(function WithdrawalScreenContent() {
  const { isDarkMode } = useColorMode();
  const context = useWithdrawalContext();
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const insets = useSafeAreaInsets();

  const { amountActions, config, theme, useWithdrawalStore, withdrawalActions } = context;

  const availableBalance = config.balanceStore(state => state.getBalance());
  const isBalanceLoading = config.balanceStore(state => state.getStatus('isInitialLoad'));
  const isSubmitting = useStoreSharedValue(useWithdrawalStore, state => state.isSubmitting);

  const {
    balance,
    displayedAmount,
    fields,
    handleNumberPadChange,
    handlePressMaxWorklet,
    handleSliderBeginWorklet,
    inputMethod,
    isAtMax,
    sliderProgress,
  } = useWithdrawalController(config.balanceStore, config.amountDecimals, amountActions);

  const handleWithdrawal = useWithdrawalHandler({
    balance,
    config,
    context,
    displayedAmount,
    isAtMax,
    withdrawalActions,
  });

  const accentColor = getAccentColor(theme, isDarkMode);
  const formattedBalance = formatBalance(availableBalance, config.amountDecimals);

  const sliderColors = useMemo(
    () => ({
      activeLeft: accentColor,
      activeRight: separatorSecondary,
      inactiveLeft: accentColor,
      inactiveRight: separatorSecondary,
    }),
    [accentColor, separatorSecondary]
  );

  const formattedInputAmount = useDerivedValue(() => {
    const value = displayedAmount.value;
    if (!value || value === '0') return '$0';
    const formatted = addCommasToNumber(value, '0');
    return `$${formatted}`;
  });

  const inputAmountError = useDerivedValue(() => {
    const amountToCheck = isAtMax.value ? balance.value : displayedAmount.value;
    const amountNumber = Number(amountToCheck || '0');
    if (amountNumber === 0) return 'zero';
    if (amountNumber > Number(availableBalance)) return 'overBalance';
    return null;
  });

  const isButtonDisabled = useDerivedValue(() => isBalanceLoading || inputAmountError.value !== null || isSubmitting.value);

  const formattedValues = useDerivedValue<Record<string, string>>(() => ({
    inputAmount: formattedInputAmount.value,
  }));

  const confirmButtonLabel = useDerivedValue(() => {
    if (inputAmountError.value === 'zero') return translations.confirmButtonZero;
    if (inputAmountError.value === 'overBalance') return translations.confirmButtonOverBalance;
    if (isSubmitting.value) return translations.confirmButtonLoading;
    return translations.confirmButton;
  });

  return (
    <PerpsAccentColorContextProvider primaryColorOverride={accentColor}>
      <Box
        as={Page}
        backgroundColor={isDarkMode ? theme.backgroundDark : theme.backgroundLight}
        height="full"
        testID="withdrawal-screen"
        width="full"
      >
        <SheetHandle backgroundColor={isDarkMode ? theme.backgroundDark : theme.backgroundLight} withoutGradient />
        <Box paddingTop="8px">
          <Navbar hasStatusBarInset leftComponent={<AccountImage />} title={i18n.t(i18n.l.perps.withdraw.title)} />
        </Box>

        <View style={{ alignSelf: 'center', top: -10 }}>
          {isBalanceLoading ? (
            <PerpsTextSkeleton height={15} width={150} />
          ) : (
            <Text align="center" color="labelTertiary" size="15pt" weight="bold">
              {formattedBalance}
              <Text color="labelQuaternary" size="15pt" weight="bold">
                {i18n.t(i18n.l.perps.withdraw.available_balance_suffix)}
              </Text>
            </Text>
          )}
        </View>

        <Box alignItems="center" flexGrow={1} flexShrink={1} gap={20} justifyContent="center">
          <WithdrawalInputSection accentColor={accentColor} balanceLoading={isBalanceLoading} formattedInputAmount={formattedInputAmount} />
          {context.useTokenStore ? (
            <WithdrawalChainSelector
              accentColor={accentColor}
              allowedChains={config.route?.to.allowedChains}
              setSelectedChainId={withdrawalActions.setSelectedChainId}
              useTokenStore={context.useTokenStore}
              useWithdrawalStore={useWithdrawalStore}
            />
          ) : null}
        </Box>

        <WithdrawalInfoCard accentColor={accentColor} config={config.infoCard ?? null} />

        <SliderWithLabels
          colors={sliderColors}
          containerStyle={{ height: SLIDER_WITH_LABELS_HEIGHT, justifyContent: 'center', marginHorizontal: 20 }}
          icon={<AssetCoinIcon asset={USDC_ASSET} showBadge={false} size={16} />}
          labels={{ title: i18n.t(i18n.l.perps.withdraw.slider_label) }}
          onGestureBeginWorklet={handleSliderBeginWorklet}
          onPressMaxWorklet={handlePressMaxWorklet}
          progressValue={sliderProgress}
          showMaxButton={true}
          showPercentage={true}
          width={SLIDER_WIDTH}
        />

        <NumberPad
          activeFieldId={inputMethod}
          fields={fields}
          formattedValues={formattedValues}
          onValueChange={handleNumberPadChange}
          stripFormatting={stripNonDecimalNumbers}
        />

        <Box
          alignItems="center"
          flexDirection="row"
          gap={12}
          height={{ custom: FOOTER_HEIGHT }}
          marginBottom={{ custom: insets.bottom }}
          paddingBottom="8px"
          paddingHorizontal="20px"
          paddingTop="16px"
          width="full"
        >
          <Box flexGrow={1}>
            <PerpsSwapButton
              accentColor={accentColor}
              disabled={isButtonDisabled}
              disabledOpacity={1}
              label={confirmButtonLabel}
              onLongPress={handleWithdrawal}
            />
          </Box>
        </Box>
      </Box>
    </PerpsAccentColorContextProvider>
  );
});

// ============ Info Card ====================================================== //

const DEFAULT_INFO_ICON = '􀄵';

const WithdrawalInfoCard = memo(function WithdrawalInfoCard({
  accentColor,
  config,
}: {
  accentColor: string;
  config: WithdrawalInfoCardConfig;
}) {
  const { isDarkMode } = useColorMode();

  if (!config) return null;

  const background = isDarkMode ? undefined : 'fillQuaternary';
  const backgroundColor = isDarkMode ? opacity(palettes.dark.backgroundColors.fillQuaternary.color, 0.025) : undefined;
  const borderColor = isDarkMode ? SEPARATOR_COLOR : palettes.light.foregroundColors.separatorTertiary;
  const icon = config.icon ?? DEFAULT_INFO_ICON;

  return (
    <Inset bottom="10px" horizontal="20px">
      <Box
        background={background}
        backgroundColor={backgroundColor}
        borderColor={{ custom: borderColor }}
        borderRadius={24}
        borderWidth={THICKER_BORDER_WIDTH}
        gap={12}
        padding="20px"
      >
        <Inline alignVertical="center" horizontalSpace="6px" wrap={false}>
          <TextIcon color={{ custom: accentColor }} height={8} size="icon 13px" weight="bold" width={20}>
            {icon}
          </TextIcon>
          {typeof config.title === 'string' ? (
            <Text color="labelTertiary" size="15pt" weight="bold">
              {config.title}
            </Text>
          ) : (
            <Text color="labelQuaternary" size="15pt" weight="bold">
              {config.title.prefix}
              <Text color="labelTertiary" size="15pt" weight="bold">
                {config.title.highlighted}
              </Text>
            </Text>
          )}
        </Inline>
        <Text color={isDarkMode ? 'labelQuinary' : 'labelQuaternary'} size="13pt" weight="semibold">
          {config.description}
        </Text>
      </Box>
    </Inset>
  );
});

// ============ Coin Icon ====================================================== //

const AssetCoinIcon = ({
  asset,
  showBadge,
  size,
}: {
  asset: { chainId: number; icon_url?: null | string; symbol?: null | string } | null;
  showBadge?: boolean;
  size: number;
}) => {
  if (!asset?.symbol) return null;
  return (
    <RainbowCoinIcon chainId={asset.chainId} icon={asset.icon_url ?? undefined} showBadge={showBadge} size={size} symbol={asset.symbol} />
  );
};

// ============ Chain Selector ================================================= //

const WithdrawalChainSelector = memo(function WithdrawalChainSelector({
  accentColor,
  allowedChains,
  setSelectedChainId,
  useTokenStore,
  useWithdrawalStore,
}: {
  accentColor: string;
  allowedChains: ChainId[] | undefined;
  setSelectedChainId: (chainId: ChainId) => void;
  useTokenStore: WithdrawalTokenStoreType;
  useWithdrawalStore: WithdrawalStoreType;
}) {
  const tokenData = useTokenStore(state => state.getData());
  const selectedChainId = useWithdrawalStore(state => state.selectedChainId);

  const onPress = useCallback(() => {
    if (!selectedChainId) return;

    const availableChains = computeAvailableChains(tokenData, allowedChains);

    Navigation.handleAction(Routes.NETWORK_SELECTOR, {
      allowedNetworks: availableChains,
      canEdit: false,
      canSelectAllNetworks: false,
      goBackOnSelect: true,
      selected: selectedChainId,
      setSelected: (chainId: ChainId | undefined) => {
        if (chainId) setSelectedChainId(chainId);
      },
    });
  }, [allowedChains, selectedChainId, setSelectedChainId, tokenData]);

  if (!selectedChainId) return null;

  return <ChainSelectorButton accentColor={accentColor} chainId={selectedChainId} onPress={onPress} />;
});

// ============ Input Section ================================================== //

const WithdrawalInputSection = memo(function WithdrawalInputSection({
  accentColor,
  balanceLoading,
  formattedInputAmount,
}: {
  accentColor: string;
  balanceLoading: boolean;
  formattedInputAmount: SharedValue<string>;
}) {
  return (
    <Box as={Animated.View} alignItems="center" testID="withdrawal-input">
      {balanceLoading ? (
        <PerpsTextSkeleton height={44} width={180} />
      ) : (
        <Box alignItems="center" flexDirection="row" gap={2}>
          <AnimatedText color={{ custom: accentColor }} ellipsizeMode="middle" numberOfLines={1} size="44pt" tabularNumbers weight="heavy">
            {formattedInputAmount}
          </AnimatedText>
          <InputValueCaret color={accentColor} value={formattedInputAmount} />
        </Box>
      )}
    </Box>
  );
});

// ============ Helpers ======================================================== //

function computeAvailableChains(tokenData: WithdrawalTokenData | null, allowedChains: ChainId[] | undefined): ChainId[] {
  if (!tokenData?.networks) return [];

  if (allowedChains) {
    return allowedChains.filter(chainId => tokenData.networks[String(chainId)]?.address !== undefined);
  }

  return Object.keys(tokenData.networks)
    .map(Number)
    .filter((n): n is ChainId => !isNaN(n) && tokenData.networks[String(n)]?.address !== undefined);
}

function formatBalance(balance: string, decimals: number): string {
  return `$${addCommasToNumber(toFixedWorklet(balance, decimals), '0')}`;
}
