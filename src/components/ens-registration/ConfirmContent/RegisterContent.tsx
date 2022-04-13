import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Switch } from 'react-native-gesture-handler';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Box, Inline, Stack, Text } from '@rainbow-me/design-system';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';

const RegisterContent = ({
  accentColor,
  sendReverseRecord,
  setSendReverseRecord,
}: {
  accentColor: any;
  sendReverseRecord: boolean;
  setSendReverseRecord: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { navigate } = useNavigation();
  const openPrimaryENSNameHelper = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, { type: 'ens_primary_name' });
  }, [navigate]);

  return (
    <Box paddingHorizontal="30px">
      <Box height="4/5">
        <Stack space="12px">
          <Text
            align="center"
            color="primary"
            containsEmoji
            size="23px"
            weight="bold"
          >
            {lang.t('profiles.confirm.last_step')} 💈
          </Text>
          <Text align="center" color="secondary60" size="16px" weight="bold">
            {lang.t('profiles.confirm.last_step_description')}
          </Text>
        </Stack>
      </Box>
      <Box height="1/5">
        <Inline alignHorizontal="justify" alignVertical="center">
          <ButtonPressAnimation
            onPress={openPrimaryENSNameHelper}
            scaleTo={0.9}
          >
            <Text color="secondary80" size="16px" weight="bold">
              {lang.t('profiles.confirm.set_ens_name')} 􀅵
            </Text>
          </ButtonPressAnimation>
          <Switch
            disabled={!setSendReverseRecord}
            onValueChange={() =>
              setSendReverseRecord?.(sendReverseRecord => !sendReverseRecord)
            }
            testID="ens-reverse-record-switch"
            trackColor={{ false: colors.white, true: accentColor }}
            value={sendReverseRecord}
          />
        </Inline>
      </Box>
    </Box>
  );
};

export default RegisterContent;
