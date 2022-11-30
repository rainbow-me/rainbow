import {
  Bleed,
  Box,
  Column,
  Columns,
  DebugLayout,
  Inset,
  Row,
  Rows,
  Separator,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import React from 'react';
import { GradientText, Text as RNText } from '../text';
import { Icon } from '../icons';
import { cloudPlatform } from '../../utils/platform';
import { deviceUtils } from '@/utils';
import lang from 'i18n-js';
import { AddWalletItem } from './AddWalletRow';
import { AddWalletList } from './AddWalletList';

// device width - horizontal inset (60) - caret column width (30)
const CONTENT_WIDTH = deviceUtils.dimensions.width - 90;

const RainbowText =
  IS_ANDROID && IS_TEST
    ? Text
    : styled(GradientText).attrs(({ theme: { colors } }: any) => ({
        angle: false,
        colors: colors.gradients.rainbow,
        end: { x: 0, y: 0.5 },
        start: { x: 1, y: 0.5 },
        steps: [0, 0.774321, 1],
      }))({});

const TextIcon = styled(RNText).attrs({
  size: 29,
  weight: 'medium',
})({});

const CaretIcon = styled(Icon).attrs(({ color }: { color: string }) => ({
  name: 'caret',
  color: color,
}))({
  marginBottom: 5.25,
});

export const RestoreSheetFirstStep = ({ walletsBackedUp }: any) => {
  const { colors } = useTheme();
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const restoreFromCloud: AddWalletItem = {
    title: lang.t(
      'back_up.restore_sheet.from_backup.restore_from_cloud_platform',
      { cloudPlatformName: cloudPlatform }
    ),
    description: IS_IOS
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
        : lang.t('back_up.restore_sheet.from_backup.ios.you_have_1_wallet')
      : lang.t(
          'back_up.restore_sheet.from_backup.non_ios.if_you_previously_backed_up',
          {
            cloudPlatformName: cloudPlatform,
          }
        ),
    icon: '􀌍',
  };

  const restoreFromSeed: AddWalletItem = {
    title: lang.t('back_up.restore_sheet.from_key.secret_phrase_title'),
    description: lang.t(
      'back_up.restore_sheet.from_key.secret_phrase_description'
    ),
    icon: '􀑚',
    iconColor: colors.purple,
  };

  return (
    <AddWalletList
      items={[restoreFromCloud, restoreFromSeed]}
      horizontalInset={30}
    />
  );
};
