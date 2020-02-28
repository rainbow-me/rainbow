import { get, toLower } from 'lodash';
import React, { Fragment } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { Column } from '../components/layout';
import { colors } from '../styles';
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
import {
  Sheet,
  SheetActionButton,
  SheetActionButtonRow,
} from '../components/sheet';
import Divider from '../components/Divider';
import { convertAmountToDepositDisplay } from '../helpers/utilities';

const SavingsSheet = () => {
  console.log('[SAVINGS SHEET]');
  const { getParam, navigate } = useNavigation();

  const isEmpty = getParam('isEmpty');
  const underlying = getParam('underlying');
  const lifetimeSupplyInterestAccrued = getParam(
    'lifetimeSupplyInterestAccrued'
  );
  const supplyBalanceUnderlying = getParam('supplyBalanceUnderlying');
  const supplyRate = getParam('supplyRate');

  // TODO JIN transactions list
  const balance = convertAmountToDepositDisplay(supplyBalanceUnderlying, {
    address: underlying.address,
    decimals: underlying.decimals,
    symbol: underlying.symbol,
  });

  return (
    <Sheet>
      {isEmpty ? (
        <SavingsSheetEmptyState />
      ) : (
        <Fragment>
          <SavingsSheetHeader
            balance={balance}
            lifetimeAccruedInterest={lifetimeSupplyInterestAccrued}
          />
          <SheetActionButtonRow>
            <SheetActionButton
              color={colors.dark}
              icon="minusCircled"
              label="Withdraw"
              onPress={() => navigate('SavingsWithdrawModal')}
            />
            <SheetActionButton
              color={colors.dodgerBlue}
              icon="plusCircled"
              label="Deposit"
              onPress={() => navigate('SavingsDepositModal')}
            />
          </SheetActionButtonRow>
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
          <SavingsPredictionStepper />
        </Fragment>
      )}
    </Sheet>
  );
};

export default React.memo(SavingsSheet);
