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
import { IS_ANDROID, IS_TEST } from '@/env';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import React from 'react';
import { GradientText, Text as RNText } from '../text';
import { Icon } from '../icons';
import { cloudPlatform } from '../../utils/platform';
import { deviceUtils } from '@/utils';
import * as i18n from '@/languages';

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
  return (
    // <DebugLayout>
    <Inset horizontal={{ custom: 30 }} vertical="24px">
      <Stack
        space="24px"
        separator={<Separator color="divider60 (Deprecated)" />}
      >
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box width={{ custom: CONTENT_WIDTH }}>
            <Stack space="12px" alignHorizontal="left">
              <RainbowText colors={colors}>
                <TextIcon>􀌍</TextIcon>
              </RainbowText>
              <RainbowText colors={colors}>
                <Text size="20pt" weight="bold" color="label">
                  {lang.t(
                    'back_up.restore_sheet.from_backup.restore_from_cloud_platform',
                    { cloudPlatformName: cloudPlatform }
                  )}
                </Text>
              </RainbowText>
              <Text size="13pt" weight="semibold" color="labelTertiary">
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
              </Text>
            </Stack>
          </Box>
          <CaretIcon color={labelQuaternary} />
        </Box>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box width={{ custom: CONTENT_WIDTH }}>
            <Stack space="12px" alignHorizontal="left">
              <TextIcon color={colors.purple}>􀑚</TextIcon>
              <Text size="20pt" weight="bold" color="label">
                {lang.t('back_up.restore_sheet.from_key.secret_phrase_title')}
              </Text>
              <Text size="13pt" weight="semibold" color="labelTertiary">
                {lang.t(
                  'back_up.restore_sheet.from_key.secret_phrase_description'
                )}
              </Text>
            </Stack>
          </Box>
          <CaretIcon color={labelQuaternary} />
        </Box>
      </Stack>
    </Inset>
  );
};
