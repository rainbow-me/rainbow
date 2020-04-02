import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { ActivityList } from '../components/activity-list';
import AddFundsInterstitial from '../components/AddFundsInterstitial';
import { BackButton, Header, HeaderButton } from '../components/header';
import { Icon } from '../components/icons';
import { FlexItem, Page } from '../components/layout';
import { ProfileMasthead } from '../components/profile';
import TransactionList from '../components/transaction-list/TransactionList';
import nativeTransactionListAvailable from '../helpers/isNativeTransactionListAvailable';
import networkTypes from '../helpers/networkTypes';
import { colors, position } from '../styles';

const ACTIVITY_LIST_INITIALIZATION_DELAY = 5000;

const ProfileScreen = ({
  accountColor,
  accountName,
  accountAddress,
  isEmpty,
  nativeCurrency,
  navigation,
  network,
  requests,
  transactions,
  transactionsCount,
}) => {
  const [activityListInitialized, setActivityListInitialized] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setActivityListInitialized(true);
    }, ACTIVITY_LIST_INITIALIZATION_DELAY);
  }, []);

  const onPressBackButton = () => navigation.navigate('WalletScreen');
  const onPressSettings = () => navigation.navigate('SettingsModal');

  return (
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
        <TransactionList
          initialized={activityListInitialized}
          navigation={navigation}
          style={{ flex: 1 }}
          header={
            <ProfileMasthead
              accountAddress={accountAddress}
              accountColor={accountColor}
              accountName={accountName}
              navigation={navigation}
              showBottomDivider={!isEmpty}
            />
          }
        />
      ) : (
        <ActivityList
          accountAddress={accountAddress}
          accountColor={accountColor}
          accountName={accountName}
          navigation={navigation}
          initialized={activityListInitialized}
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
};

ProfileScreen.propTypes = {
  accountAddress: PropTypes.string,
  isEmpty: PropTypes.bool,
  nativeCurrency: PropTypes.string,
  navigation: PropTypes.object,
  network: PropTypes.string,
  requests: PropTypes.array,
  transactions: PropTypes.array,
  transactionsCount: PropTypes.number,
};

export default ProfileScreen;
