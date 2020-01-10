import PropTypes from 'prop-types';
import React from 'react';
import { Linking } from 'react-native';
import { ActivityList } from '../components/activity-list';
import AddFundsInterstitial from '../components/AddFundsInterstitial';
import { BackButton, Header, HeaderButton } from '../components/header';
import { FlexItem, Page } from '../components/layout';
import { Icon } from '../components/icons';
import { ProfileMasthead } from '../components/profile';
import { showActionSheetWithOptions } from '../utils/actionsheet';
import { colors, position } from '../styles';
import TransactionList from '../components/transaction-list/TransactionList';

const onPressTransaction = ({ hash }) => {
  showActionSheetWithOptions(
    {
      cancelButtonIndex: 1,
      options: ['View on Etherscan', 'Cancel'],
    },
    buttonIndex => {
      if (buttonIndex === 0) {
        const normalizedHash = hash.replace(/-.*/g, '');
        Linking.openURL(`https://etherscan.io/tx/${normalizedHash}`);
      }
    },
  );
};

const ProfileScreen = ({
  accountAddress,
  isEmpty,
  nativeCurrency,
  navigation,
  onPressBackButton,
  onPressSettings,
  requests,
  transactions,
  transactionsCount,
}) => (
  <Page component={FlexItem} style={position.sizeAsObject('100%')}>
    <Header justify="space-between">
      <HeaderButton onPress={onPressSettings}>
        <Icon color={colors.black} name="gear" />
      </HeaderButton>
      <BackButton
        color={colors.black}
        direction="right"
        onPress={onPressBackButton}
      />
    </Header>
    <TransactionList
      transactions={transactions}
      accountAddress={accountAddress}
      onPressTransaction={e => onPressTransaction(e)}
      style={{ flex: 1 }}
    />
    {/* <ActivityList
      accountAddress={accountAddress}
      header={
        <ProfileMasthead
          accountAddress={accountAddress}
          navigation={navigation}
          showBottomDivider={!isEmpty}
        />
      }
      isEmpty={isEmpty}
      nativeCurrency={nativeCurrency}
      requests={requests}
      transactions={transactions}
      transactionsCount={transactionsCount}
    /> */}
    {isEmpty && <AddFundsInterstitial />}
  </Page>
);

ProfileScreen.propTypes = {
  accountAddress: PropTypes.string,
  isEmpty: PropTypes.bool,
  nativeCurrency: PropTypes.string,
  navigation: PropTypes.object,
  onPressBackButton: PropTypes.func,
  onPressSettings: PropTypes.func,
  requests: PropTypes.array,
  transactions: PropTypes.array,
  transactionsCount: PropTypes.number,
};

export default ProfileScreen;
