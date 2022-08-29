import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Switch } from 'react-native-gesture-handler';
import StepIndicator from '../../../components/step-indicator/StepIndicator';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import { Box, Divider, Inline, Row, Rows, Stack, Text } from '@/design-system';
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
              <Text
                align="center"
                color="primary"
                containsEmoji
                size="23px"
                weight="heavy"
              >
                {lang.t('profiles.confirm.last_step')} 💈
              </Text>
              <Text
                align="center"
                color="secondary60"
                size="16px"
                weight="semibold"
              >
                {lang.t('profiles.confirm.last_step_description')}
              </Text>
            </Stack>
          </Box>
        </Row>
        <Row height="content">
          <Stack space="19px">
            <Divider />
            <Inline alignHorizontal="justify" alignVertical="center">
              <Inline>
                <Text color="secondary80" size="16px" weight="bold">
                  {`${lang.t('profiles.confirm.set_ens_name')} `}
                </Text>
                <ButtonPressAnimation
                  onPress={openPrimaryENSNameHelper}
                  scaleTo={0.9}
                >
                  <Text color="secondary30" size="16px" weight="bold">
                    􀅵
                  </Text>
                </ButtonPressAnimation>
              </Inline>
              <Switch
                disabled={!setSendReverseRecord}
                onValueChange={() =>
                  setSendReverseRecord?.(
                    sendReverseRecord => !sendReverseRecord
                  )
                }
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
