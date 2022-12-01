import React from 'react';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import {
  ProtocolType,
  RainbowTransaction,
  TransactionStatus,
  TransactionType,
} from '@/entities';
import { Network } from '@/helpers';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

// TODO: Remove this file after finishing work on APP-27

const transactions: Record<string, RainbowTransaction> = {
  'Sent': {
    address: 'eth',
    balance: {
      amount: '0.00077111',
      display: '0.000771 ETH',
    },
    description: 'Ethereum',
    from: '0x5e087b61aad29559e31565079fcdabe384b44614',
    hash:
      '0x7b1a15f209f5850cf27e7fdf1d23815a4bcefe011dbd982f632442557076f228-0',
    minedAt: 1666203035,
    name: 'Ethereum',
    native: {
      amount: '1.0000371368',
      display: '$1.00',
    },
    network: Network.mainnet,
    nonce: 87,
    pending: false,
    status: TransactionStatus.sent,
    symbol: 'ETH',
    title: 'Sent',
    to: '0xe0e0f2277752af0f797855be0c24d13c15e5a261',
    type: TransactionType.send,
    fee: { price: 1186.44, value: 2422871970692212 },
  },
  'Received': {
    address: '0x23b608675a2b2fb1890d3abbd85c5775c51691d5',
    balance: {
      amount: '0.000101998237529782',
      display: '0.000102 SOCKS',
    },
    description: 'Unisocks',
    from: '0x00000000009726632680fb29d3f7a9734e3010e2',
    hash:
      '0x90511d67e92670242260cd49becbd59edadd2b8cf727dc8dafcf524dfd7259a3-1',
    minedAt: 1666297559,
    name: 'Unisocks',
    native: {
      amount: '2.60395150982855915008706328',
      display: '$2.60',
    },
    network: Network.mainnet,
    nonce: 1000,
    pending: false,
    status: TransactionStatus.received,
    symbol: 'SOCKS',
    title: 'Received',
    to: '0x5e087b61aad29559e31565079fcdabe384b44614',
    type: TransactionType.receive,
  },
  'Failed': {
    address: 'eth',
    balance: {
      amount: '0.003739995512004999',
      display: '0.00374 ETH',
    },
    description: 'Ethereum',
    from: '0x5e087b61aad29559e31565079fcdabe384b44614',
    hash:
      '0x6752a68c377e81ee63f2b3237b00e88f57d220b152743a063997d7e2ffdf37e3-0',
    minedAt: 1665754055,
    name: 'Ethereum',
    native: {
      amount: '5.00108459869796461281',
      display: '$5.00',
    },
    network: Network.mainnet,
    nonce: 56,
    pending: false,
    status: TransactionStatus.failed,
    symbol: 'ETH',
    title: 'Failed',
    to: '0xc30141b657f4216252dc59af2e7cdb9d8792e1b0',
    type: TransactionType.trade,
    fee: { price: 1258.2, value: 17750462695427 },
  },
  'Swapped': {
    address: 'eth',
    balance: {
      amount: '0.00774887447598',
      display: '0.00775 ETH',
    },
    description: 'Ethereum',
    from: '0x5e087b61aad29559e31565079fcdabe384b44614',
    hash:
      '0x225be3f93d89fb2513c4362a956ec99041b06485a736242e69dd20d6e5bd8d9b-0',
    minedAt: 1665510599,
    name: 'Ethereum',
    native: {
      amount: '10.0020921961054644',
      display: '$10.00',
    },
    network: Network.mainnet,
    nonce: 86,
    pending: false,
    status: TransactionStatus.swapped,
    symbol: 'ETH',
    title: 'Swapped',
    to: '0xc30141b657f4216252dc59af2e7cdb9d8792e1b0',
    type: TransactionType.trade,
    fee: { price: 1258.2, value: 17750462695427280 },
  },
  'Contract Interaction': {
    address: 'eth',
    balance: {
      amount: '0',
      display: '0.00 ETH',
    },
    description: 'Set Name',
    from: '0x5e087b61aad29559e31565079fcdabe384b44614',
    hash:
      '0xef93c6e9702b16d9acd3d16417ca6b56ddf688f4978b68f30a8d9cb1e42b883d-0',
    minedAt: 1661979911,
    name: 'Set Name',
    native: {
      amount: '0',
      display: '$0.00',
    },
    network: Network.mainnet,
    nonce: 53,
    pending: false,
    status: TransactionStatus.contract_interaction,
    symbol: 'contract',
    title: 'Contract Interaction',
    to: '0x084b1c3c81545d370f3634392de611caabff8148',
    type: TransactionType.contract_interaction,
    fee: { price: 1258.2, value: 17750462695427280 },
  },
  'Savings': {
    address: '0x5e087b61aad29559e31565079fcdabe384b44614',
    balance: {
      amount: '10',
      display: '10.00 DAI',
    },
    description: 'Withdrew Dai',
    from: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
    hash:
      '0x425d39c5b80b32f4278a408516459e5d2e2ec4462e1309f29debf53a7f2632cd-0',
    minedAt: 1666125239,
    name: 'Dai',
    native: {
      amount: '10.032490125',
      display: '$10.03',
    },
    network: Network.mainnet,
    nonce: 987,
    pending: false,
    protocol: ProtocolType.compound,
    status: TransactionStatus.withdrew,
    symbol: 'DAI',
    title: 'Savings',
    to: '0x2e67869829c734ac13723a138a952f7a8b56e774',
    type: TransactionType.withdraw,
    fee: { price: 1258.2, value: 17750462695427280 },
  },
  'Pending': {
    address: 'eth',
    balance: { amount: '0.00077938', display: '0.000779 ETH' },
    data: '0x',
    description: 'Ethereum',
    from: '0x5e087b61Aad29559E31565079FCdAbe384B44614',
    gasLimit: '21000',
    hash:
      '0xcec794006dcd59227822b75de46f265a9e43243310bba59ae7d1d01c1c34426d-0',
    maxFeePerGas: '0x0342770c00',
    maxPriorityFeePerGas: '0x3b9aca00',
    minedAt: null,
    name: 'Ethereum',
    native: { amount: '0.9999990966', display: '$1.00' },
    network: Network.mainnet,
    nonce: 114,
    pending: true,
    status: TransactionStatus.sending,
    symbol: 'ETH',
    title: 'Sending',
    to: '0x3c74D5D6E0F55d75cc850c9AeE0Dda99Fbfd5415',
    txTo: '0x3c74D5D6E0F55d75cc850c9AeE0Dda99Fbfd5415',
    type: TransactionType.send,
    value: '0x02c4d78c0b8800',
  },
};

const TxItem: React.FC<{
  title: string;
  transactionDetails: RainbowTransaction;
}> = ({ title, transactionDetails }) => {
  const navigation = useNavigation();

  const onPress = () => {
    navigation.navigate(Routes.TRANSACTION_DETAILS, {
      transaction: transactionDetails,
    });
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
