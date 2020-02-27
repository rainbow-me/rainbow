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
import { useSavingsAccount } from '../hooks';

const SavingsSheet = () => {
  console.log('[SAVINGS SHEET]');
  const { getParam, navigate } = useNavigation();
  const savings = useSavingsAccount();

  const isEmpty = getParam('isEmpty');
  const currency = getParam('currency');

  // console.log('[SAVINGS SHEET] is empty?', isEmpty);
  // console.log('[SAVINGS SHEET] currency', currency);
  // console.log('[SAVINGS SHEET]', savings);
  // TODO JIN transactions list
  const {
    lifetimeSupplyInterestAccrued,
    supplyBalanceUnderlying,
    underlyingAddress,
    underlyingDecimals,
    underlyingSymbol,
  } = savings;
  const balance = convertAmountToDepositDisplay(supplyBalanceUnderlying, {
    address: underlyingAddress,
    decimals: underlyingDecimals,
    symbol: underlyingSymbol,
  });
  // symbol
  // TODO JIN token balance in USD?

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
                  {savings
                    .filter(
                      ({ symbol }) =>
                        toLower(symbol.substr(1)) === toLower(currency)
                    )
                    .map(({ name, symbol, ...item }) => (
                      <SavingsCoinRow
                        item={{
                          ...item,
                          name: name.replace('Compound ', ''),
                          symbol: symbol.substr(1),
                        }}
                        key={get(item, 'cTokenAddress')}
                      />
                    ))}
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
