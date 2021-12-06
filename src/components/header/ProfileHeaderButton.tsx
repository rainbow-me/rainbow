import React, { useCallback } from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';
import { NumberBadge } from '../badge';
import { ContactAvatar } from '../contacts';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../contacts/ImageAvatar' was resolved to '... Remove this comment to see the full error message
import ImageAvatar from '../contacts/ImageAvatar';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountProfile, useRequests } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';

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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <HeaderButton
      onLongPress={onLongPress}
      onPress={onPress}
      testID="navbar-profile-button"
      transformOrigin="left"
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered>
        {accountImage ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ImageAvatar image={accountImage} size="small" />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ContactAvatar
            color={isNaN(accountColor) ? colors.skeleton : accountColor}
            size="small"
            value={accountSymbol}
          />
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <NumberBadge
          isVisible={Number(pendingRequestCount) > 0}
          value={pendingRequestCount}
        />
      </Centered>
    </HeaderButton>
  );
}
