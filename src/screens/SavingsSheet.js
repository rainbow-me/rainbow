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
import { convertAmountToDepositDisplay } from '../helpers/utilities';

const SavingsSheet = () => {
  const { getParam, navigate } = useNavigation();

  const cTokenBalance = getParam('cTokenBalance');
  const isEmpty = getParam('isEmpty');
  const nativeValue = getParam('nativeValue');
  const underlying = getParam('underlying');
  const underlyingPrice = getParam('underlyingPrice');
  const lifetimeSupplyInterestAccrued = getParam(
    'lifetimeSupplyInterestAccrued'
  );
  const supplyBalanceUnderlying = getParam('supplyBalanceUnderlying');
  const supplyRate = getParam('supplyRate');

  const balance = convertAmountToDepositDisplay(nativeValue, underlying);

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
            lifetimeAccruedInterest={lifetimeSupplyInterestAccrued}
          />
          <RowWithMargins css={padding(24, 7.5)} margin={7.5}>
            <SheetActionButton
              color={colors.dark}
              icon="minusCircled"
              label="Withdraw"
              onPress={() =>
                navigate('SavingsWithdrawModal', {
                  cTokenBalance,
                  defaultInputAsset: underlying,
                  supplyBalanceUnderlying,
                  underlyingPrice,
                })
              }
            />
            <SheetActionButton
              color={colors.swapPurple}
              icon="plusCircled"
              label="Deposit"
              onPress={() =>
                navigate('SavingsDepositModal', {
                  defaultInputAsset: underlying,
                })
              }
            />
          </RowWithMargins>
          <Divider zIndex={0} />
          <FloatingEmojis
            distance={350}
            duration={2000}
            emoji="money_mouth_face"
            size={36}
            wiggleFactor={1}
          >
            {({ onNewEmoji }) => (
              <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
                <Column paddingBottom={8}>
                  <SavingsCoinRow
                    item={{
                      lifetimeSupplyInterestAccrued,
                      name: underlying.symbol,
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
          <Divider zIndex={0} />
          <SavingsPredictionStepper
            balance={supplyBalanceUnderlying}
            interestRate={supplyRate}
          />
        </Fragment>
      )}
    </Sheet>
  );
};

export default React.memo(SavingsSheet);
