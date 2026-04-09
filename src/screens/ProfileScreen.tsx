import React from 'react';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Navbar } from '@/components/navbar/Navbar';
import { DelayedMount } from '@/components/utilities/DelayedMount';
import styled from '@/framework/ui/styled-thing';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { position } from '@/styles';
import { time } from '@/utils/time';

import { ActivityList } from '../components/activity-list';
import { Page } from '../components/layout';

const ProfileScreenPage = styled(Page)({
  ...position.sizeAsObject('100%'),
  flex: 1,
});

export default function ProfileScreen() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();

  return (
    <ProfileScreenPage testID="profile-screen">
      <Navbar
        title={i18n.t(i18n.l.profile.title)}
        hasStatusBarInset
        leftComponent={
          <ButtonPressAnimation onPress={onChangeWallet} scaleTo={0.8} overflowMargin={50}>
            {accountImage ? (
              <ImageAvatar image={accountImage} marginRight={10} size="header" />
            ) : (
              <ContactAvatar color={accountColor} marginRight={10} size="small" value={accountSymbol} />
            )}
          </ButtonPressAnimation>
        }
      />

      <DelayedMount delay="idle" maxWait={time.ms(300)}>
        <ActivityList />
      </DelayedMount>
    </ProfileScreenPage>
  );
}

function onChangeWallet(): void {
  Navigation.handleAction(Routes.CHANGE_WALLET_SHEET);
}
