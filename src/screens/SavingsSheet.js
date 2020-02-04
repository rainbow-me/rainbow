import { get } from 'lodash';
import React from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { Column } from '../components/layout';
import { colors } from '../styles';
import { SavingsCoinRow } from '../components/coin-row';
import {
  SavingsPredictionStepper,
  SavingsSheetHeader,
} from '../components/savings';
import {
  FloatingEmojis,
  FloatingEmojisTapHandler,
} from '../components/floating-emojis';
import { Sheet, SheetButton, SheetButtonRow } from '../components/sheet';
import Divider from '../components/Divider';
import { useSavingsAccount } from '../hooks';

function SavingsSheet() {
  const { navigate } = useNavigation();
  const savings = useSavingsAccount();

  console.log('savings', savings);

  return (
    <Sheet>
      <SavingsSheetHeader balance="$420.59" lifetimeAccruedInterest="$20.59" />
      <SheetButtonRow>
        <SheetButton
          color={colors.dark}
          icon="minusCircled"
          label="Withdraw"
          onPress={() => navigate('SavingsWithdrawModal')}
        />
        <SheetButton
          color={colors.dodgerBlue}
          icon="plusCircled"
          label="Deposit"
          onPress={() => navigate('SavingsDepositModal')}
        />
      </SheetButtonRow>
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
              {savings.map(({ name, symbol, ...item }) => (
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
    </Sheet>
  );
}

export default React.memo(SavingsSheet);
