import React, { useCallback } from 'react';
import { ScrollView } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../../context/ThemeContext' was resolve... Remove this comment to see the full error message
import { useTheme } from '../../../context/ThemeContext';
import { cloudPlatform } from '../../../utils/platform';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../Divider' was resolved to '/Users/nic... Remove this comment to see the full error message
import Divider from '../../Divider';
import { ButtonPressAnimation } from '../../animations';
import { BottomRowText } from '../../coin-row';
import { ContactAvatar } from '../../contacts';
import { Icon } from '../../icons';
import { Centered, Column, ColumnWithMargins, Row } from '../../layout';
import { Text, TruncatedAddress } from '../../text';
import Caret from '@rainbow-me/assets/family-dropdown-arrow.png';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletBack... Remove this comment to see the full error message
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/walletType... Remove this comment to see the full error message
import WalletTypes from '@rainbow-me/helpers/walletTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useManageCloudBackups, useWallets } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { abbreviations } from '@rainbow-me/utils';

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  source: Caret,
  tintColor: colors.alpha(colors.blueGreyDark, 0.6),
}))`
  height: 18;
  margin-top: 15;
  width: 8;
`;

const Address = styled(TruncatedAddress).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  firstSectionLength: 6,
  size: fonts.size.lmedium,
  truncationLength: 4,
  weight: 'regular',
}))``;

const AccountLabel = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  size: fonts.size.lmedium,
  weight: 'regular',
}))``;

const CheckmarkIcon = styled(Icon).attrs({
  name: 'checkmarkCircled',
})`
  align-self: center;
  margin-bottom: 1px;
  margin-right: 7px;
`;

const GreenCheck = styled(CheckmarkIcon).attrs(({ theme: { colors } }) => ({
  color: colors.green,
}))`
  box-shadow: 0px 4px 6px
    ${({ theme: { colors, isDarkMode } }) =>
      colors.alpha(isDarkMode ? colors.shadow : colors.green, 0.4)};
`;

const GreyCheck = styled(CheckmarkIcon).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark50,
}))`
  box-shadow: 0px 4px 6px
    ${({ theme: { colors, isDarkMode } }) =>
      colors.alpha(isDarkMode ? colors.shadow : colors.blueGreyDark50, 0.4)};
`;

const WarningIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.orangeLight,
  name: 'warning',
}))`
  align-self: center;
  box-shadow: 0px 4px 6px
    ${({ theme: { colors, isDarkMode } }) =>
      colors.alpha(isDarkMode ? colors.shadow : colors.orangeLight, 0.4)};
  margin-right: 7px;
`;

const Footer = styled(Centered)`
  flex: 1;
  align-items: flex-end;
  ${padding(19, 15, 30)};
`;

const WalletSelectionView = () => {
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { walletNames, wallets } = useWallets();
  const { manageCloudBackups } = useManageCloudBackups();
  const onPress = useCallback(
    (walletId, name) => {
      const wallet = wallets[walletId];
      if (wallet.backedUp || wallet.imported) {
        navigate('SettingsBackupView', {
          imported: wallet.imported,
          title: name,
          type: 'AlreadyBackedUpView',
          walletId,
        });
      } else {
        navigate('SettingsBackupView', {
          title: name,
          type: 'NeedsBackupView',
          walletId,
        });
      }
    },
    [navigate, wallets]
  );

  let cloudBackedUpWallets = 0;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ScrollView>
      {Object.keys(wallets)
        .filter(key => wallets[key].type !== WalletTypes.readOnly)
        .map(key => {
          const wallet = wallets[key];
          const visibleAccounts = wallet.addresses.filter(
            (a: any) => a.visible
          );
          const account = visibleAccounts[0];
          const totalAccounts = visibleAccounts.length;
          const { color, label, index, address } = account;
          if (wallet.backupType === WalletBackupTypes.cloud) {
            cloudBackedUpWallets += 1;
          }
          let labelOrName = label;
          if (!label) {
            if (walletNames[address]) {
              labelOrName = walletNames[address];
            }
          }

          return (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Column key={key}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <ButtonPressAnimation
                onPress={() =>
                  onPress(key, label || abbreviations.address(address, 4, 6))
                }
                scaleTo={0.98}
              >
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Row height={56}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Row alignSelf="center" flex={1} marginLeft={15}>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <ContactAvatar
                      alignSelf="center"
                      color={color}
                      marginRight={10}
                      size="smedium"
                      value={labelOrName || `${index + 1}`}
                    />
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <ColumnWithMargins margin={3} marginBottom={0.5}>
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <Row>
                        {labelOrName ? (
                          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <AccountLabel>{labelOrName}</AccountLabel>
                        ) : (
                          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <Address address={address} />
                        )}
                      </Row>
                      {totalAccounts > 1 ? (
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <BottomRowText weight={fonts.weight.medium}>
                          And {totalAccounts - 1} more{' '}
                          {totalAccounts > 2 ? `wallets` : `wallet`}
                        </BottomRowText>
                      ) : wallet.backedUp ? (
                        wallet.backupType === WalletBackupTypes.cloud ? (
                          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <BottomRowText weight={fonts.weight.medium}>
                            Backed up
                          </BottomRowText>
                        ) : (
                          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <BottomRowText weight={fonts.weight.medium}>
                            Backed up manually
                          </BottomRowText>
                        )
                      ) : wallet.imported ? (
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <BottomRowText weight={fonts.weight.medium}>
                          Imported
                        </BottomRowText>
                      ) : (
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <BottomRowText
                          color={colors.orangeLight}
                          weight={fonts.weight.medium}
                        >
                          Not backed up
                        </BottomRowText>
                      )}
                    </ColumnWithMargins>
                  </Row>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Row alignSelf="center" height={47} marginRight={18}>
                    {wallet.backedUp ? (
                      wallet.backupType === WalletBackupTypes.cloud ? (
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <GreenCheck isDarkMode={isDarkMode} />
                      ) : (
                        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                        <GreyCheck isDarkMode={isDarkMode} />
                      )
                    ) : wallet.imported ? (
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <GreyCheck />
                    ) : (
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <WarningIcon />
                    )}
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <CaretIcon />
                  </Row>
                </Row>
              </ButtonPressAnimation>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Divider color={colors.rowDividerFaint} inset={[0, 15, 0]} />
            </Column>
          );
        })}
      {cloudBackedUpWallets > 0 && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Footer>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ButtonPressAnimation onPress={manageCloudBackups}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.6)}
              letterSpacing="roundedMedium"
              size="lmedium"
              weight="semibold"
            >
              􀍢 Manage {cloudPlatform} Backups
            </Text>
          </ButtonPressAnimation>
        </Footer>
      )}
    </ScrollView>
  );
};

export default WalletSelectionView;
