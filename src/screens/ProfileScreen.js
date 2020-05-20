import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useIsFocused } from 'react-navigation-hooks';
import AddFundsInterstitial from '../components/AddFundsInterstitial';
import { ActivityList } from '../components/activity-list';
import {
  BackButton,
  Header,
  HeaderButton,
  HeaderWalletInfo,
} from '../components/header';
import { Icon } from '../components/icons';
import { FlexItem, Page } from '../components/layout';
import { ProfileMasthead } from '../components/profile';
import TransactionList from '../components/transaction-list/TransactionList';
import { isMultiwalletAvailable } from '../config/experimental';
import nativeTransactionListAvailable from '../helpers/isNativeTransactionListAvailable';
import NetworkTypes from '../helpers/networkTypes';
import {
  useAccountSettings,
  useAccountTransactions,
  useContacts,
  useRequests,
  useWallets,
} from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { colors, position } from '../styles';
import Routes from './Routes/routesNames';

const ACTIVITY_LIST_INITIALIZATION_DELAY = 5000;

const ProfileScreen = ({ navigation }) => {
  const [activityListInitialized, setActivityListInitialized] = useState(false);
  const isFocused = useIsFocused();
  const { navigate } = useNavigation();

  const {
    isLoadingTransactions: isLoading,
    sections,
    transactions,
    transactionsCount,
  } = useAccountTransactions(activityListInitialized, isFocused);
  const { contacts } = useContacts();
  const { pendingRequestCount, requests } = useRequests();
  const { accountAddress, accountENS, network } = useAccountSettings();
  const { selectedWallet } = useWallets();

  const isEmpty = !transactionsCount && !pendingRequestCount;

  useEffect(() => {
    setTimeout(() => {
      setActivityListInitialized(true);
    }, ACTIVITY_LIST_INITIALIZATION_DELAY);
  }, []);

  const onPressBackButton = useCallback(() => navigate(Routes.WALLET_SCREEN), [
    navigate,
  ]);

  const onPressSettings = useCallback(() => navigate(Routes.SETTINGS_MODAL), [
    navigate,
  ]);

  let accountName = get(selectedWallet, 'name');
  let accountColor = get(selectedWallet, 'color');

  const onPressProfileHeader = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_MODAL);
  }, [navigate]);

  const addCashSupportedNetworks =
    network === NetworkTypes.kovan || network === NetworkTypes.mainnet;
  const addCashAvailable = Platform.OS === 'ios' && addCashSupportedNetworks;

  return (
    <Page component={FlexItem} style={position.sizeAsObject('100%')}>
      <Header justify="space-between">
        <HeaderButton onPress={onPressSettings}>
          <Icon color={colors.black} name="gear" />
        </HeaderButton>
        {isMultiwalletAvailable && (
          <HeaderWalletInfo
            accountColor={accountColor}
            accountName={accountName}
            onPress={onPressProfileHeader}
          />
        )}
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
          accountENS={accountENS}
          accountName={accountName}
          addCashAvailable={addCashAvailable}
          contacts={contacts}
          header={
            <ProfileMasthead
              accountAddress={accountAddress}
              accountColor={accountColor}
              accountName={accountName}
              accountENS={accountENS}
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
          style={[
            { flex: 1 },
            isMultiwalletAvailable ? { marginTop: 10 } : null,
          ]}
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
