import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import { ActivityList } from '../components/activity-list';
import { Page } from '../components/layout';
import { ProfileMasthead } from '../components/profile';
import NetworkTypes from '../helpers/networkTypes';
import { useNavigation } from '../navigation/Navigation';
import {
  useAccountSettings,
  useAccountTransactions,
  useContacts,
  useRequests,
} from '@/hooks';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { Navbar } from '@/components/navbar/Navbar';
import CaretRightIcon from '@/components/icons/svg/CaretRightIcon';
import * as ex from '@/screens/Explain';

const ACTIVITY_LIST_INITIALIZATION_DELAY = 5000;

const ProfileScreenPage = styled(Page)({
  ...position.sizeAsObject('100%'),
  flex: 1,
});

export default function ProfileScreen({ navigation }) {
  const [activityListInitialized, setActivityListInitialized] = useState(false);
  const isFocused = useIsFocused();
  const { navigate } = useNavigation();

  const accountTransactions = useAccountTransactions(
    activityListInitialized,
    isFocused
  );

  const {
    isLoadingTransactions: isLoading,
    sections,
    transactionsCount,
  } = accountTransactions;
  const { contacts } = useContacts();
  const { pendingRequestCount } = useRequests();
  const { network } = useAccountSettings();
  const { open } = ex.useExplainSheet();

  const isEmpty = !transactionsCount && !pendingRequestCount;

  useEffect(() => {
    setTimeout(() => {
      setActivityListInitialized(true);
    }, ACTIVITY_LIST_INITIALIZATION_DELAY);
  }, []);

  const onPressBackButton = useCallback(() => navigate(Routes.WALLET_SCREEN), [
    navigate,
  ]);

  const onPressSettings = useCallback(
    () =>
      open(() => (
        <>
          <ex.Emoji>👋</ex.Emoji>
          <ex.Title>New Sheet Who Dis</ex.Title>
          <ex.Body>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla sed
            ex id lacus tempor hendrerit eu sit amet dolor. Curabitur arcu nisl,
            aliquam nec risus id, laoreet consequat magna.
          </ex.Body>
          <ex.Body>
            Etiam pharetra nulla non est finibus, ut luctus nisi viverra. Nunc
            id sem sit amet ipsum posuere pharetra ut id nisl. Pellentesque a
            suscipit nisl.
          </ex.Body>
          <ex.Footer>
            <ex.Button label="Click Me" />
          </ex.Footer>
        </>
      )),
    [open]
  );

  // const onPressSettings = useCallback(
  //   () =>
  //     navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
  //       screen: Routes.PAIR_HARDWARE_WALLET_ERROR_SHEET,
  //     }),
  //   [navigate]
  // );

  const onChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const addCashSupportedNetworks = network === NetworkTypes.mainnet;
  const addCashAvailable =
    IS_TESTING === 'true' ? false : addCashSupportedNetworks;

  return (
    <ProfileScreenPage testID="profile-screen">
      <Navbar
        hasStatusBarInset
        leftComponent={
          <Navbar.Item onPress={onPressSettings} testID="settings-button">
            <Navbar.TextIcon icon="􀣋" />
          </Navbar.Item>
        }
        rightComponent={
          <Navbar.Item onPress={onPressBackButton}>
            <Navbar.SvgIcon icon={CaretRightIcon} />
          </Navbar.Item>
        }
      />

      <ActivityList
        addCashAvailable={addCashAvailable}
        contacts={contacts}
        header={
          <ProfileMasthead
            addCashAvailable={addCashAvailable}
            onChangeWallet={onChangeWallet}
          />
        }
        isEmpty={isEmpty}
        isLoading={isLoading}
        navigation={navigation}
        network={network}
        sections={sections}
        {...accountTransactions}
      />
    </ProfileScreenPage>
  );
}
