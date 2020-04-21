import analytics from '@segment/analytics-react-native';
import React, { Fragment, useCallback, useEffect } from 'react';
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
import { convertAmountToNativeDisplay } from '../helpers/utilities';
import { useAccountSettings } from '../hooks';
import { colors, padding } from '../styles';

const SavingsSheet = () => {
  const { getParam, navigate } = useNavigation();
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
    navigate('SavingsWithdrawModal', {
      cTokenBalance,
      defaultInputAsset: underlying,
      supplyBalanceUnderlying,
      underlyingPrice,
    });

    analytics.track('Navigated to SavingsWithdrawModal', {
      category: 'savings',
      label: underlying.symbol,
    });
  }, [
    cTokenBalance,
    navigate,
    supplyBalanceUnderlying,
    underlying,
    underlyingPrice,
  ]);

  const onDeposit = useCallback(() => {
    navigate('SavingsDepositModal', {
      defaultInputAsset: underlying,
    });

    analytics.track('Navigated to SavingsDepositModal', {
      category: 'savings',
      empty: isEmpty,
      label: underlying.symbol,
    });
  }, [isEmpty, navigate, underlying]);

  return (
    <Sheet>
      {isEmpty ? (
        <SavingsSheetEmptyState
          supplyRate={supplyRate}
          underlying={underlying}
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
              shadows={[
                [0, 7, 21, colors.dark, 0.25],
                [0, 3.5, 10.5, colors.dark, 0.35],
              ]}
            />
            <SheetActionButton
              color={colors.swapPurple}
              label="􀁍 Deposit"
              onPress={onDeposit}
              shadows={[
                [0, 7, 21, colors.dark, 0.25],
                [0, 3.5, 10.5, colors.swapPurple, 0.35],
              ]}
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
                    item={{
                      lifetimeSupplyInterestAccrued,
                      name: underlying.name,
                      supplyBalanceUnderlying,
                      supplyRate,
                      symbol: underlying.symbol,
                    }}
                    key={underlying.address}
                  />
                </Column>
              </FloatingEmojisTapHandler>
            )}
          </FloatingEmojis>
          <Divider color={colors.rowDividerLight} zIndex={0} />
          <SavingsPredictionStepper
            asset={underlying}
            balance={underlyingBalanceNativeValue}
            interestRate={supplyRate}
          />
        </Fragment>
      )}
    </Sheet>
  );
};

export default React.memo(SavingsSheet);
