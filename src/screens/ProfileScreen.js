import PropTypes from 'prop-types';
import React from 'react';
import { ActivityList } from '../components/activity-list';
import AddFundsInterstitial from '../components/AddFundsInterstitial';
import { BackButton, Header, HeaderButton } from '../components/header';
import { FlexItem, Page } from '../components/layout';
import { Icon } from '../components/icons';
import { ProfileMasthead } from '../components/profile';
import { colors, position } from '../styles';
import TransactionList from '../components/transaction-list/TransactionList';
import nativeTransactionListAvailable from '../helpers/isNativeTransactionListAvailable';
import networkTypes from '../helpers/networkTypes';

const ProfileScreen = ({
  accountColor,
  accountName,
  accountAddress,
  isEmpty,
  nativeCurrency,
  navigation,
  network,
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
      />
    )}
    {/* Show the interstitial only for mainnet */}
    {isEmpty && network === networkTypes.mainnet && (
      <AddFundsInterstitial network={network} />
    )}
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
