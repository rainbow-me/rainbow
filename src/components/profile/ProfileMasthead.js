import Clipboard from '@react-native-community/clipboard';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useRef } from 'react';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { RainbowButton } from '../buttons';
import { FloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Centered, Column, Row, RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
import AvatarCircle from './AvatarCircle';
import ProfileAction from './ProfileAction';
import showWalletErrorAlert from '@rainbow-me/helpers/support';
import {
  useAccountProfile,
  useDimensions,
  useOnAvatarPress,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { abbreviations } from '@rainbow-me/utils';

const dropdownArrowWidth = 21;

const FloatingEmojisRegion = styled(FloatingEmojis).attrs({
  distance: 250,
  duration: 500,
  fadeOut: false,
  scaleTo: 0,
  size: 50,
  wiggleFactor: 0,
})({
  height: 0,
  left: 0,
  position: 'absolute',
  top: 0,
  width: 130,
});

const AccountName = styled(TruncatedText).attrs({
  align: 'left',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  letterSpacing: 'roundedMedium',
  size: 'bigger',
  truncationLength: 4,
  weight: 'bold',
})({
  height: android ? 38 : 33,
  marginBottom: android ? 10 : 1,
  marginTop: android ? -10 : -1,
  maxWidth: ({ deviceWidth }) => deviceWidth - dropdownArrowWidth - 60,
  paddingRight: 6,
});

const AddCashButton = styled(RainbowButton).attrs({
  overflowMargin: 30,
  skipTopMargin: true,
  type: 'addCash',
})({
  marginTop: 16,
});

const DropdownArrow = styled(Centered)({
  height: 9,
  marginTop: 11,
  width: dropdownArrowWidth,
});

const ProfileMastheadDivider = styled(Divider).attrs(
  ({ theme: { colors } }) => ({
    color: colors.rowDividerLight,
  })
)({
  bottom: 0,
  position: 'absolute',
});

export default function ProfileMasthead({
  addCashAvailable,
  recyclerListRef,
  showBottomDivider = true,
}) {
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
      onNewEmoji.current();
    }
    Clipboard.setString(accountAddress);
  }, [accountAddress, isDamaged]);

  const { colors } = useTheme();
  return (
    <Column
      align="center"
      height={addCashAvailable ? 260 : 185}
      marginBottom={24}
      marginTop={0}
    >
      {/* [AvatarCircle -> ImageAvatar -> ImgixImage], so no need to sign accountImage here. */}
      <AvatarCircle
        accountColor={accountColor}
        accountSymbol={accountSymbol}
        image={accountImage}
        isAvatarPickerAvailable
        onPress={handlePressAvatar}
        style={android && { marginTop: 10 }}
      />
      <ButtonPressAnimation onPress={handlePressChangeWallet}>
        <Row>
          <AccountName deviceWidth={deviceWidth}>{accountName}</AccountName>
          <DropdownArrow>
            <Icon color={colors.dark} direction="down" name="caret" />
          </DropdownArrow>
        </Row>
      </ButtonPressAnimation>
      <RowWithMargins align="center" margin={19}>
        <ProfileAction
          icon="copy"
          onPress={handlePressCopyAddress}
          radiusWrapperStyle={{ marginRight: 10, width: 150 }}
          scaleTo={0.88}
          text={lang.t('wallet.settings.copy_address_capitalized')}
          width={127}
          wrapperProps={{
            containerStyle: {
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              paddingLeft: 10,
            },
          }}
        />
        <FloatingEmojisRegion setOnNewEmoji={setOnNewEmoji} />
        <ProfileAction
          icon="qrCode"
          onPress={handlePressReceive}
          radiusWrapperStyle={{ marginRight: 10, width: 104 }}
          scaleTo={0.88}
          text={lang.t('button.receive')}
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
      {addCashAvailable && <AddCashButton onPress={handlePressAddCash} />}
      {showBottomDivider && <ProfileMastheadDivider />}
    </Column>
  );
}
