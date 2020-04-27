import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useIsFocused } from 'react-navigation-hooks';
import AddFundsInterstitial from '../components/AddFundsInterstitial';
import { ActivityList } from '../components/activity-list';
import { BackButton, Header, HeaderButton } from '../components/header';
import { Icon } from '../components/icons';
import { FlexItem, Page } from '../components/layout';
import { ProfileMasthead } from '../components/profile';
import TransactionList from '../components/transaction-list/TransactionList';
import nativeTransactionListAvailable from '../helpers/isNativeTransactionListAvailable';
import NetworkTypes from '../helpers/networkTypes';
import {
  useAccountSettings,
  useAccountTransactions,
  useContacts,
  useRequests,
} from '../hooks';
import { colors, position } from '../styles';
import Routes from './Routes/routesNames';

const ACTIVITY_LIST_INITIALIZATION_DELAY = 5000;

const ProfileScreen = ({ navigation }) => {
  const [activityListInitialized, setActivityListInitialized] = useState(false);
  const isFocused = useIsFocused();

  const {
    isLoadingTransactions: isLoading,
    sections,
    transactions,
    transactionsCount,
  } = useAccountTransactions(activityListInitialized, isFocused);
  const { contacts } = useContacts();
  const { pendingRequestCount, requests } = useRequests();
  const {
    accountAddress,
    accountColor,
    accountName,
    network,
  } = useAccountSettings();

  const isEmpty = !transactionsCount && !pendingRequestCount;

  useEffect(() => {
    setTimeout(() => {
      setActivityListInitialized(true);
    }, ACTIVITY_LIST_INITIALIZATION_DELAY);
  }, []);

  const onPressBackButton = useCallback(
    () => navigation.navigate(Routes.WALLET_SCREEN),
    [navigation]
  );

  const onPressSettings = useCallback(
    () => navigation.navigate(Routes.SETTINGS_MODAL),
    [navigation]
  );

  const addCashInDevNetworks =
    __DEV__ &&
    (network === NetworkTypes.kovan || network === NetworkTypes.mainnet);
  const addCashInProdNetworks = !__DEV__ && network === NetworkTypes.mainnet;
  const addCashAvailable =
    Platform.OS === 'ios' && (addCashInDevNetworks || addCashInProdNetworks);

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
      {network === NetworkTypes.mainnet && nativeTransactionListAvailable ? (
        <TransactionList
          accountAddress={accountAddress}
          accountColor={accountColor}
          accountName={accountName}
          addCashAvailable={addCashAvailable}
          contacts={contacts}
          header={
            <ProfileMasthead
              accountAddress={accountAddress}
              accountColor={accountColor}
              accountName={accountName}
              addCashAvailable={addCashAvailable}
              navigation={navigation}
              showBottomDivider={!isEmpty || isLoading}
            />
          }
          initialized={activityListInitialized}
          isLoading={isLoading}
          navigation={navigation}
          network={network}
          requests={requests}
          style={{ flex: 1 }}
          transactions={transactions}
        />
      ) : (
        <ActivityList
          accountAddress={accountAddress}
          accountColor={accountColor}
          accountName={accountName}
          addCashAvailable={addCashAvailable}
          header={
            <ProfileMasthead
              accountAddress={accountAddress}
              accountColor={accountColor}
              accountName={accountName}
              addCashAvailable={addCashAvailable}
              navigation={navigation}
              showBottomDivider={!isEmpty || isLoading}
            />
          }
          isEmpty={isEmpty}
          isLoading={isLoading}
          navigation={navigation}
          network={network}
          sections={sections}
        />
      )}
      {/* Show the interstitial only for mainnet */}
      {isEmpty && !isLoading && network === NetworkTypes.mainnet && (
        <AddFundsInterstitial network={network} />
      )}
    </Page>
  );
};

ProfileScreen.propTypes = {
  navigation: PropTypes.object,
};

export default ProfileScreen;
