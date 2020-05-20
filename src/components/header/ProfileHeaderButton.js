import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useAccountProfile, useCoinListEdited, useRequests } from '../../hooks';
import Routes from '../../screens/Routes/routesNames';
import { OpacityToggler } from '../animations';
import { Badge } from '../badge';
import { ContactAvatar } from '../contacts';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';

const ProfileHeaderButton = ({ navigation }) => {
  const { pendingRequestCount } = useRequests();
  const { isCoinListEdited } = useCoinListEdited();
  const { accountEmoji, accountColor } = useAccountProfile();

  const onPress = useCallback(
    () => navigation.navigate(Routes.PROFILE_SCREEN),
    [navigation]
  );

  const onLongPress = useCallback(
    () => navigation.navigate(Routes.CHANGE_WALLET_SHEET),
    [navigation]
  );

  return (
    <OpacityToggler
      endingOpacity={0.4}
      isVisible={isCoinListEdited}
      startingOpacity={1}
    >
      <View pointerEvents={isCoinListEdited ? 'none' : 'auto'}>
        <HeaderButton
          testID="goToProfile"
          onLongPress={onLongPress}
          onPress={onPress}
          shouldRasterizeIOS
          transformOrigin="left"
        >
          <Centered>
            <ContactAvatar
              color={accountColor}
              size="small"
              value={accountEmoji}
            />

            {pendingRequestCount > 0 && (
              <Badge delay={1500} value={pendingRequestCount} zIndex={1} />
            )}
          </Centered>
        </HeaderButton>
      </View>
    </OpacityToggler>
  );
};

ProfileHeaderButton.propTypes = {
  navigation: PropTypes.object,
};

export default ProfileHeaderButton;
