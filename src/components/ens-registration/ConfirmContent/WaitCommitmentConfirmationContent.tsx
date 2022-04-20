import lang from 'i18n-js';
import React from 'react';
import {
  ButtonPressAnimation,
  HourglassAnimation,
} from '../../../components/animations';
import { StepIndicator } from '../../../components/step-indicator';
import {
  Box,
  Heading,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';

const WaitCommitmentConfirmationContent = ({
  accentColor,
  action,
}: {
  accentColor: any;
  action: () => void;
}) => {
  return (
    <Box flexGrow={1} paddingHorizontal="30px">
      <Box paddingTop="24px">
        <StepIndicator currentStep={1} steps={3} />
      </Box>
      <Rows alignHorizontal="center">
        <Row>
          <Box flexGrow={1} justifyContent="center">
            <Inset horizontal="42px">
              <Stack space="34px">
                <HourglassAnimation />
                <Stack alignHorizontal="center" space="19px">
                  <Heading size="23px">
                    {lang.t('profiles.confirm.transaction_pending')}
                  </Heading>
                  <Text align="center" color="secondary60" weight="semibold">
                    {lang.t('profiles.confirm.transaction_pending_description')}
                  </Text>
                </Stack>
              </Stack>
            </Inset>
          </Box>
        </Row>
        <Row height="content">
          <ButtonPressAnimation onPress={action}>
            <Text
              color={{ custom: accentColor }}
              containsEmoji
              size="16px"
              weight="heavy"
            >
              {`🚀 ${lang.t('profiles.confirm.speed_up')}`}
            </Text>
          </ButtonPressAnimation>
        </Row>
      </Rows>
    </Box>
  );
};

export default WaitCommitmentConfirmationContent;
