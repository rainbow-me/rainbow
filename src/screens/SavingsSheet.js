import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { StatusBar } from 'react-native';
import { getSoftMenuBarHeight } from 'react-native-extra-dimensions-android';
import { useSafeArea } from 'react-native-safe-area-context';
import Divider from '../components/Divider';
import { SavingsCoinRow } from '../components/coin-row';
import {
  FloatingEmojis,
  FloatingEmojisTapHandler,
} from '../components/floating-emojis';
import { Centered, Column } from '../components/layout';
import {
  SavingsPredictionStepper,
  SavingsSheetEmptyState,
  SavingsSheetHeader,
} from '../components/savings';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../components/sheet';
import { analytics } from '@/analytics';
import { enableActionsOnReadOnlyWallet } from '@/config/debug';
import { isSymbolStablecoin } from '@/helpers/savings';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useAccountSettings, useDimensions, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { watchingAlert } from '@/utils';

export const SavingsSheetEmptyHeight = 313;
export const SavingsSheetHeight = android
  ? 424 - getSoftMenuBarHeight() / 2
  : 352;

const Container = styled(Centered).attrs({
  direction: 'column',
})(({ deviceHeight, height }) => ({
  ...position.coverAsObject,
  ...(height && { height: height + deviceHeight }),
}));

const SavingsSheet = () => {
  const { colors, isDarkMode } = useTheme();
  const { height: deviceHeight } = useDimensions();
  const { navigate } = useNavigation();
  const { params } = useRoute();
  const insets = useSafeArea();
  const { isReadOnlyWallet } = useWallets();
  const { nativeCurrency } = useAccountSettings();
  const cTokenBalance = params['cTokenBalance'];
  const isEmpty = params['isEmpty'];
  const underlyingBalanceNativeValue = params['underlyingBalanceNativeValue'];
  const underlying = params['underlying'];
  const lifetimeSupplyInterestAccrued = params['lifetimeSupplyInterestAccrued'];
  const lifetimeSupplyInterestAccruedNative =
    params['lifetimeSupplyInterestAccruedNative'];
  const supplyBalanceUnderlying = params['supplyBalanceUnderlying'];
  const supplyRate = params['supplyRate'];

  const balance = convertAmountToNativeDisplay(
    underlyingBalanceNativeValue,
    nativeCurrency
  );
  const lifetimeAccruedInterest = convertAmountToNativeDisplay(
    lifetimeSupplyInterestAccruedNative,
    nativeCurrency
  );

  const savingsRowItem = useMemo(
    () => ({
      address: underlying.address,
      lifetimeSupplyInterestAccrued,
      name: underlying.name,
      supplyBalanceUnderlying,
      supplyRate,
      symbol: underlying.symbol,
    }),
    [
      lifetimeSupplyInterestAccrued,
      supplyBalanceUnderlying,
      supplyRate,
      underlying.address,
      underlying.name,
      underlying.symbol,
    ]
  );

  useEffect(() => {
    return () => {
      analytics.track('Closed Savings Sheet', {
        category: 'savings',
        empty: isEmpty,
        label: underlying.symbol,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onWithdraw = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.SAVINGS_WITHDRAW_MODAL, {
        params: {
          params: {
            cTokenBalance,
            inputAsset: underlying,
            supplyBalanceUnderlying,
          },
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        },
        screen: Routes.MAIN_EXCHANGE_NAVIGATOR,
      });

      analytics.track('Navigated to SavingsWithdrawModal', {
        category: 'savings',
        label: underlying.symbol,
      });
    } else {
      watchingAlert();
    }
  }, [
    cTokenBalance,
    isReadOnlyWallet,
    navigate,
    supplyBalanceUnderlying,
    underlying,
  ]);

  const onDeposit = useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      navigate(Routes.SAVINGS_DEPOSIT_MODAL, {
        params: {
          params: {
            inputAsset: underlying,
          },
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        },
        screen: Routes.MAIN_EXCHANGE_NAVIGATOR,
      });

      analytics.track('Navigated to SavingsDepositModal', {
        category: 'savings',
        empty: isEmpty,
        label: underlying.symbol,
      });
    } else {
      watchingAlert();
    }
  }, [isEmpty, isReadOnlyWallet, navigate, underlying]);

  return (
    <Container
      deviceHeight={deviceHeight}
      height={isEmpty ? SavingsSheetEmptyHeight : SavingsSheetHeight}
      insets={insets}
    >
      <StatusBar barStyle="light-content" />
      <SlackSheet
        additionalTopPadding={android}
        contentHeight={isEmpty ? SavingsSheetEmptyHeight : SavingsSheetHeight}
      >
        {isEmpty ? (
          <SavingsSheetEmptyState
            isReadOnlyWallet={isReadOnlyWallet}
            supplyRate={supplyRate}
            underlying={underlying}
          />
        ) : (
          <Fragment>
            <SavingsSheetHeader
              balance={balance}
              lifetimeAccruedInterest={lifetimeAccruedInterest}
            />
            <SheetActionButtonRow>
              <SheetActionButton
                color={isDarkMode ? colors.darkModeDark : colors.dark}
                label={`􀁏 ${lang.t('savings.withdraw')}`}
                onPress={onWithdraw}
                radiusAndroid={24}
                testID="withdraw"
                weight="heavy"
              />
              <SheetActionButton
                color={colors.swapPurple}
                label={`􀁍 ${lang.t('savings.deposit')}`}
                onPress={onDeposit}
                radiusAndroid={24}
                testID="deposit"
                weight="heavy"
              />
            </SheetActionButtonRow>
            <Divider color={colors.rowDividerLight} zIndex={0} />
            <FloatingEmojis
              disableHorizontalMovement
              distance={600}
              duration={600}
              emojis={['money_with_wings']}
              opacityThreshold={0.86}
              scaleTo={0.3}
              size={40}
              wiggleFactor={0}
            >
              {({ onNewEmoji }) => (
                <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
                  <Column paddingBottom={9} paddingTop={4}>
                    <SavingsCoinRow
                      item={savingsRowItem}
                      key={underlying.address}
                    />
                  </Column>
                </FloatingEmojisTapHandler>
              )}
            </FloatingEmojis>
            <Divider color={colors.rowDividerLight} zIndex={0} />
            <SavingsPredictionStepper
              asset={underlying}
              balance={
                isSymbolStablecoin(underlying.symbol)
                  ? underlyingBalanceNativeValue
                  : supplyBalanceUnderlying
              }
              interestRate={supplyRate}
            />
          </Fragment>
        )}
      </SlackSheet>
    </Container>
  );
};

export default React.memo(SavingsSheet);
