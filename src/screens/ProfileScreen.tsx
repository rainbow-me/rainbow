import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import styled from 'styled-components';
import { ActivityList } from '../components/activity-list';
import { BackButton, Header, HeaderButton } from '../components/header';
import { Icon } from '../components/icons';
import { Page } from '../components/layout';
import { ProfileMasthead } from '../components/profile';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/transaction-list/Transaction... Remove this comment to see the full error message
import TransactionList from '../components/transaction-list/TransactionList';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
import useNativeTransactionListAvailable from '../helpers/isNativeTransactionListAvailable';
import NetworkTypes from '../helpers/networkTypes';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../navigation/Navigation' was resolved to ... Remove this comment to see the full error message
import { useNavigation } from '../navigation/Navigation';
import {
  useAccountSettings,
  useAccountTransactions,
  useContacts,
  useRequests,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const ACTIVITY_LIST_INITIALIZATION_DELAY = 5000;

const ProfileScreenPage = styled(Page)`
  ${position.size('100%')};
  flex: 1;
`;

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [activityListInitialized, setActivityListInitialized] = useState(false);
  const isFocused = useIsFocused();
  const { navigate } = useNavigation();
  const nativeTransactionListAvailable = useNativeTransactionListAvailable();

  const accountTransactions = useAccountTransactions(
    activityListInitialized,
    isFocused
  );
  const {
    isLoadingTransactions: isLoading,
    sections,
    transactions,
    transactionsCount,
  } = accountTransactions;
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'IS_DEV'.
    (IS_DEV && network === NetworkTypes.kovan) ||
    network === NetworkTypes.mainnet;
  const addCashAvailable =
    IS_TESTING === 'true' ? false : addCashSupportedNetworks;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ProfileScreenPage testID="profile-screen">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Header align="center" justify="space-between">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <HeaderButton
          onPress={onPressSettings}
          opacityTouchable={false}
          radiusAndroid={42}
          radiusWrapperStyle={{
            alignItems: 'center',
            height: 42,
            justifyContent: 'center',
            marginLeft: 5,
            width: 42,
          }}
          testID="settings-button"
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Icon color={colors.black} name="gear" />
        </HeaderButton>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BackButton
          color={colors.black}
          direction="right"
          onPress={onPressBackButton}
        />
      </Header>
      {network === NetworkTypes.mainnet && nativeTransactionListAvailable ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ActivityList
          addCashAvailable={addCashAvailable}
          header={
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ProfileMasthead
              addCashAvailable={addCashAvailable}
              onChangeWallet={onChangeWallet}
            />
          }
          isEmpty={isEmpty}
          isLoading={isLoading}
          navigation={navigation}
          network={network}
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
          recyclerListView={ios}
          sections={sections}
          {...accountTransactions}
        />
      )}
    </ProfileScreenPage>
  );
}
