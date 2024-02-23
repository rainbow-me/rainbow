import lang from 'i18n-js';
import React from 'react';
import LargeCountdownClock from '../../../components/large-countdown-clock/LargeCountdownClock';
import StepIndicator from '../../../components/step-indicator/StepIndicator';
import { Box, Heading, Inset, Row, Rows, Stack, Text } from '@/design-system';
import { ENS_SECONDS_WAIT } from '@/helpers/ens';

const WaitENSConfirmationContent = ({ seconds }: { seconds: number | undefined }) => (
  <>
    <Box paddingTop="24px">
      <StepIndicator currentStep={2} steps={3} />
    </Box>
    <Rows alignHorizontal="center">
      <Row>
        <Box flexGrow={1} justifyContent="center">
          <Inset horizontal="34px (Deprecated)">
            <Stack space="34px (Deprecated)">
              <LargeCountdownClock initialSeconds={ENS_SECONDS_WAIT} onFinished={() => {}} seconds={seconds || ENS_SECONDS_WAIT} />
              <Stack alignHorizontal="center" space="19px (Deprecated)">
                <Heading color="primary (Deprecated)" size="23px / 27px (Deprecated)" weight="heavy">
                  {lang.t('profiles.confirm.wait_one_minute')}
                </Heading>
                <Text align="center" color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
                  {lang.t('profiles.confirm.wait_one_minute_description')}
                </Text>
              </Stack>
            </Stack>
          </Inset>
        </Box>
      </Row>
    </Rows>
  </>
);

export default WaitENSConfirmationContent;
