import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Switch } from 'react-native-gesture-handler';
import StepIndicator from '../../../components/step-indicator/StepIndicator';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Box, Inline, Row, Rows, Separator, Stack, Text } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';

const RegisterContent = ({
  accentColor,
  sendReverseRecord,
  setSendReverseRecord,
}: {
  accentColor: any;
  sendReverseRecord: boolean;
  setSendReverseRecord: React.Dispatch<React.SetStateAction<boolean>> | null;
}) => {
  const { navigate } = useNavigation();
  const openPrimaryENSNameHelper = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, { type: 'ens_primary_name' });
  }, [navigate]);

  return (
    <>
      <Box paddingTop="24px">
        <StepIndicator currentStep={3} steps={3} />
      </Box>
      <Rows>
        <Row>
          <Box flexGrow={1} justifyContent="center" paddingHorizontal="24px">
            <Stack space="24px">
              <Text align="center" color="primary (Deprecated)" containsEmoji size="23px / 27px (Deprecated)" weight="heavy">
                {lang.t('profiles.confirm.last_step')} 💈
              </Text>
              <Text align="center" color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
                {lang.t('profiles.confirm.last_step_description')}
              </Text>
            </Stack>
          </Box>
        </Row>
        <Row height="content">
          <Stack space="19px (Deprecated)">
            <Separator color="divider80 (Deprecated)" />
            <Inline alignHorizontal="justify" alignVertical="center">
              <Inline>
                <Text color="secondary80 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
                  {`${lang.t('profiles.confirm.set_ens_name')} `}
                </Text>
                <ButtonPressAnimation onPress={openPrimaryENSNameHelper} scaleTo={0.9}>
                  <Text color="secondary30 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
                    􀅵
                  </Text>
                </ButtonPressAnimation>
              </Inline>
              <Switch
                disabled={!setSendReverseRecord}
                onValueChange={() => setSendReverseRecord?.(sendReverseRecord => !sendReverseRecord)}
                testID="ens-reverse-record-switch"
                thumbColor={colors.white}
                trackColor={{
                  false: android ? colors.lightGrey : colors.white,
                  true: accentColor,
                }}
                value={sendReverseRecord}
              />
            </Inline>
          </Stack>
        </Row>
      </Rows>
    </>
  );
};

export default RegisterContent;
