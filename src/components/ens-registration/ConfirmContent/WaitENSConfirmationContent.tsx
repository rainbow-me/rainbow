import * as i18n from '@/languages';
import React from 'react';
import LargeCountdownClock from '../../../components/large-countdown-clock/LargeCountdownClock';
import StepIndicator from '../../../components/step-indicator/StepIndicator';
import { Box } from '@/design-system/components/Box/Box';
import { Heading } from '@/design-system/components/Heading/Heading';
import { Inset } from '@/design-system/components/Inset/Inset';
import { Row, Rows } from '@/design-system/components/Rows/Rows';
import { Stack } from '@/design-system/components/Stack/Stack';
import { Text } from '@/design-system/components/Text/Text';
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
                  {i18n.t(i18n.l.profiles.confirm.wait_one_minute)}
                </Heading>
                <Text align="center" color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
                  {i18n.t(i18n.l.profiles.confirm.wait_one_minute_description)}
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
