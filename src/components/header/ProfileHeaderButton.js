import React, { useCallback } from 'react';
import { useAccountProfile, useRequests } from '../../hooks';
import { useNavigation } from '../../navigation/Navigation';
import { NumberBadge } from '../badge';
import { ContactAvatar } from '../contacts';
import ImageAvatar from '../contacts/ImageAvatar';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

export default function ProfileHeaderButton() {
  const { navigate } = useNavigation();
  const { pendingRequestCount } = useRequests();
  const { accountSymbol, accountColor, accountImage } = useAccountProfile();

  const onPress = useCallback(() => navigate(Routes.PROFILE_SCREEN), [
    navigate,
  ]);

  const onLongPress = useCallback(() => navigate(Routes.CHANGE_WALLET_SHEET), [
    navigate,
  ]);

  return (
    <HeaderButton
      onLongPress={onLongPress}
      onPress={onPress}
      testID="navbar-profile-button"
      transformOrigin="left"
    >
      <Centered>
        {accountImage ? (
          <ImageAvatar image={accountImage} size="small" />
        ) : (
          <ContactAvatar
            color={isNaN(accountColor) ? colors.skeleton : accountColor}
            size="small"
            value={accountSymbol}
          />
        )}
        <NumberBadge
          isVisible={Number(pendingRequestCount) > 0}
          value={pendingRequestCount}
        />
      </Centered>
    </HeaderButton>
  );
}
