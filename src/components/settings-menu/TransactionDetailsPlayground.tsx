import React from 'react';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { RainbowTransaction } from '@/entities';

const transactions: Record<string, RainbowTransaction> = {
  'Sent': {},
  'Received': {},
  'Failed': {},
  'Swapped': {},
  'Contract Interaction': {},
  'Savings': {},
};

const TxItem: React.FC<{
  title: string;
  transactionDetails: RainbowTransaction;
}> = ({ title, transactionDetails }) => {
  const onPress = () => {
    console.log(JSON.stringify(transactionDetails));
  };

  return (
    <MenuItem
      onPress={onPress}
      size={52}
      titleComponent={<MenuItem.Title text={title} />}
    />
  );
};

const TransactionDetailsPlayground = () => {
  return (
    <MenuContainer>
      <Menu header={'Transactions by type'}>
        {Object.entries(transactions).map(([key, tx]) => (
          <TxItem key={key} title={key} transactionDetails={tx} />
        ))}
      </Menu>
    </MenuContainer>
  );
};

export default TransactionDetailsPlayground;
