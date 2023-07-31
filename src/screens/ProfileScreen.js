import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import { ActivityList } from '../components/activity-list';
import { Page } from '../components/layout';
import { ProfileMasthead } from '../components/profile';
import NetworkTypes from '../helpers/networkTypes';
import { useNavigation } from '../navigation/Navigation';
import { ButtonPressAnimation } from '@/components/animations';
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
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ContactAvatar } from '@/components/contacts';

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
  const { accountSymbol, accountColor, accountImage } = useAccountProfile();

  const isEmpty = !transactionsCount && !pendingRequestCount;

  useEffect(() => {
    setTimeout(() => {
      setActivityListInitialized(true);
    }, ACTIVITY_LIST_INITIALIZATION_DELAY);
  }, []);

  const onChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const addCashSupportedNetworks = network === NetworkTypes.mainnet;
  const addCashAvailable =
    IS_TESTING === 'true' ? false : addCashSupportedNetworks;

  return (
    <ProfileScreenPage testID="profile-screen">
      <Navbar
        title="Activity"
        hasStatusBarInset
        leftComponent={
          <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8}>
            {accountImage ? (
              <ImageAvatar
                image={accountImage}
                marginRight={10}
                size="header"
              />
            ) : (
              <ContactAvatar
                color={accountColor}
                marginRight={10}
                size="small"
                value={accountSymbol}
              />
            )}
          </ButtonPressAnimation>
        }
      />

      <ActivityList
        addCashAvailable={addCashAvailable}
        contacts={contacts}
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
