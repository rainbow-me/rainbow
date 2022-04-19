import lang from 'i18n-js';
import React from 'react';
import { LargeCountdownClock } from '../../../components/large-countdown-clock';
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

const WaitENSConfirmationContent = () => {
  return (
    <Box flexGrow={1}>
      <Box paddingTop="24px">
        <StepIndicator currentStep={2} steps={3} />
      </Box>
      <Rows alignHorizontal="center">
        <Row>
          <Box flexGrow={1} justifyContent="center">
            <Inset horizontal="42px">
              <Stack space="34px">
                <LargeCountdownClock onFinished={() => {}} seconds={60} />
                <Stack alignHorizontal="center" space="19px">
                  <Heading size="23px">
                    {lang.t('profiles.confirm.wait_one_minute')}
                  </Heading>
                  <Text align="center" color="secondary60" weight="semibold">
                    {lang.t('profiles.confirm.wait_one_minute_description')}
                  </Text>
                </Stack>
              </Stack>
            </Inset>
          </Box>
        </Row>
      </Rows>
    </Box>
  );
};

export default WaitENSConfirmationContent;
