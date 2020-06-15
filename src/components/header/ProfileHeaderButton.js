import React, { useCallback } from 'react';
import { useAccountProfile, useRequests } from '../../hooks';
import { useNavigation } from '../../navigation/Navigation';
import Routes from '../../screens/Routes/routesNames';
import { colors } from '../../styles';
import { NumberBadge } from '../badge';
import { ContactAvatar } from '../contacts';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';

export default function ProfileHeaderButton() {
  const { navigate } = useNavigation();
  const { pendingRequestCount } = useRequests();
  const { accountSymbol, accountColor } = useAccountProfile();

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
      testID="goToProfile"
      transformOrigin="left"
    >
      <Centered>
        <ContactAvatar
          color={isNaN(accountColor) ? colors.skeleton : accountColor}
          size="small"
          value={accountSymbol}
        />
        <NumberBadge
          isVisible={pendingRequestCount > 0}
          value={pendingRequestCount}
        />
      </Centered>
    </HeaderButton>
  );
}
