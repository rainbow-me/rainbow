import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { Alert, StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
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
import { isSymbolStablecoin } from '@rainbow-me/helpers/savings';
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useDimensions,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors, position } from '@rainbow-me/styles';

export const SavingsSheetEmptyHeight = 313;
export const SavingsSheetHeight = android ? 410 : 352;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${position.cover};
  ${({ deviceHeight, height }) =>
    height ? `height: ${height + deviceHeight}` : null};
`;

const SavingsSheet = () => {
  const { height: deviceHeight } = useDimensions();
  const { navigate } = useNavigation();
  const { params } = useRoute();
  const insets = useSafeArea();
  const { isReadOnlyWallet } = useWallets();
  const { nativeCurrency, nativeCurrencySymbol } = useAccountSettings();
  const cTokenBalance = params['cTokenBalance'];
  const isEmpty = params['isEmpty'];
  const underlyingBalanceNativeValue = params['underlyingBalanceNativeValue'];
  const underlying = params['underlying'];
  const underlyingPrice = params['underlyingPrice'];
  const lifetimeSupplyInterestAccrued = params['lifetimeSupplyInterestAccrued'];
  const lifetimeSupplyInterestAccruedNative =
    params['lifetimeSupplyInterestAccruedNative'];
  const supplyBalanceUnderlying = params['supplyBalanceUnderlying'];
  const supplyRate = params['supplyRate'];

  const balance = nativeCurrencySymbol + underlyingBalanceNativeValue;
  const lifetimeAccruedInterest = convertAmountToNativeDisplay(
    lifetimeSupplyInterestAccruedNative,
    nativeCurrency
  );

  const savingsRowItem = useMemo(
    () => ({
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
    if (!isReadOnlyWallet) {
      navigate(Routes.SAVINGS_WITHDRAW_MODAL, {
        cTokenBalance,
        defaultInputAsset: underlying,
        supplyBalanceUnderlying,
        underlyingPrice,
      });

      analytics.track('Navigated to SavingsWithdrawModal', {
        category: 'savings',
        label: underlying.symbol,
      });
    } else {
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [
    cTokenBalance,
    isReadOnlyWallet,
    navigate,
    supplyBalanceUnderlying,
    underlying,
    underlyingPrice,
  ]);

  const onDeposit = useCallback(() => {
    if (!isReadOnlyWallet) {
      navigate(Routes.SAVINGS_DEPOSIT_MODAL, {
        params: {
          params: {
            defaultInputAsset: underlying,
            underlyingPrice,
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
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [isEmpty, isReadOnlyWallet, navigate, underlying, underlyingPrice]);

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
                color={colors.dark}
                label="􀁏 Withdraw"
                onPress={onWithdraw}
                radiusAndroid={24}
                weight="bold"
              />
              <SheetActionButton
                color={colors.swapPurple}
                label="􀁍 Deposit"
                onPress={onDeposit}
                radiusAndroid={24}
                weight="bold"
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
