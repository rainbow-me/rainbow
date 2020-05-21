import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useAccountProfile, useCoinListEdited, useRequests } from '../../hooks';
import Routes from '../../screens/Routes/routesNames';
import { OpacityToggler } from '../animations';
import { Badge } from '../badge';
import { ContactAvatar } from '../contacts';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';

export default function ProfileHeaderButton() {
  const { navigate } = useNavigation();
  const { pendingRequestCount } = useRequests();
  const { isCoinListEdited } = useCoinListEdited();
  const { accountSymbol, accountColor } = useAccountProfile();

  const onPress = useCallback(() => navigate(Routes.PROFILE_SCREEN), [
    navigate,
  ]);

  const onLongPress = useCallback(() => navigate(Routes.CHANGE_WALLET_SHEET), [
    navigate,
  ]);

  return (
    <OpacityToggler
      endingOpacity={0.4}
      isVisible={isCoinListEdited}
      startingOpacity={1}
    >
      <View pointerEvents={isCoinListEdited ? 'none' : 'auto'}>
        <HeaderButton
          onLongPress={onLongPress}
          onPress={onPress}
          testID="goToProfile"
          transformOrigin="left"
        >
          <Centered>
            <ContactAvatar
              color={accountColor}
              size="small"
              value={accountSymbol}
            />
            {pendingRequestCount > 0 && (
              <Badge delay={1500} value={pendingRequestCount} zIndex={1} />
            )}
          </Centered>
        </HeaderButton>
      </View>
    </OpacityToggler>
  );
}
