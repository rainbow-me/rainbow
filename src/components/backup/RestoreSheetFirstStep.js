import lang from 'i18n-js';
import { forEach } from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import { useTheme } from '../../theme/ThemeContext';
import { cloudPlatform } from '../../utils/platform';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Column, Row, RowWithMargins } from '../layout';
import { GradientText, Text } from '../text';
import WalletBackupTypes from '@rainbow-me/helpers/walletBackupTypes';
import { useNavigation } from '@rainbow-me/navigation';
import styled from '@rainbow-me/styled-components';
import { deviceUtils } from '@rainbow-me/utils';

const deviceWidth = deviceUtils.dimensions.width;

const Container = styled(Column)({
  marginTop: -8,
});

const CaretIcon = styled(Icon).attrs({
  name: 'caret',
})({
  marginBottom: 5.25,
});

const SheetRow = styled(Row).attrs({
  scaleTo: 0.975,
})({
  paddingHorizontal: 30,
  paddingTop: 11,
  width: '100%',
});

const TitleRow = styled(RowWithMargins)({
  alignItems: 'center',
  justifyContent: 'space-between',
  width: deviceWidth - 60,
});

const RainbowText =
  android && IS_TESTING === 'true'
    ? Text
    : styled(GradientText).attrs(({ theme: { colors } }) => ({
        angle: false,
        colors: colors.gradients.rainbow,
        end: { x: 0, y: 0.5 },
        start: { x: 1, y: 0.5 },
        steps: [0, 0.774321, 1],
      }))({});

const TextIcon = styled(Text).attrs({
  size: 29,
  weight: 'medium',
})({
  height: android ? 45 : 35,
  marginBottom: 7,
  marginTop: 8,
});

const Title = styled(Text).attrs({
  letterSpacing: 'roundedMedium',
  lineHeight: 27,
  size: 'larger',
  weight: 'bold',
})({
  marginBottom: 6,
  maxWidth: 276,
});

const DescriptionText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'left',
  color: colors.alpha(colors.blueGreyDark, 0.4),
  lineHeight: 22,
  size: 'smedium',
  weight: 'medium',
}))({
  maxWidth: 276,
  paddingBottom: 24,
});

export default function RestoreSheetFirstStep({
  onCloudRestore,
  onManualRestore,
  onWatchAddress,
  userData,
}) {
  const { setParams } = useNavigation();
  const { colors } = useTheme();

  const walletsBackedUp = useMemo(() => {
    let count = 0;
    forEach(userData?.wallets, wallet => {
      if (wallet.backedUp && wallet.backupType === WalletBackupTypes.cloud) {
        count++;
      }
    });
    return count;
  }, [userData]);

  const enableCloudRestore = android || walletsBackedUp > 0;
  useEffect(() => {
    setParams({ enableCloudRestore });
  }, [enableCloudRestore, setParams]);

  return (
    <Container>
      {enableCloudRestore && (
        <React.Fragment>
          <SheetRow as={ButtonPressAnimation} onPress={onCloudRestore}>
            <Column>
              <Row>
                <RainbowText colors={colors}>
                  <TextIcon>􀌍</TextIcon>
                </RainbowText>
              </Row>
              <TitleRow>
                <RainbowText colors={colors}>
                  <Title>
                    {lang.t(
                      'back_up.restore_sheet.from_backup.restore_from_cloud_platform',
                      { cloudPlatformName: cloudPlatform }
                    )}
                  </Title>
                </RainbowText>
                <CaretIcon />
              </TitleRow>
              <DescriptionText>
                {ios
                  ? // It is not possible for the user to be on iOS and have
                    // no backups at this point, since `enableCloudRestore`
                    // would be false in that case.
                    walletsBackedUp > 1
                    ? lang.t(
                        'back_up.restore_sheet.from_backup.ios.you_have_multiple_wallets',
                        {
                          walletsBackedUpCount: walletsBackedUp,
                        }
                      )
                    : lang.t(
                        'back_up.restore_sheet.from_backup.ios.you_have_1_wallet'
                      )
                  : lang.t(
                      'back_up.restore_sheet.from_backup.non_ios.if_you_previously_backed_up',
                      {
                        cloudPlatformName: cloudPlatform,
                      }
                    )}
              </DescriptionText>
            </Column>
          </SheetRow>
          <Divider color={colors.rowDividerExtraLight} inset={[0, 30]} />
        </React.Fragment>
      )}
      <SheetRow
        as={ButtonPressAnimation}
        onPress={onManualRestore}
        scaleTo={0.9}
        testID="restore-with-key-button"
      >
        <Column>
          <TextIcon color={colors.purple}>􀑚</TextIcon>
          <TitleRow justify="space-between" width="100%">
            <Title>
              {lang.t('back_up.restore_sheet.from_key.secret_phrase_title')}
            </Title>
            <CaretIcon />
          </TitleRow>
          <DescriptionText>
            {lang.t('back_up.restore_sheet.from_key.secret_phrase_description')}
          </DescriptionText>
        </Column>
      </SheetRow>
      <Divider color={colors.rowDividerExtraLight} inset={[0, 30]} />

      <SheetRow
        as={ButtonPressAnimation}
        onPress={onWatchAddress}
        scaleTo={0.9}
        testID="watch-address-button"
      >
        <Column>
          <TextIcon color={colors.mintDark}>􀒒</TextIcon>
          <TitleRow justify="space-between" width="100%">
            <Title>
              {lang.t('back_up.restore_sheet.watch_address.watch_title')}
            </Title>
            <CaretIcon />
          </TitleRow>
          <DescriptionText>
            {lang.t('back_up.restore_sheet.watch_address.watch_description')}
          </DescriptionText>
        </Column>
      </SheetRow>
    </Container>
  );
}
