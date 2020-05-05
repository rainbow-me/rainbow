import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import Divider from '../components/Divider';
import { SavingsCoinRow } from '../components/coin-row';
import {
  FloatingEmojis,
  FloatingEmojisTapHandler,
} from '../components/floating-emojis';
import { Column, RowWithMargins } from '../components/layout';
import {
  SavingsPredictionStepper,
  SavingsSheetEmptyState,
  SavingsSheetHeader,
} from '../components/savings';
import { Sheet, SheetActionButton } from '../components/sheet';
import { isSymbolStablecoin } from '../helpers/savings';
import { convertAmountToNativeDisplay } from '../helpers/utilities';
import WalletTypes from '../helpers/walletTypes';
import { useAccountSettings, useWallets } from '../hooks';
import { colors, padding } from '../styles';
import Routes from './Routes/routesNames';

const SavingsSheet = () => {
  const { getParam, navigate, goBack } = useNavigation();
  const { selected: selectedWallet = {} } = useWallets();
  const { nativeCurrency, nativeCurrencySymbol } = useAccountSettings();
  const cTokenBalance = getParam('cTokenBalance');
  const isEmpty = getParam('isEmpty');
  const underlyingBalanceNativeValue = getParam('underlyingBalanceNativeValue');
  const underlying = getParam('underlying');
  const underlyingPrice = getParam('underlyingPrice');
  const lifetimeSupplyInterestAccrued = getParam(
    'lifetimeSupplyInterestAccrued'
  );
  const lifetimeSupplyInterestAccruedNative = getParam(
    'lifetimeSupplyInterestAccruedNative'
  );
  const supplyBalanceUnderlying = getParam('supplyBalanceUnderlying');
  const supplyRate = getParam('supplyRate');

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
    if (selectedWallet.type !== WalletTypes.readOnly) {
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
      goBack();
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [
    cTokenBalance,
    goBack,
    navigate,
    selectedWallet.type,
    supplyBalanceUnderlying,
    underlying,
    underlyingPrice,
  ]);

  const onDeposit = useCallback(() => {
    if (selectedWallet.type !== WalletTypes.readOnly) {
      navigate(Routes.SAVINGS_DEPOSIT_MODAL, {
        defaultInputAsset: underlying,
        underlyingPrice,
      });

      analytics.track('Navigated to SavingsDepositModal', {
        category: 'savings',
        empty: isEmpty,
        label: underlying.symbol,
      });
    } else {
      goBack();
      Alert.alert(`You need to import the wallet in order to do this`);
    }
  }, [
    goBack,
    isEmpty,
    navigate,
    selectedWallet.type,
    underlying,
    underlyingPrice,
  ]);

  return (
    <Sheet>
      {isEmpty ? (
        <SavingsSheetEmptyState
          supplyRate={supplyRate}
          underlying={underlying}
          isReadOnlyWallet={selectedWallet.type === WalletTypes.readOnly}
        />
      ) : (
        <Fragment>
          <SavingsSheetHeader
            balance={balance}
            lifetimeAccruedInterest={lifetimeAccruedInterest}
          />
          <RowWithMargins css={padding(24, 15)} margin={15}>
            <SheetActionButton
              color={colors.dark}
              label="􀁏 Withdraw"
              onPress={onWithdraw}
            />
            <SheetActionButton
              color={colors.swapPurple}
              label="􀁍 Deposit"
              onPress={onDeposit}
            />
          </RowWithMargins>
          <Divider zIndex={0} />
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
    </Sheet>
  );
};

export default React.memo(SavingsSheet);
