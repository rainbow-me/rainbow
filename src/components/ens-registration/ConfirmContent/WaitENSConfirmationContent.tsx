import lang from 'i18n-js';
import React from 'react';
import LargeCountdownClock from '../../../components/large-countdown-clock/LargeCountdownClock';
import StepIndicator from '../../../components/step-indicator/StepIndicator';
import { Box, Heading, Inset, Row, Rows, Stack, Text } from '@/design-system';
import { ENS_SECONDS_WAIT } from '@/helpers/ens';

const WaitENSConfirmationContent = ({
  seconds,
}: {
  seconds: number | undefined;
}) => (
  <>
    <Box paddingTop="24px">
      <StepIndicator currentStep={2} steps={3} />
    </Box>
    <Rows alignHorizontal="center">
      <Row>
        <Box flexGrow={1} justifyContent="center">
          <Inset horizontal="34px">
            <Stack space="34px">
              <LargeCountdownClock
                initialSeconds={ENS_SECONDS_WAIT}
                onFinished={() => {}}
                seconds={seconds || ENS_SECONDS_WAIT}
              />
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
  </>
);

export default WaitENSConfirmationContent;
