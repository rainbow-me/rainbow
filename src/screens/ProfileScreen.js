import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import styled from 'styled-components/primitives';
import { ActivityList } from '../components/activity-list';
import { BackButton, Header, HeaderButton } from '../components/header';
import { Icon } from '../components/icons';
import { Page } from '../components/layout';
import { LoadingOverlay } from '../components/modal';
import { ProfileMasthead } from '../components/profile';
import TransactionList from '../components/transaction-list/TransactionList';
import useNativeTransactionListAvailable from '../helpers/isNativeTransactionListAvailable';
import NetworkTypes from '../helpers/networkTypes';
import {
  useAccountSettings,
  useAccountTransactions,
  useContacts,
  useRequests,
  useWallets,
} from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { sheetVerticalOffset } from '../navigation/effects';
import { usePortal } from '../react-native-cool-modals/Portal';
import Routes from '@rainbow-me/routes';
import { colors, position } from '@rainbow-me/styles';

const ACTIVITY_LIST_INITIALIZATION_DELAY = 5000;

const ProfileScreenPage = styled(Page)`
  ${position.size('100%')};
  flex: 1;
`;

export default function ProfileScreen({ navigation }) {
  const [activityListInitialized, setActivityListInitialized] = useState(false);
  const isFocused = useIsFocused();
  const { navigate } = useNavigation();
  const { isWalletLoading } = useWallets();
  const nativeTransactionListAvailable = useNativeTransactionListAvailable();
  const { setComponent, hide } = usePortal();

  useEffect(() => {
    if (isWalletLoading) {
      setComponent(
        <LoadingOverlay
          paddingTop={sheetVerticalOffset}
          title={isWalletLoading}
        />,
        false
      );
    }
    return hide;
  }, [hide, isWalletLoading, setComponent]);
  const {
    isLoadingTransactions: isLoading,
    sections,
    transactions,
    transactionsCount,
  } = useAccountTransactions(activityListInitialized, isFocused);

  const { contacts } = useContacts();
  const { pendingRequestCount, requests } = useRequests();
  const { network } = useAccountSettings();

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

  const onChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const addCashSupportedNetworks =
    network === NetworkTypes.kovan || network === NetworkTypes.mainnet;
  const addCashAvailable = Platform.OS === 'ios' && addCashSupportedNetworks;

  return (
    <ProfileScreenPage>
      <Header justify="space-between">
        <HeaderButton onPress={onPressSettings} testID="settings-button">
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
          addCashAvailable={addCashAvailable}
          contacts={contacts}
          initialized={activityListInitialized}
          isLoading={isLoading}
          network={network}
          requests={requests}
          transactions={transactions}
        />
      ) : (
        <ActivityList
          addCashAvailable={addCashAvailable}
          header={
            <ProfileMasthead
              addCashAvailable={addCashAvailable}
              navigation={navigation}
              onChangeWallet={onChangeWallet}
            />
          }
          isEmpty={isEmpty}
          isLoading={isLoading}
          navigation={navigation}
          network={network}
          sections={sections}
        />
      )}
    </ProfileScreenPage>
  );
}
