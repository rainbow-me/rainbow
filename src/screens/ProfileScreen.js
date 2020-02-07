import PropTypes from 'prop-types';
import React from 'react';
import { ActivityList } from '../components/activity-list';
import AddFundsInterstitial from '../components/AddFundsInterstitial';
import { BackButton, Header, HeaderButton } from '../components/header';
import { FlexItem, Page } from '../components/layout';
import { Icon } from '../components/icons';
import { ProfileMasthead } from '../components/profile';
import HeaderProfileInfo from '../components/header/HeaderProfileInfo';
import { colors, position } from '../styles';
import TransactionList from '../components/transaction-list/TransactionList';
import nativeTransactionListAvailable from '../helpers/isNativeTransactionListAvailable';

const ProfileScreen = ({
  accountAddress,
  accountColor,
  accountName,
  isEmpty,
  nativeCurrency,
  navigation,
  onPressBackButton,
  onPressProfileHeader,
  onPressSettings,
  requests,
  shouldUpdate,
  transactions,
  transactionsCount,
}) => (
  <Page component={FlexItem} style={position.sizeAsObject('100%')}>
    <Header justify="space-between">
      <HeaderButton onPress={onPressSettings}>
        <Icon color={colors.black} name="gear" />
      </HeaderButton>
      <HeaderProfileInfo
        accountAddress={accountAddress}
        accountColor={accountColor}
        accountName={accountName}
        onPress={onPressProfileHeader}
        shouldUpdate={shouldUpdate}
      >
        <Icon name="gear" />
      </HeaderProfileInfo>
      <BackButton direction="right" onPress={onPressBackButton} />
    </Header>
    {nativeTransactionListAvailable ? (
      <TransactionList navigation={navigation} style={{ flex: 1 }} />
    ) : (
      <ActivityList
        accountAddress={accountAddress}
        accountColor={accountColor}
        accountName={accountName}
        header={
          <ProfileMasthead
            accountAddress={accountAddress}
            accountColor={accountColor}
            accountName={accountName}
            navigation={navigation}
            showBottomDivider={!isEmpty}
          />
        }
        isEmpty={isEmpty}
        nativeCurrency={nativeCurrency}
        requests={requests}
        transactions={transactions}
        transactionsCount={transactionsCount}
        shouldUpdate={shouldUpdate}
      />
    )}
    {isEmpty && <AddFundsInterstitial />}
  </Page>
);

ProfileScreen.propTypes = {
  accountAddress: PropTypes.string,
  isEmpty: PropTypes.bool,
  nativeCurrency: PropTypes.string,
  navigation: PropTypes.object,
  onPressSettings: PropTypes.func,
  requests: PropTypes.array,
  transactions: PropTypes.array,
  transactionsCount: PropTypes.number,
};

export default ProfileScreen;
