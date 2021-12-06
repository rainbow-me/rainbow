import Clipboard from '@react-native-community/clipboard';
import analytics from '@segment/analytics-react-native';
import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { RainbowButton } from '../buttons';
import { FloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered, Column, Row, RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AvatarCircle' was resolved to '/Users/ni... Remove this comment to see the full error message
import AvatarCircle from './AvatarCircle';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ProfileAction' was resolved to '/Users/n... Remove this comment to see the full error message
import ProfileAction from './ProfileAction';
import useExperimentalFlag, {
  AVATAR_PICKER,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/config/experimenta... Remove this comment to see the full error message
} from '@rainbow-me/config/experimentalHooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/support' o... Remove this comment to see the full error message
import showWalletErrorAlert from '@rainbow-me/helpers/support';
import {
  useAccountProfile,
  useDimensions,
  useOnAvatarPress,
  useWallets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { abbreviations } from '@rainbow-me/utils';

const dropdownArrowWidth = 21;

const FloatingEmojisRegion = styled(FloatingEmojis).attrs({
  distance: 250,
  duration: 500,
  fadeOut: false,
  scaleTo: 0,
  size: 50,
  wiggleFactor: 0,
})`
  height: 0;
  left: 0;
  position: absolute;
  top: 0;
  width: 130;
`;

const AccountName = styled(TruncatedText).attrs({
  align: 'left',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  truncationLength: 4,
  weight: 'bold',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  height: ${android ? '38' : '33'};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-top: ${android ? '-10' : '-1'};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-bottom: ${android ? '10' : '1'};
  max-width: ${({ deviceWidth }) => deviceWidth - dropdownArrowWidth - 60};
  padding-right: 6;
`;

const AddCashButton = styled(RainbowButton).attrs({
  overflowMargin: 30,
  skipTopMargin: true,
  type: 'addCash',
})`
  margin-top: 16;
`;

const DropdownArrow = styled(Centered)`
  height: 9;
  margin-top: 11;
  width: ${dropdownArrowWidth};
`;

const ProfileMastheadDivider = styled(Divider).attrs(
  ({ theme: { colors } }) => ({
    color: colors.rowDividerLight,
  })
)`
  bottom: 0;
  position: absolute;
`;

export default function ProfileMasthead({
  addCashAvailable,
  recyclerListRef,
  showBottomDivider = true,
}: any) {
  const { isDamaged } = useWallets();
  const onNewEmoji = useRef();
  const setOnNewEmoji = useCallback(
    newOnNewEmoji => (onNewEmoji.current = newOnNewEmoji),
    []
  );
  const { width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const {
    accountAddress,
    accountColor,
    accountSymbol,
    accountName,
    accountImage,
  } = useAccountProfile();
  const isAvatarPickerAvailable = useExperimentalFlag(AVATAR_PICKER);

  const { onAvatarPress } = useOnAvatarPress();

  const handlePressAvatar = useCallback(() => {
    recyclerListRef?.scrollToTop(true);
    setTimeout(
      onAvatarPress,
      recyclerListRef?.getCurrentScrollOffset() > 0 ? 200 : 1
    );
  }, [onAvatarPress, recyclerListRef]);

  const handlePressReceive = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }
    navigate(Routes.RECEIVE_MODAL);
  }, [navigate, isDamaged]);

  const handlePressAddCash = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    analytics.track('Tapped Add Cash', {
      category: 'add cash',
    });

    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    if (ios) {
      navigate(Routes.ADD_CASH_FLOW);
    } else {
      navigate(Routes.WYRE_WEBVIEW_NAVIGATOR, {
        params: {
          address: accountAddress,
        },
        screen: Routes.WYRE_WEBVIEW,
      });
    }
  }, [accountAddress, navigate, isDamaged]);

  const handlePressChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  const handlePressCopyAddress = useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
    }
    if (onNewEmoji && onNewEmoji.current) {
      // @ts-expect-error ts-migrate(2722) FIXME: Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
      onNewEmoji.current();
    }
    Clipboard.setString(accountAddress);
  }, [accountAddress, isDamaged]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column
      align="center"
      height={addCashAvailable ? 260 : 185}
      marginBottom={24}
      marginTop={0}
    >
      {/* [AvatarCircle -> ImageAvatar -> ImgixImage], so no need to sign accountImage here. */}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <AvatarCircle
        accountColor={accountColor}
        accountSymbol={accountSymbol}
        image={accountImage}
        isAvatarPickerAvailable={isAvatarPickerAvailable}
        onPress={handlePressAvatar}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation onPress={handlePressChangeWallet}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Row>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <AccountName deviceWidth={deviceWidth}>{accountName}</AccountName>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <DropdownArrow>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Icon color={colors.dark} direction="down" name="caret" />
          </DropdownArrow>
        </Row>
      </ButtonPressAnimation>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <RowWithMargins align="center" margin={19}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ProfileAction
          icon="copy"
          onPress={handlePressCopyAddress}
          radiusWrapperStyle={{ marginRight: 10, width: 150 }}
          scaleTo={0.88}
          text="Copy Address"
          width={127}
          wrapperProps={{
            containerStyle: {
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              paddingLeft: 10,
            },
          }}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <FloatingEmojisRegion setOnNewEmoji={setOnNewEmoji} />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ProfileAction
          icon="qrCode"
          onPress={handlePressReceive}
          radiusWrapperStyle={{ marginRight: 10, width: 104 }}
          scaleTo={0.88}
          text="Receive"
          width={81}
          wrapperProps={{
            containerStyle: {
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              paddingLeft: 10,
            },
          }}
        />
      </RowWithMargins>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {addCashAvailable && <AddCashButton onPress={handlePressAddCash} />}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {showBottomDivider && <ProfileMastheadDivider />}
    </Column>
  );
}
