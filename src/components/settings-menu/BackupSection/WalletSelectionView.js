import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { cloudPlatform } from '../../../utils/platform';
import Divider from '../../Divider';
import { ButtonPressAnimation } from '../../animations';
import { BottomRowText } from '../../coin-row';
import { ContactAvatar } from '../../contacts';
import { Icon } from '../../icons';
import { Centered, Column, ColumnWithMargins, Row } from '../../layout';
import { Text, TruncatedAddress } from '../../text';
import Caret from '@rainbow-me/assets/family-dropdown-arrow.png';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { useManageCloudBackups, useWallets } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import styled from '@rainbow-me/styled-components';
import { fonts, padding } from '@rainbow-me/styles';
import { abbreviations } from '@rainbow-me/utils';

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  source: Caret,
  tintColor: colors.alpha(colors.blueGreyDark, 0.6),
}))({
  height: 18,
  marginTop: 15,
  width: 8,
});

const Address = styled(TruncatedAddress).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  firstSectionLength: 6,
  size: fonts.size.lmedium,
  truncationLength: 4,
  weight: 'regular',
}))({});

const AccountLabel = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  size: fonts.size.lmedium,
  weight: 'regular',
}))({});

const CheckmarkIcon = styled(Icon).attrs({
  name: 'checkmarkCircled',
})({
  alignSelf: 'center',
  marginBottom: 1,
  marginRight: 7,
});

const GreenCheck = styled(CheckmarkIcon).attrs(({ theme: { colors } }) => ({
  color: colors.green,
}))({
  shadowColor: ({ theme: { colors, isDarkMode } }) =>
    colors.alpha(isDarkMode ? colors.shadow : colors.green, 0.4),
  shadowOffset: { height: 4, width: 0 },
  shadowRadius: 6,
});

const GreyCheck = styled(CheckmarkIcon).attrs(({ theme: { colors } }) => ({
  color: colors.blueGreyDark50,
}))({
  shadowColor: ({ theme: { colors, isDarkMode } }) =>
    colors.alpha(isDarkMode ? colors.shadow : colors.blueGreyDark50, 0.4),
  shadowOffset: { height: 4, width: 0 },
  shadowRadius: 6,
});

const WarningIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.orangeLight,
  name: 'warning',
}))({
  alignSelf: 'center',
  marginRight: 7,
  shadowColor: ({ theme: { colors, isDarkMode } }) =>
    colors.alpha(isDarkMode ? colors.shadow : colors.orangeLight, 0.4),
  shadowOffset: { height: 4, width: 0 },
  shadowRadius: 6,
});

const Footer = styled(Centered)({
  alignItems: 'flex-end',
  flex: 1,
  ...padding.object(19, 15, 30),
});

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
    <ScrollView>
      {Object.keys(wallets)
        .filter(key => wallets[key].type !== WalletTypes.readOnly)
        .map(key => {
          const wallet = wallets[key];
          const visibleAccounts = wallet.addresses.filter(a => a.visible);
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
            <Column key={key}>
              <ButtonPressAnimation
                onPress={() =>
                  onPress(key, label || abbreviations.address(address, 4, 6))
                }
                scaleTo={0.98}
              >
                <Row height={56}>
                  <Row alignSelf="center" flex={1} marginLeft={15}>
                    <ContactAvatar
                      alignSelf="center"
                      color={color}
                      marginRight={10}
                      size="smedium"
                      value={labelOrName || `${index + 1}`}
                    />
                    <ColumnWithMargins margin={3} marginBottom={0.5}>
                      <Row>
                        {labelOrName ? (
                          <AccountLabel>{labelOrName}</AccountLabel>
                        ) : (
                          <Address address={address} />
                        )}
                      </Row>
                      {totalAccounts > 1 ? (
                        <BottomRowText weight={fonts.weight.medium}>
                          {totalAccounts > 2
                            ? lang.t('wallet.back_ups.and_more_wallets', {
                                moreWalletCount: totalAccounts - 1,
                              })
                            : lang.t('wallet.back_ups.and_1_more_wallet')}
                        </BottomRowText>
                      ) : wallet.backedUp ? (
                        wallet.backupType === WalletBackupTypes.cloud ? (
                          <BottomRowText weight={fonts.weight.medium}>
                            {lang.t('wallet.back_ups.backed_up')}
                          </BottomRowText>
                        ) : (
                          <BottomRowText weight={fonts.weight.medium}>
                            {lang.t('wallet.back_ups.backed_up_manually')}
                          </BottomRowText>
                        )
                      ) : wallet.imported ? (
                        <BottomRowText weight={fonts.weight.medium}>
                          {lang.t('wallet.back_ups.imported')}
                        </BottomRowText>
                      ) : (
                        <BottomRowText
                          color={colors.orangeLight}
                          weight={fonts.weight.medium}
                        >
                          {lang.t('back_up.needs_backup.not_backed_up')}
                        </BottomRowText>
                      )}
                    </ColumnWithMargins>
                  </Row>
                  <Row alignSelf="center" height={47} marginRight={18}>
                    {wallet.backedUp ? (
                      wallet.backupType === WalletBackupTypes.cloud ? (
                        <GreenCheck isDarkMode={isDarkMode} />
                      ) : (
                        <GreyCheck isDarkMode={isDarkMode} />
                      )
                    ) : wallet.imported ? (
                      <GreyCheck />
                    ) : (
                      <WarningIcon />
                    )}

                    <CaretIcon />
                  </Row>
                </Row>
              </ButtonPressAnimation>
              <Divider color={colors.rowDividerFaint} inset={[0, 15, 0]} />
            </Column>
          );
        })}
      {cloudBackedUpWallets > 0 && (
        <Footer>
          <ButtonPressAnimation onPress={manageCloudBackups}>
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.6)}
              letterSpacing="roundedMedium"
              size="lmedium"
              weight="semibold"
            >
              􀍢{' '}
              {lang.t('back_up.cloud.manage_platform_backups', {
                cloudPlatformName: cloudPlatform,
              })}
            </Text>
          </ButtonPressAnimation>
        </Footer>
      )}
    </ScrollView>
  );
};

export default WalletSelectionView;
