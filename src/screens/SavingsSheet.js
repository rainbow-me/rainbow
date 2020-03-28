import React, { Fragment } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { Column, RowWithMargins } from '../components/layout';
import { colors, padding } from '../styles';
import { SavingsCoinRow } from '../components/coin-row';
import {
  SavingsPredictionStepper,
  SavingsSheetHeader,
  SavingsSheetEmptyState,
} from '../components/savings';
import {
  FloatingEmojis,
  FloatingEmojisTapHandler,
} from '../components/floating-emojis';
import { Sheet, SheetActionButton } from '../components/sheet';
import Divider from '../components/Divider';
import {
  convertAmountToDepositDisplay,
  convertAmountToNativeDisplay,
} from '../helpers/utilities';
import { useAccountSettings } from '../hooks';

const SavingsSheet = () => {
  const { getParam, navigate } = useNavigation();
  const { nativeCurrency } = useAccountSettings();

  const cTokenBalance = getParam('cTokenBalance');
  const isEmpty = getParam('isEmpty');
  const nativeValue = getParam('nativeValue');
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

  const balance = convertAmountToDepositDisplay(nativeValue, underlying);
  const lifetimeAccruedInterest = convertAmountToNativeDisplay(
    lifetimeSupplyInterestAccruedNative,
    nativeCurrency,
    1
  );

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
              onPress={() =>
                navigate('SavingsWithdrawModal', {
                  cTokenBalance,
                  defaultInputAsset: underlying,
                  supplyBalanceUnderlying,
                  underlyingPrice,
                })
              }
              shadows={[
                [0, 7, 21, colors.dark, 0.25],
                [0, 3.5, 10.5, colors.dark, 0.35],
              ]}
            />
            <SheetActionButton
              color={colors.swapPurple}
              label="􀁍 Deposit"
              onPress={() =>
                navigate('SavingsDepositModal', {
                  defaultInputAsset: underlying,
                })
              }
              shadows={[
                [0, 7, 21, colors.dark, 0.25],
                [0, 3.5, 10.5, colors.swapPurple, 0.35],
              ]}
            />
          </RowWithMargins>
          <Divider zIndex={0} />
          <FloatingEmojis
            distance={250}
            duration={500}
            emoji="money_mouth_face"
            fadeOut={false}
            scaleTo={0}
            size={40}
            marginTop={-25}
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
            balance={nativeValue}
            interestRate={supplyRate}
          />
        </Fragment>
      )}
    </Sheet>
  );
};

export default React.memo(SavingsSheet);
